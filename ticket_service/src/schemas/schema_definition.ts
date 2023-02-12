import { FlightType } from "../utils/types";

export interface GetTicketsRequest {
  origin: string;
  destination: string;
  departure_date: string;
  passengersCount: number;
}

export interface GetTransactionRequest {
  amount: number;
  callback: string;
}

export interface SubmitPurchaseRequest {
  amount: number;
  flightId: string;
  flightType: FlightType;
  transactionId: number;
  transactionResult: number;
}

export interface GetUserInfoResponse {
  id: string;
  first_name: string;
  last_name: string;
}
