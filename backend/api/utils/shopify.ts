import { client } from "../services/shopify";
import { LineItems, Order, Payload } from "../types/types";
export type OrderCreationResult =
    | {
          ok: true;
          orderId: string;
          duplicate: boolean;
      }
    | {
          ok: false;
          error: string;
          details?: unknown;
      };
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

// ── Duplicate detection ─────────────────────────────────────────────
const checkForDuplicateOrderQuery = `
query CheckExistingOrder($query: String!) {
  orders(first: 10, query: $query, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      name
      financialStatus
      createdAt
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
    }
  }
}`;

/**
 * Check if a matching order already exists in Shopify.
 * Searches for paid orders from the same email in the last 48 hours
 * with a similar total (within $1 tolerance).
 *
 * To disable: have this function return null.
 * To tighten: reduce the time window or tolerance.
 */
async function checkForDuplicateOrder(
    email: string,
    totalAmountCents: number,
): Promise<{ id?: string; orderNumber?: string } | null> {
    try {
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const searchQuery = `email:${email} financial_status:paid created_at:>=${since}`;

        const { data } = await client.request(checkForDuplicateOrderQuery, {
            variables: { query: searchQuery },
        });

        const orders = data?.orders?.nodes;
        if (!orders?.length) return null;

        const payloadTotal = totalAmountCents / 100;

        const match = orders.find((order: any) => {
            const orderTotal = parseFloat(
                order.totalPriceSet?.shopMoney?.amount || "0",
            );
            return Math.abs(orderTotal - payloadTotal) < 1.0;
        });

        if (match) {
            console.log(
                `Duplicate detected: existing order ${match.name} matches ` +
                `email=${email} total=${payloadTotal}`,
            );
            return { id: match.id, orderNumber: match.name };
        }

        return null;
    } catch (error) {
        console.error("Duplicate order check failed:", error);
        return null;
    }
}
// ─────────────────────────────────────────────────────────────────────

