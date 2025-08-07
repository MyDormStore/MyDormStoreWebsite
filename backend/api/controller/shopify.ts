import { Request, Response } from "express";
import {
    calculateDraftOrder,
    calculateFinalAmount,
    createOrder,
} from "../utils/shopify";

export const orderCreation = async (req: Request, res: Response) => {
    const payload = req.body;

    const data = await createOrder(payload);
    if (!data) {
        res.status(500).json({ error: "Failed to create order" }).end();
    }

    res.send(data);
};

export const calculateOrder = async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await calculateDraftOrder(payload);
    if (!data) {
        res.status(500).json({ error: "Failed to calculate draft order" }).end;
    }
    res.status(200).json(data.draftOrderCalculate.calculatedDraftOrder);
};

export const finalAmount = async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await calculateFinalAmount(payload);
    if (!data) {
        res.status(500)
            .json({ error: "Failed to calculate final amount" })
            .end();
    }
    res.status(200).json(data.totalPriceSet.shopMoney.amount);
};
