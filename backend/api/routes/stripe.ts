import express, { Router } from "express";
import {
    createCheckoutSession,
    createPaymentIntent,
    getPaymentIntent,
} from "../controller/stripe";

const router = Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/create-payment-intent/", createPaymentIntent); // amount is an integer
router.get("/payment-intent/:id", getPaymentIntent);

export default router;
