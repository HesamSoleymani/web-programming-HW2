import "dotenv/config";
import { Response } from "express";
import { Pool } from "pg";
import {
  GetTicketsRequest,
  SubmitPurchaseRequest,
} from "../schemas/schema_definition";
import { RequestBody, UserTicket } from "../utils/types";
import { getUserInfo } from "./tickets.consume";

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DB,
  password: process.env.PASS,
  port: +process.env.PORT!,
});

export const getTickets = (
  req: RequestBody<GetTicketsRequest>,
  res: Response
) =>
  pool.query(
    `
    SELECT * FROM available_offers WHERE 
    origin = '${req.body.origin}' 
    AND destination = '${req.body.destination}' 
    AND (y_class_free_capacity >= ${req.body.passengersCount} 
      OR j_class_free_capacity >= ${req.body.passengersCount} 
      OR f_class_free_capacity >= ${req.body.passengersCount})
    AND departure_local_time >= '${req.body.departure_date}'::date
    AND departure_local_time < ('${req.body.departure_date}'::date + '1 day'::interval)
    `,
    (error, results) => {
      return error
        ? res.status(500).send(error)
        : res.status(200).send(results.rows);
    }
  );

export const submitPurchase = (
  req: RequestBody<SubmitPurchaseRequest>,
  res: Response
) =>
  getUserInfo(
    req.cookies.access_token,
    (user) =>
      pool.query(
        `
        SELECT flight_serial FROM flight WHERE
        flight_id = '${req.body.flightId}'
        `,
        (error, results) => {
          if (error) return res.status(500).send(error);
          pool.query(
            `
            INSERT INTO purchase 
            (corresponding_user_id,title,first_name,last_name,
              flight_serial,offer_price,offer_class,transaction_id,transaction_result) 
            VALUES ('${user.id}','ticket','${user.first_name}','${user.last_name}',
              '${results.rows[0].flight_serial}',${req.body.amount},'${req.body.flightType}',
              '${req.body.transactionId}','${req.body.transactionResult}')
            `,
            (error, results) => {
              return error
                ? res.status(500).send(error)
                : res
                    .status(200)
                    .send("Purchase has been inserted successfully.");
            }
          );
        }
      ),
    (error) => res.status(500).send(error)
  );

export const getUserTickets = (req: RequestBody, res: Response) =>
  getUserInfo(
    req.cookies.access_token,
    (user) =>
      pool
        .query(
          `
        SELECT flight_serial FROM purchase WHERE
        corresponding_user_id = '${user.id}'
        `
        )
        .then((purchases) => {
          let userTickets: UserTicket[] = [];
          purchases.rows.forEach(async (purchase) => {
            await pool
              .query(
                `
              SELECT flight_id FROM flight WHERE
              flight_serial = '${purchase.flight_serial}'
              `
              )
              .then((results) => {
                pool
                  .query(
                    `
                  SELECT * FROM available_offers 
                  WHERE flight_id = '${results.rows[0].flight_id}'
                  `
                  )
                  .then(async (tickets) => {
                    const ticket = tickets.rows[0];
                    await userTickets.push({
                      id: ticket.flight_id,
                      origin: ticket.origin,
                      destination: ticket.destination,
                      departure_date: ticket.departure_local_time,
                      arrival_date: ticket.arrival_local_time,
                      duration: ticket.duration,
                      flightType: purchase.offer_class,
                    });
                  })
                  .catch((error) => res.status(500).send(error));
              })
              .catch((error) => res.status(500).send(error));
            console.log(userTickets);
          });
          res.status(200).send(userTickets);
        })
        .catch((error) => res.status(500).send(error)),
    (error) => res.status(500).send(error)
  );
