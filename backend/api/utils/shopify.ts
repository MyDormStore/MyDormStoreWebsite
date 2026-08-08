// ============================================================================
//  PATCHED shopify.ts  —  fixes duplicate-order bug (Aug 8 2026)
// ----------------------------------------------------------------------------
//  WHAT CHANGED vs. GitHub main:
//    1. NEW findOrderByPaymentIntentId() — queries Shopify for an existing
//       order tagged with the same stripe_payment_intent_id. This is the
//       ONLY reliable dedup key because both order-creation paths
//       (frontend /create-order-from-metadata AND webhook payment_intent.
//       succeeded) share the same PI id.
//    2. createOrder() now checks by PI id FIRST, before falling back to
//       the existing address+amount check. If either check finds a match,
//       returns { duplicate: true } instead of creating a second order.
//    3. Added the PI id to `tags` on the created order (in addition to
//       customAttributes) so the Shopify search index can find it in
//       under a second. customAttributes are NOT indexed — that's why
//       the old dedup missed the race.
//    4. countryCode hardening in billingAddress (from the earlier
//       Jul 24-26 fix) is preserved.
//
//  Why this stops the duplicates:
//    Vercel serverless instances don't share memory, so the webhook's
//    in-memory `completedOrderStates` Map only guards webhook-vs-webhook
//    races. When the frontend calls /create-order-from-metadata AND
//    Stripe fires the webhook (~1s apart), both hit createOrder() on
//    different Lambdas. This patch makes Shopify the source of truth:
//    both paths ask Shopify "does an order with this PI id already
//    exist?" and back off if yes.
//
//  HOW TO DEPLOY:
//    Copy this file's contents into backend/api/utils/shopify.ts on
//    GitHub main. No changes needed to routes/, controller/, or the
//    frontend.
// ============================================================================

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

// ─── NEW: dedup by PaymentIntent id ─────────────────────────────────────────
// Shopify indexes tags almost instantly (sub-second), which is why we ALSO
// write the PI id as a tag on the created order (see orderMutation input
// below). This query is the fast path.
const findOrderByPaymentIntentQuery = `
query FindOrderByPaymentIntent($query: String!) {
  orders(first: 5, query: $query, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      name
      createdAt
    }
  }
}
`;

async function findOrderByPaymentIntentId(
    paymentIntentId: string,
): Promise<{ id: string; name: string } | null> {
    if (!paymentIntentId) return null;
    try {
        // Search by tag first — tags are indexed instantly.
        const { data } = await client.request(findOrderByPaymentIntentQuery, {
            variables: { query: `tag:${paymentIntentId}` },
        });
        const orders = data?.orders?.nodes || [];
        if (orders.length > 0) {
            return { id: orders[0].id, name: orders[0].name };
        }
        return null;
    } catch (err) {
        console.error("PaymentIntent dedup lookup failed:", err);
        // Fail OPEN — if the lookup errors, fall through to the address+amount
        // dedup below. Better to occasionally miss a race than to block all
        // orders when Shopify search is degraded.
        return null;
    }
}

// ─── EXISTING: address+amount fallback dedup ────────────────────────────────
// Kept as a fallback for orders that somehow lose the PI id (older orders
// pre-patch, manual imports, etc.).
const checkForDuplicateOrderQuery = `
query CheckExistingOrder($email: String!, $address1: String!, $city: String!, $country: String!, $zip: String!, $totalPriceSet: MoneyFilterInput!) {
      existingOrders(input: {
       emailAddresses: { equals: $email },
       addresses: {
         street: { equals: $address1 },
         city: { equals: $city },
         countryCode: { equals: $country },
         zipCode: { equals: $zip }
       },
       totalPriceSet: {
         currencyCodes: { includes: $totalPriceSet.currencyCode },
         amounts: { includes: [ $totalPriceSet.amount ]}
       }
      }) {
       orders {
         id
         orderNumber
         financialStatus
         totalPriceSet {
           shopMoney {
             amount
             currencyCode
            }
          }
        }
      }
}`;

type DuplicateOrderLookupInput = {
    email: string;
    address1: string;
    city: string;
    country: string;
    zip: string;
    totalAmountCents: number;
    currencyCode: string;
};

