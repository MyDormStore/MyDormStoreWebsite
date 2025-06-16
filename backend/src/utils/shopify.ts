import { client } from "../services/shopify";
import { LineItems } from "../types/types";

const orderMutation = `
mutation CreateOrder($order: OrderCreateOrderInput!) {
  orderCreate(order: $order) {
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

export const createOrder = async (lineItems: LineItems[]) => {
    const { data, errors } = await client.request(orderMutation, {
        variables: {
            order: {
                currency: "CAD",
                financialStatus: "PAID",
                lineItems: lineItems,
            },
        },
    });

    if (errors) {
        console.error(errors);
        return;
    }

    return data.orderCreate.order.id;
};
