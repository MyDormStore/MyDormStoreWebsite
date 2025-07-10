import express, { Request, Response } from "express";
import cors from "cors";

import StripeRouter from "./routes/stripe";
import ShopifyRouter from "./routes/shopify";
// import { webhook } from "./controller/stripe";

const app = express();
const port = 3000;

// setting up middlewares
app.options("/{*any}", cors());
app.use(cors());
app.use(express.json());

app.use("/Stripe", StripeRouter);
app.use("/Shopify", ShopifyRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, TypeScript with Express!");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

export default app;
