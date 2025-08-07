import { Router } from "express";
import { calculateOrder, orderCreation } from "../controller/shopify";

const router = Router();

router.post("/order", orderCreation);
router.post("/calculate", calculateOrder);

export default router;
