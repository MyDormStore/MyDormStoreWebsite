import express, { Request, Response } from "express";
import cors from "cors";

import StripeRouter from "./routes/stripe";

const app = express();
const port = 3000;

// setting up middlewares
app.use(cors({ origin: true }));
// app.use(express.json());
app.use(express.raw({ type: "*/*" }));

app.use("/Stripe", StripeRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, TypeScript with Express!");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
