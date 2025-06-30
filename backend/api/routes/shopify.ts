import { Router } from "express";
import {
    calculateOrder,
    orderCreation,
    draftOrder,
} from "../controller/shopify";

const router = Router();

router.post("/order", orderCreation);
router.post("/draft", draftOrder);
router.post("/calculate", calculateOrder);

export default router;
