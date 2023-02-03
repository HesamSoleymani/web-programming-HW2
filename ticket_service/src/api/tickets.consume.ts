import axios from "axios";
import { GetUserInfoResponse } from "../schemas/schema_definition";
import { AuthServiceUrl, MockedBankingSystemUrl } from "../utils/config";
import { GetTransactionIdResponse } from "../utils/types";
import FormData from "form-data";

export const getTransactionId = (
  data: FormData,
  onSuccess: (response: GetTransactionIdResponse) => void,
  onError: (error: any) => void
) => {
  axios
    .post(`${MockedBankingSystemUrl}/transaction/`, data)
    .then((response) => {
      onSuccess(response.data);
    })
    .catch((error) => {
      onError(error);
    });
};

export const getUserInfo = (
  token: string,
  onSuccess: (response: GetUserInfoResponse) => void,
  onError: (error: any) => void
) => {
  axios
    .post(`${AuthServiceUrl}/getUserInfo`, token)
    .then((response) => {
      onSuccess(response.data);
    })
    .catch((error) => {
      onError(error);
    });
};
