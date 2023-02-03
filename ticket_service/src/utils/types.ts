import { Request } from "express";

export type RequestBody<T = {}> = Request<{}, {}, T>;

export enum FlightType {
  economyClass = "economyClass",
  businessClass = "businessClass",
  firstClass = "firstClass",
}

export interface GetTransactionIdResponse {
  transactionId: number;
}

export type Ticket = {
  [className in FlightType]: {
    price: number;
    seats: number;
  };
} & {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  arrival_date: string;
  duration: number;
};

export interface UserTicket extends Omit<Ticket, FlightType> {
  flightType: FlightType;
}
