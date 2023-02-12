import express, { Express } from "express";
import { ticketsRouter } from "./api/tickets.routes";
import cookieParser from "cookie-parser";

const app: Express = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use("/tickets", ticketsRouter);

app.get("/", (req, res) => {
  res.json(process.env.PASS);
});

app.listen(port, () => {
  console.log(`sharif-airways tickets service listening on port ${port}`);
});
