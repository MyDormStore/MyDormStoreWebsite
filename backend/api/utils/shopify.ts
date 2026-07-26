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
// Minimal query — only id + name to avoid field-compatibility errors.
// PI matching uses Shopify order tags (searchable via the query filter)
// so we don't need customAttributes in the query at all.
const checkForDuplicateOrderQuery = `
query CheckExistingOrder($query: String!) {
  orders(first: 5, query: $query) {
    nodes {
      id
      name
    }
  }
}`;

/**
 * Check if a matching order already exists in Shopify.
 *
 * Layer 1 (most reliable): search for an order tagged with the same PI
 * Layer 2 (fallback):      any paid order from the same email in last 48h
 *
 * Both layers use a minimal GraphQL query (id + name only) to avoid
 * field-level errors that caused v2 to silently fail.
 */
async function checkForDuplicateOrder(
    email: string,
    totalAmountCents: number,
    paymentIntentId?: string,
): Promise<{ id?: string; orderNumber?: string } | null> {
    try {
        // Layer 1: Match by PaymentIntent tag (exact match, most reliable)
        if (paymentIntentId) {
            const piQuery = `tag:"${paymentIntentId}"`;
            console.log(`[dedup] Layer 1 — searching by PI tag: ${piQuery}`);

            try {
                const { data, errors } = await client.request(
                    checkForDuplicateOrderQuery,
                    { variables: { query: piQuery } },
                );

                if (errors) {
                    console.error("[dedup] Layer 1 GraphQL errors:", JSON.stringify(errors));
                } else if (data?.orders?.nodes?.length) {
                    const match = data.orders.nodes[0];
                    console.log(`[dedup] PI tag match found: order ${match.name}`);
                    return { id: match.id, orderNumber: match.name };
                } else {
                    console.log("[dedup] Layer 1 — no PI tag match");
                }
            } catch (err) {
                console.error("[dedup] Layer 1 threw:", err);
            }
        }

        // Layer 2: Any recent paid order from same email (catches same-session dupes)
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const emailQuery = `email:"${email}" financial_status:paid created_at:>=${since}`;
        console.log(`[dedup] Layer 2 — searching by email: ${emailQuery}`);

        try {
            const { data, errors } = await client.request(
                checkForDuplicateOrderQuery,
                { variables: { query: emailQuery } },
            );

            if (errors) {
                console.error("[dedup] Layer 2 GraphQL errors:", JSON.stringify(errors));
                return null;
            }

            if (data?.orders?.nodes?.length) {
                const match = data.orders.nodes[0];
                console.log(`[dedup] Email match found: order ${match.name} for ${email}`);
                return { id: match.id, orderNumber: match.name };
            }
        } catch (err) {
            console.error("[dedup] Layer 2 threw:", err);
        }

        console.log(`[dedup] No duplicate found for ${email}`);
        return null;
    } catch (error) {
        console.error("[dedup] Duplicate check THREW:", error);
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

    // ── Duplicate check (PI + email/total) ───────────────────────────
    const duplicateOrder = await checkForDuplicateOrder(
        email,
        Math.round(payload.amount),
        stripePaymentIntentId,
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

    // If any line item is missing an amount, force CAD so Shopify uses default prices.
    // This prevents USD orders with no priceSet from being rejected.
    const hasAllAmounts = lineItems.every(
        (item) => item.amount !== undefined && item.amount !== null && !isNaN(Number(item.amount)),
    );
    const orderCurrency = hasAllAmounts
        ? (payload.currency || "CAD").toUpperCase()
        : "CAD";

    if (!hasAllAmounts && payload.currency && payload.currency.toUpperCase() !== "CAD") {
        console.log(
            `[order] Forcing CAD — line items missing amounts (original currency: ${payload.currency})`,
        );
    }

    const cartItems = lineItems.flatMap((item) => {
        const lineItemBase: any = {
            variantId: item.variantId,
            quantity: item.quantity,
            requiresShipping: true,
        };
        // Add priceSet only when amount is a real number AND we have all amounts
        if (hasAllAmounts && item.amount !== undefined && item.amount !== null && !isNaN(Number(item.amount))) {
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
                    // Add priceSet only when all amounts are present
                    if (hasAllAmounts && product.amount !== undefined && product.amount !== null && !isNaN(Number(product.amount))) {
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
        tags: [] as string[],
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
        // Also add as a tag so the dedup query can search by it directly
        (order as any).tags.push(stripePaymentIntentId);
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
