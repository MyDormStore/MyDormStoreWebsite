import { Router } from "express";
import { createOrder, getProducts } from "../controller/shopify";

const router = Router();

router.get("/products", getProducts);
router.post("/order", createOrder);

export default router;
