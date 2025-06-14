import { Router } from "express";
import {
    createCheckoutSession,
    createPaymentIntent,
    webhook,
} from "../controller/stripe";

const router = Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/create-payment-intent", createPaymentIntent);
router.post("/webhook", webhook);

export default router;
