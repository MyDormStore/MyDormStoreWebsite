import express, { Router } from "express";
import {
    createCheckoutSession,
    createPaymentIntent,
} from "../controller/stripe";

const router = Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/create-payment-intent/", createPaymentIntent); // amount is an integer

export default router;
