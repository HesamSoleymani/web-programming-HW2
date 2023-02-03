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
    req.cookies.get("access_token"),
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
            VALUES ('${user.id}','ticket','${user.name}','${user.lastname}',
              '${results.rows[0].flight_serial}',${req.body.amount},'${req.body.flightType}',
              '${req.body.transactionId}','${req.body.transactionResult}')
            `,
            (error, results) => {
              return error ? res.status(500).send(error) : res.status(200);
            }
          );
        }
      ),
    (error) => res.status(500).send(error)
  );

export const getUserTickets = (req: RequestBody, res: Response) =>
  getUserInfo(
    req.cookies.get("access_token"),
    (user) =>
      pool.query(
        `
        SELECT flight_serial FROM purchase WHERE
        corresponding_user_id = '${user.id}'
        `,
        (error, purchases) => {
          if (error) return res.status(500).send(error);
          let userTickets: UserTicket[] = [];
          purchases.rows.forEach((purchase) =>
            pool.query(
              `
              SELECT flight_id FROM flight WHERE
              flight_serial = '${purchase.flight_serial}'
              `,
              (error, results) => {
                if (error) return res.status(500).send(error);
                pool.query(
                  `
                  SELECT * FROM available_offers 
                  WHERE flight_id = '${results.rows[0].flight_id}'
                  `,
                  (error, tickets) => {
                    if (error) return res.status(500).send(error);
                    const ticket = tickets.rows[0];
                    userTickets.push({
                      id: ticket.flight_id,
                      origin: ticket.origin,
                      destination: ticket.destination,
                      departure_date: ticket.departure_local_time,
                      arrival_date: ticket.arrival_local_time,
                      duration: ticket.duration,
                      flightType: purchase.offer_class,
                    });
                  }
                );
              }
            )
          );
          res.status(200).send(userTickets);
        }
      ),
    (error) => res.status(500).send(error)
  );
