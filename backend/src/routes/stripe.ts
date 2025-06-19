import express, { Router } from "express";
import {
    createCheckoutSession,
    createPaymentIntent,
    webhook,
} from "../controller/stripe";

const router = Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/create-payment-intent/:amount", createPaymentIntent); // amount is an integer

export default router;
