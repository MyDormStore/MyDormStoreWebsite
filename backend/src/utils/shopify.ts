import { client } from "../services/shopify";
import { LineItems, Order, Payload } from "../types/types";

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

export const createOrder = async (payload: Payload) => {
    const { lineItems, customer, deliveryDetails } = payload;

    const {
        shippingAddress,
        secondaryDetails,
        firstName,
        lastName,
        email,
        phoneNumber,
        toggleSecondaryDetails,
    } = deliveryDetails;

    let order: Order = {
        currency: "CAD",
        financialStatus: "PAID",
        lineItems: lineItems.map((item) => ({
            ...item,
            requiresShipping: true,
        })),
        email: email,
        phone: phoneNumber,
        shippingAddress: {
            firstName: firstName,
            lastName: lastName,
            address1: shippingAddress.street,
            city: shippingAddress.city,
            countryCode: shippingAddress.country,
            zip: shippingAddress.postalCode,
            provinceCode: shippingAddress.state,
        },
        test: true,
        shippingLines: [
            {
                title: "Purolator Ground®",
                priceSet: {
                    shopMoney: {
                        amount: 10.0,
                        currencyCode: "CAD",
                    },
                },
            },
        ],
    };

    if (toggleSecondaryDetails && secondaryDetails) {
        order.billingAddress = {
            firstName: secondaryDetails.firstName,
            lastName: secondaryDetails.lastName,
            address1: secondaryDetails.billingAddress.street,
            city: secondaryDetails.billingAddress.city,
            countryCode: secondaryDetails.billingAddress.country,
            zip: secondaryDetails.billingAddress.postalCode,
            provinceCode: secondaryDetails.billingAddress.state,
        };
    }

    console.log(order);

    const { data, errors } = await client.request(orderMutation, {
        variables: {
            order: order,
        },
    });

    if (errors) {
        console.error(errors);
        return;
    }

    return data.orderCreate.order.id;
};
