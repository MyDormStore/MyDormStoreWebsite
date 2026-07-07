import { Request, Response } from "express";
import {
    calculateDraftOrder,
    calculateFinalAmount,
    createOrder,
} from "../utils/shopify";

export const orderCreation = async (req: Request, res: Response) => {
    const payload = req.body;

    const result = await createOrder(payload);
    if (!result.ok) {
        res.status(500)
            .json({ error: result.error, details: result.details })
            .end();
        return;
    }

    res.status(200).json(result);
};

export const calculateOrder = async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await calculateDraftOrder(payload);
    if (result.error) {
        res.status(500).json({
            error: "Failed to calculate draft order",
            details: result.error,
        });
        return;
    }
    res.status(200).json(result.data.draftOrderCalculate.calculatedDraftOrder);
};

export const finalAmount = async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await calculateFinalAmount(payload);
    if (result.error) {
        res.status(500)
            .json({
                error: "Failed to calculate final amount",
                details: result.error,
            })
            .end();
        return;
    }
    res.status(200).json(result.data.totalPriceSet.shopMoney.amount);
};
