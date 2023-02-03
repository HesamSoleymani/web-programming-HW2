import Ajv from "ajv";
import express, { NextFunction, Response, Router } from "express";
import FormData from "form-data";
import { GetTransactionRequest } from "../schemas/schema_definition";
import _schema from "../schemas/_schema";
import { receipt_id } from "../utils/config";
import { GetTransactionIdResponse, RequestBody } from "../utils/types";
import { getTransactionId, getUserInfo } from "./tickets.consume";
import { getTickets, getUserTickets, submitPurchase } from "./tickets.queries";

export const ticketsRouter: Router = express.Router();

const ajv = new Ajv();
function schemaValidator(schema: object) {
  const validate = ajv.compile(schema);
  return (req: any, res: any, next: NextFunction) => {
    if (!validate(req.body)) return res.status(400).json(validate.errors);
    return next();
  };
}

ticketsRouter.get("/", schemaValidator(_schema.GetTicketsRequest), getTickets);

ticketsRouter.post(
  "/transaction",
  schemaValidator(_schema.GetTransactionRequest),
  (
    req: RequestBody<GetTransactionRequest>,
    res: Response<GetTransactionIdResponse>
  ) => {
    getUserInfo(
      req.cookies.get("access_token"),
      (user) => {
        const formData = new FormData();
        formData.append("amount", req.body.amount.toString());
        formData.append("receipt_id", receipt_id);
        formData.append("callback", req.body.callback);
        getTransactionId(
          formData,
          ({ transactionId }) => res.status(200).send({ transactionId }),
          (error) => res.status(500).send(error)
        );
      },
      (error) => res.status(500).send(error)
    );
  }
);

ticketsRouter.post(
  "/purchase",
  schemaValidator(_schema.SubmitPurchaseRequest),
  submitPurchase
);

ticketsRouter.post("/user", getUserTickets);
