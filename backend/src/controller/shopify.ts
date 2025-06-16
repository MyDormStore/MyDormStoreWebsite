import { Request, Response } from "express";
import { client } from "../services/shopify";
const queryString = `{
  products (first: 3) {
    edges {
      node {
        id
        title
      }
    }
  }
}`;
export const getProducts = async (req: Request, res: Response) => {
    const { data, errors, extensions } = await client.request(queryString);

    res.send(data);
};

const orderMutation = `
mutation {
  orderCreate(order: {
    currency: CAD,
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
