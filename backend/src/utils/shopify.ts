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
    const { lineItems, customer, deliveryDetails, taxLines, shipping } =
        payload;

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
                title: shipping.service,
                priceSet: {
                    shopMoney: {
                        amount: shipping.cost,
                        currencyCode: "CAD",
                    },
                },
            },
        ],
        taxLines: [{ ...taxLines[0], title: "HST" }],
        billingAddress: undefined,
    };

    if (toggleSecondaryDetails && secondaryDetails) {
        order["billingAddress"] = {
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

const draftOrderMutation = `
mutation CreateDraftOrder($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;

export const createDraftOrder = async (payload: Payload) => {
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

    let draftOrder: any = {
        lineItems: lineItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
        })),
        email: email,
        phone: phoneNumber,
        shippingAddress: {
            firstName,
            lastName,
            address1: shippingAddress.street,
            city: shippingAddress.city,
            countryCode: shippingAddress.country,
            zip: shippingAddress.postalCode,
            provinceCode: shippingAddress.state,
        },
        useCustomerDefaultAddress: false,
    };

    if (toggleSecondaryDetails && secondaryDetails) {
        draftOrder.billingAddress = {
            firstName: secondaryDetails.firstName,
            lastName: secondaryDetails.lastName,
            address1: secondaryDetails.billingAddress.street,
            city: secondaryDetails.billingAddress.city,
            countryCode: secondaryDetails.billingAddress.country,
            zip: secondaryDetails.billingAddress.postalCode,
            provinceCode: secondaryDetails.billingAddress.state,
        };
    }

    const { data, errors } = await client.request(draftOrderMutation, {
        variables: { input: draftOrder },
    });

    if (errors) {
        console.error(errors);
        return;
    }

    return data.draftOrderCreate.draftOrder;
};

const draftOrderCalculateMutation = `
mutation CalculateDraftOrder($input: DraftOrderInput!) {
    draftOrderCalculate(input: $input) {
        calculatedDraftOrder {
            availableShippingRates {
                title
                price {
                    amount
                    currencyCode    
                }
            }
            taxLines {
                rate
                priceSet {
                    shopMoney {
                        amount
                        currencyCode    
                    }
                }
            }
            currencyCode
            lineItems {
                title
                quantity
                requiresShipping
            }
            totalPriceSet {
                shopMoney {
                    amount
                    currencyCode
                }
            }
        }
    }
}
`;

export const calculateDraftOrder = async (payload: Payload) => {
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

    let draftOrder: any = {
        lineItems: lineItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
        })),
        email: email,
        phone: phoneNumber,
        shippingAddress: {
            firstName,
            lastName,
            address1: shippingAddress.street,
            city: shippingAddress.city,
            countryCode: shippingAddress.country,
            zip: shippingAddress.postalCode,
            provinceCode: shippingAddress.state,
        },
        useCustomerDefaultAddress: false,
    };

    if (toggleSecondaryDetails && secondaryDetails) {
        draftOrder.billingAddress = {
            firstName: secondaryDetails.firstName,
            lastName: secondaryDetails.lastName,
            address1: secondaryDetails.billingAddress.street,
            city: secondaryDetails.billingAddress.city,
            countryCode: secondaryDetails.billingAddress.country,
            zip: secondaryDetails.billingAddress.postalCode,
            provinceCode: secondaryDetails.billingAddress.state,
        };
    }

    console.log(JSON.stringify(draftOrder, null, 2));

    const { data, errors } = await client.request(draftOrderCalculateMutation, {
        variables: { input: draftOrder },
    });

    if (errors) {
        console.error(errors);
        return;
    }

    return data;
};
