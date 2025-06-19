import { Request, Response } from "express";
import { client } from "../services/shopify";
import { calculateDraftOrder, createDraftOrder } from "../utils/shopify";

const orderMutation = `
mutation {
  orderCreate(order: {
    currey: CAD,
    financialStatus: PAID
    lineItems: [
      {
        variantId: "gid://shopify/ProductVariant/45179591557282",
        quantity: 1
      }
    ]
  }) {
    order {
      id
    }
    userErrors {
      field
      message
    }
  }
}

`;

export const createOrder = async (req: Request, res: Response) => {
    const { data, errors } = await client.request(orderMutation);

    console.error(errors);
    res.send(data);
};

export const draftOrder = async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await createDraftOrder(payload);
    if (!data) {
        res.status(500).json({ error: "Failed to create draft order" }).end;
    }
    res.status(200).json(data);
};

export const calculateOrder = async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await calculateDraftOrder(payload);
    if (!data) {
        res.status(500).json({ error: "Failed to calculate draft order" }).end;
    }
    res.status(200).json(data.draftOrderCalculate.calculatedDraftOrder);
};
