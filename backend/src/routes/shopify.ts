import { Router } from "express";
import {
    createOrder,
    getAvailableRates,
    // getProducts,
    // getProductsByDorm,
} from "../controller/shopify";

const router = Router();

// router.get("/products", getProducts);
// router.get("/products/:dorm", getProductsByDorm);

router.post("/order", createOrder);
router.get("/rates", getAvailableRates);
export default router;