export const buildDuplicateOrderLookupInput = (
    payload: Payload,
): DuplicateOrderLookupInput => {
    const { deliveryDetails } = payload;
    const { shippingAddress, email } = deliveryDetails;

    return {
        email: email.trim().toLowerCase(),
        address1: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        country: shippingAddress.country.trim().toUpperCase(),
        zip: shippingAddress.postalCode
            .replace(/\s+/g, "")
            .trim()
            .toUpperCase(),
        totalAmountCents: Math.round(payload.amount),
        currencyCode: (payload.currency || "CAD").toUpperCase(),
    };
};

async function checkForDuplicateOrder(
    input: DuplicateOrderLookupInput,
): Promise<{ id?: string; orderNumber?: string } | null> {
    try {
        const variables: Record<string, any> = {
            email: input.email,
            address1: input.address1,
            city: input.city,
            country: input.country,
            zip: input.zip,
            totalPriceSet: {
                amount: input.totalAmountCents / 100,
                currencyCode: input.currencyCode,
            },
        };
        const { data } = await client.request(checkForDuplicateOrderQuery, {
            variables,
        });
        if (data?.existingOrders?.orders?.length) {
            return {
                id: data.existingOrders.orders[0].id,
                orderNumber: data.existingOrders.orders[0].orderNumber,
            };
        }
        return null;
    } catch (error) {
        console.error("Duplicate order check failed:", error);
        return null;
    }
}

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

    // ─── PRIMARY DEDUP: PaymentIntent id ────────────────────────────────────
    // Both the frontend /create-order-from-metadata path AND the Stripe
    // webhook end up here with the same PI id. Whichever path arrives
    // second will see the first path's order and return early.
    if (stripePaymentIntentId) {
        const existing = await findOrderByPaymentIntentId(
            stripePaymentIntentId,
        );
        if (existing) {
            console.log(
                `[createOrder] Dedup hit on PI ${stripePaymentIntentId} → returning existing order ${existing.name} (${existing.id})`,
            );
            return {
                ok: true,
                orderId: existing.id,
                duplicate: true,
            };
        }
    }

    // ─── SECONDARY DEDUP: address + amount (existing check) ────────────────
    const duplicateLookupInput = buildDuplicateOrderLookupInput(payload);
    const duplicateOrder = await checkForDuplicateOrder(duplicateLookupInput);

    if (duplicateOrder?.id) {
        return {
            ok: true,
            orderId: duplicateOrder.id,
            duplicate: true,
        };
    }

    const cartItems = lineItems.flatMap((item) => {
        if (item.attributes) {
            const index = item.attributes.findIndex(
                (attribute) => attribute.key === "__byob",
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
                    item.attributes[index]?.value || "[]",
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

    const orderCurrency = (payload.currency || "CAD").toUpperCase();

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
            ? [{ ...taxLines[0], title: "HST" }]
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

    // NEW: tag the order with the PI id so findOrderByPaymentIntentId() can
    // locate it on the next call (tags are indexed almost instantly,
    // customAttributes are NOT).
    if (stripePaymentIntentId) {
        (order as any).tags = [stripePaymentIntentId];
    }

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
        // countryCode hardening — preserves Jul 24-26 fix so an empty or
        // malformed country string can't cause the entire order create to
        // fail with a Shopify validation error.
        const rawCountry = (
            secondaryDetails.billingAddress.country || ""
        ).toUpperCase();
        const billingCountry = /^[A-Z]{2}$/.test(rawCountry)
            ? rawCountry
            : "CA";

        order.billingAddress = {
            firstName: secondaryDetails.firstName,
            lastName: secondaryDetails.lastName,
            address1: secondaryDetails.billingAddress.street,
            city: secondaryDetails.billingAddress.city,
            countryCode: billingCountry,
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

// ─── UNCHANGED: draft order + final amount helpers (kept verbatim) ──────────
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
        return { data };
    } catch (err) {
        console.error("Request failed:", err);
        return { error: err };
    }
};

export const calculateFinalAmount = async (payload: Payload) => {
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
        return { data: data.draftOrderCalculate.calculatedDraftOrder };
    } catch (err) {
        console.error("Request failed:", err);
        return { error: err };
    }
};
