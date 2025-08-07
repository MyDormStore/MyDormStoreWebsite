import { Router } from "express";
import {
    calculateOrder,
    finalAmount,
    orderCreation,
} from "../controller/shopify";

const router = Router();

router.post("/order", orderCreation);
router.post("/calculate", calculateOrder);
router.post("/finalize", finalAmount);

export default router;
