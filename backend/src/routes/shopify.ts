import { Router } from "express";
import { calculateOrder, createOrder, draftOrder } from "../controller/shopify";

const router = Router();

router.post("/order", createOrder);
router.post("/draft", draftOrder);
router.post("/calculate", calculateOrder);

export default router;