export const createOrder = async (
    payload: Payload,
): Promise<OrderCreationResult> => {
    const totalAmount = Math.round(payload.amount) / 100;
    const {
        lineItems,
        deliveryDetails,
        taxLines,
        shipping,
        secondaryDetails,
        notInCart,
        rp_id,
        dorm,
        school,
        stripePaymentIntentId,
    } = payload;
    const { shippingAddress, firstName, lastName, email, phoneNumber } =
        deliveryDetails;
    if (!email || !lineItems?.length) {
        return {
            ok: false,
            error: "Missing required order information",
            details: {
                email: Boolean(email),
                lineItems: lineItems?.length ?? 0,
            },
        };
    }

    // ── Duplicate check ──────────────────────────────────────────────
    const duplicateOrder = await checkForDuplicateOrder(
        email,
        Math.round(payload.amount),
    );
    if (duplicateOrder?.id) {
        console.log(
            `Skipping order creation — duplicate of ${duplicateOrder.orderNumber}`,
        );
        return {
            ok: true,
            orderId: duplicateOrder.id,
            duplicate: true,
        };
    }
    // ─────────────────────────────────────────────────────────────────

    const orderCurrency = (payload.currency || "CAD").toUpperCase();
    const cartItems = lineItems.flatMap((item) => {
        const lineItemBase: any = {
            variantId: item.variantId,
            quantity: item.quantity,
            requiresShipping: true,
        };
        // Add priceSet if amount is available (required when currency differs from shop currency)
        if (
            orderCurrency !== "CAD" ||
            (item.amount !== undefined && item.amount > 0)
        ) {
            lineItemBase.priceSet = {
                shopMoney: {
                    amount: String(item.amount),
                    currencyCode: orderCurrency,
                },
            };
        }
        if (item.attributes) {
            const index = item.attributes.findIndex(
                (attribute) => attribute.key === "__byob",
            );
            if (index === -1) {
                return [lineItemBase];
            }
            let productItems: Array<any> = [];
            try {
                const products: Array<any> = JSON.parse(
                    item.attributes[index]?.value || "[]",
                );
                productItems = products.map((product: any) => {
                    const productItem: any = {
                        variantId: `gid://shopify/ProductVariant/${product.id}`,
                        quantity: product.quantity,
                        requiresShipping: true,
                    };
                    // Add priceSet for BYOB products if amount is available
                    if (
                        orderCurrency !== "CAD" ||
                        (product.amount !== undefined && product.amount > 0)
                    ) {
                        productItem.priceSet = {
                            shopMoney: {
                                amount: String(product.amount),
                                currencyCode: orderCurrency,
                            },
                        };
                    }
                    return productItem;
                });
            } catch (err) {
                console.error("Failed to parse BYOB JSON:", err);
            }
            return [lineItemBase, ...productItems];
        }
        return [lineItemBase];
    });
    const order: Order = {
        currency: orderCurrency,
        financialStatus: "PAID",
        lineItems: cartItems,
        email: email,
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
                title: shipping.service || "Standard Shipping",
                priceSet: {
                    shopMoney: {
                        amount: shipping.cost,
                        currencyCode: orderCurrency,
                    },
                },
            },
        ],
        taxLines: taxLines?.length
    ? taxLines.map(line => ({
        rate: line.rate,
        priceSet: {
            shopMoney: {
                amount: String(line.priceSet.shopMoney.amount),
                currencyCode: "CAD",
            },
        },
        title: line.title || "Tax",
    }))
    : undefined,
        billingAddress: undefined,
        transactions: {
            amountSet: {
                shopMoney: {
                    amount: totalAmount,
                    currencyCode: orderCurrency,
                },
            },
        },
        customAttributes: [],
    };
    if (phoneNumber) {
        order.customAttributes?.push({
            key: "Phone number",
            value: phoneNumber,
        });
    }
    if (payload.discountCodes) {
        order.customAttributes?.push({
            key: "Discount Codes",
            value: payload.discountCodes.join(", "),
        });
    }
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
    if (stripePaymentIntentId) {
        order.customAttributes?.push({
            key: "stripe_payment_intent_id",
            value: stripePaymentIntentId,
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
    const discountAmount = payload.discountAmount || 0;
    const firstDiscountCode = payload.discountCodes?.[0];
    if (discountAmount > 0 && firstDiscountCode) {
        (order as any).discountCode = {
            itemFixedDiscountCode: {
                code: firstDiscountCode,
                amountSet: {
                    shopMoney: {
                        amount: discountAmount,
                        currencyCode: orderCurrency,
                    },
                },
            },
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
            return {
                ok: false,
                error: "Shopify rejected order creation",
                details: errors,
            };
        }
        const userErrors = data.orderCreate.userErrors;
        if (userErrors?.length > 0) {
            console.error("User errors:", userErrors);
            return {
                ok: false,
                error: "Shopify rejected order creation",
                details: userErrors,
            };
        }
        return {
            ok: true,
            orderId: data.orderCreate.order.id,
            duplicate: false,
        };
    } catch (err) {
        console.error("Request failed:", err);
        return {
            ok: false,
            error: "Failed to create order",
            details: err,
        };
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
    const { lineItems, deliveryDetails } = payload;
    const { shippingAddress, email } = deliveryDetails;
    const cartItems = lineItems.flatMap((item) => {
        if (item.attributes) {
            const byobIndex = item.attributes.findIndex(
                (attr) => attr.key === "__byob",
            );
            const discountedPrice = item.attributes.find(
                (attr) => attr.key === "__totalByob",
            )?.value;
            if (
                byobIndex !== -1 &&
                discountedPrice &&
                parseFloat(discountedPrice) > 0
            ) {
                try {
                    const products: Array<any> = JSON.parse(
                        item.attributes[byobIndex].value,
                    );
                    const productItems = products.map((product: any) => ({
                        variantId: `gid://shopify/ProductVariant/${product.id}`,
                        quantity: product.quantity,
                    }));
                    return [
                        {
                            variantId: item.variantId,
                            quantity: item.quantity,
                        },
                        ...productItems,
                    ];
                } catch (error) {
                    console.error("Failed to parse BYOB JSON:", error);
                    return [
                        {
                            variantId: item.variantId,
                            quantity: item.quantity,
                        },
                    ];
                }
            }
        }
        // Default case
        return [
            {
                variantId: item.variantId,
                quantity: item.quantity,
            },
        ];
    });
    const draftOrder = {
        discountCodes: payload.discountCodes ?? [],
        lineItems: cartItems,
        email,
        shippingAddress: {
            address1: shippingAddress.street,
            city: shippingAddress.city,
            countryCode: shippingAddress.country,
            zip: shippingAddress.postalCode,
            provinceCode: shippingAddress.state,
        },
        useCustomerDefaultAddress: false,
    };
    try {
        const { data, errors } = await client.request(
            draftOrderCalculateMutation,
            {
                variables: { input: draftOrder },
            },
        );
        if (errors) {
            console.error("GraphQL Errors:", errors);
            return { error: errors };
        }
        // console.log("Draft order calculated:", JSON.stringify(data, null, 2));
        return { data };
    } catch (err) {
        console.error("Request failed:", err);
        return { error: err };
    }
};
const finalAmountMutation = `
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
export const calculateFinalAmount = async (payload: Payload) => {
    const { lineItems, deliveryDetails } = payload;
    const { shippingAddress, email } = deliveryDetails;
    const orderCurrency = (payload.currency || "CAD").toUpperCase();
    const cartItems = lineItems.flatMap((item) => {
        const lineItemBase: any = {
            variantId: item.variantId,
            quantity: item.quantity,
        };
        // Add priceSet if amount is available
        if (item.amount !== undefined && item.amount > 0) {
            lineItemBase.priceSet = {
                shopMoney: {
                    amount: String(item.amount),
                    currencyCode: orderCurrency,
                },
            };
        }
        if (item.attributes) {
            const byobIndex = item.attributes.findIndex(
                (attr) => attr.key === "__byob",
            );
            const discountedPrice = item.attributes.find(
                (attr) => attr.key === "__totalByob",
            )?.value;
            if (
                byobIndex !== -1 &&
                discountedPrice &&
                parseFloat(discountedPrice) > 0
            ) {
                try {
                    const products: Array<any> = JSON.parse(
                        item.attributes[byobIndex].value,
                    );
                    const productItems = products.map((product: any) => {
                        const productItem: any = {
                            variantId: `gid://shopify/ProductVariant/${product.id}`,
                            quantity: product.quantity,
                        };
                        if (
                            product.amount !== undefined &&
                            product.amount > 0
                        ) {
                            productItem.priceSet = {
                                shopMoney: {
                                    amount: String(product.amount),
                                    currencyCode: orderCurrency,
                                },
                            };
                        }
                        return productItem;
                    });
                    return [lineItemBase, ...productItems];
                } catch (error) {
                    console.error("Failed to parse BYOB JSON:", error);
                    return [lineItemBase];
                }
            }
        }
        // Default case
        return [lineItemBase];
    });
    const draftOrder = {
        discountCodes: payload.discountCodes ?? [],
        lineItems: cartItems,
        email,
        shippingAddress: {
            address1: shippingAddress.street,
            city: shippingAddress.city,
            countryCode: shippingAddress.country,
            zip: shippingAddress.postalCode,
            provinceCode: shippingAddress.state,
        },
        useCustomerDefaultAddress: false,
    };
    try {
        const { data, errors } = await client.request(
            draftOrderCalculateMutation,
            {
                variables: { input: draftOrder },
            },
        );
        if (errors) {
            console.error("GraphQL Errors:", errors);
            return { error: errors };
        }
        // console.log("Draft order calculated:", JSON.stringify(data, null, 2));
        return { data: data.draftOrderCalculate.calculatedDraftOrder };
    } catch (err) {
        console.error("Request failed:", err);
        return { error: err };
    }
};
