import { Request, Response } from "express";
import { client } from "../services/shopify";
import {
    calculateDraftOrder,
    createDraftOrder,
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

export const draftOrder = async (req: Request, res: Response) => {
    const payload = req.body;
    // const data = await createDraftOrder(payload);
    // if (!data) {
    //     res.status(500).json({ error: "Failed to create draft order" }).end;
    // }
    res.status(200).json(payload);
};

export const calculateOrder = async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await calculateDraftOrder(payload);
    if (!data) {
        res.status(500).json({ error: "Failed to calculate draft order" }).end;
    }
    res.status(200).json(data.draftOrderCalculate.calculatedDraftOrder);
};
