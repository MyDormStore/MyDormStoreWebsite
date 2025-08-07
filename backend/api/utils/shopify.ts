import { client } from "../services/shopify";
import { LineItems, Order, Payload } from "../types/types";

const orderMutation = `
mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
      orderCreate(order: $order, options: $options) {
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
    const {
        lineItems,
        deliveryDetails,
        taxLines,
        shipping,
        amount,
        secondaryDetails,
        notInCart,
        rp_id,
        dorm,
        school,
    } = payload;

    const { shippingAddress, firstName, lastName, email, phoneNumber } =
        deliveryDetails;

    const cartItems = lineItems.flatMap((item) => {
        if (item.attributes) {
            const index = item.attributes.findIndex(
                (attribute) => attribute.key === "__byob"
            );

            if (index === -1) {
                return [
                    {
                        variantId: item.variantId,
                        quantity: item.quantity,
                        requiresShipping: true,
                    },
                ];
            }

            let productItems: Array<any> = [];
            try {
                const products: Array<any> = JSON.parse(
                    item.attributes[index]?.value || "[]"
                );
                productItems = products.map((product: any) => ({
                    variantId: `gid://shopify/ProductVariant/${product.id}`,
                    quantity: product.quantity,
                    requiresShipping: true,
                }));
            } catch (err) {
                console.error("Failed to parse BYOB JSON:", err);
            }

            return [
                {
                    variantId: item.variantId,
                    quantity: item.quantity,
                    requiresShipping: true,
                },
                ...productItems,
            ];
        }

        return [
            {
                variantId: item.variantId,
                quantity: item.quantity,
                requiresShipping: true,
            },
        ];
    });

    const order: Order = {
        currency: "CAD",
        financialStatus: "PAID",
        lineItems: cartItems,
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
        taxLines: taxLines?.length
            ? [{ ...taxLines[0], title: "HST" }]
            : undefined,
        billingAddress: undefined,
        transactions: {
            amountSet: {
                shopMoney: {
                    amount: amount / 100,
                    currencyCode: "CAD",
                },
            },
        },
        customAttributes: [],
    };

    // Add custom attributes conditionally
    if (shipping.moveInDate) {
        order.customAttributes?.push({
            key: "Move In Date",
            value: new Date(shipping.moveInDate).toDateString(),
        });
    }

    if (notInCart?.length) {
        order.customAttributes?.push({
            key: "Not In Cart",
            value: notInCart.join(", "),
        });
    }

    if (rp_id) {
        order.customAttributes?.push({ key: "rp_id", value: rp_id });
    }

    if (dorm) {
        order.customAttributes?.push({ key: "Dorm", value: dorm });
    }

    if (school) {
        order.customAttributes?.push({ key: "School", value: school });
    }

    if (secondaryDetails?.toggleSecondaryDetails) {
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

    try {
        const { data, errors } = await client.request(orderMutation, {
            variables: {
                order: order,
                options: {
                    sendReceipt: true,
                    sendFulfillmentReceipt: true,
                },
            },
        });

        if (errors) {
            console.error("GraphQL errors:", errors);
            return { errors };
        }

        const userErrors = data.orderCreate.userErrors;
        if (userErrors?.length > 0) {
            console.error("User errors:", userErrors);
            return { userErrors };
        }

        return data.orderCreate.order.id;
    } catch (err) {
        console.error("Request failed:", err);
        return { error: "Failed to create order" };
    }
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

    const { shippingAddress, firstName, lastName, email, phoneNumber } =
        deliveryDetails;

    console.log(payload);

    const cartItems = lineItems.flatMap((item) => {
        if (item.attributes) {
            const index = item.attributes.findIndex(
                (attribute) => attribute.key === "__byob"
            );
            if (index === -1) {
                return {
                    variantId: item.variantId,
                    quantity: item.quantity,
                };
            }

            const discountedPrice = item.attributes.find(
                (attribute) => attribute.key === "__totalByob"
            )?.value;

            if (discountedPrice && parseFloat(discountedPrice) > 0) {
                const products: Array<any> = JSON.parse(
                    item.attributes[index].value
                );

                let total = 0;

                const productItems = products.flatMap((product: any) => {
                    total += parseFloat(product.price) / 100;
                    return {
                        variantId: `gid://shopify/ProductVariant/${product.id}`,
                        quantity: product.quantity,
                    };
                });

                return [
                    {
                        variantId: item.variantId,
                        quantity: item.quantity,
                    },
                    ...productItems,
                ];
            }
        }
        return {
            variantId: item.variantId,
            quantity: item.quantity,
        };
    });

    let draftOrder: any = {
        lineItems: cartItems,
        email: email,
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

    const { data, errors } = await client.request(draftOrderCalculateMutation, {
        variables: { input: draftOrder },
    });

    if (errors) {
        console.error(errors);
        return;
    }

    console.log(JSON.stringify(data));

    return data;
};
