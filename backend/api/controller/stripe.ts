import { Request, Response } from "express";
import Stripe from "stripe";
import { config } from "dotenv";
import { Payload } from "../types/types";
import {
    createOrder,
    OrderCreationResult,
    calculateFinalAmount,
} from "../utils/shopify";
import { trackKlaviyoEvent } from "../utils/klaviyo";
config({ path: ".env" });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const completedOrderStates = new Map<
    string,
    { status: "succeeded" | "failed"; result?: OrderCreationResult }
>();
const inFlightOrderCreations = new Map<string, Promise<void>>();

type StripeMetadata = Record<string, string | number | null | undefined>;

const parseMetadataValue = <T>(value: unknown, fallback: T): T => {
    if (value == null) {
        return fallback;
    }

    if (typeof value === "string") {
        if (!value) {
            return fallback;
        }

        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }

    return value as T;
};

const reconstructLineItemsFromMetadata = (metadata: StripeMetadata): any[] => {
    const parts = Object.keys(metadata)
        .filter((key: string) => key.startsWith("lineItems_part_"))
        .sort((a: string, b: string) => {
            const aIndex = parseInt(a.split("_").pop() ?? "0");
            const bIndex = parseInt(b.split("_").pop() ?? "0");
            return aIndex - bIndex;
        })
        .map((key: string) => metadata[key]);

    const fullJson = parts.join("");
    return fullJson ? JSON.parse(fullJson) : [];
};

export const buildPayloadFromMetadata = (
    metadata: StripeMetadata,
    currencyOverride?: string,
): Payload => {
    return {
        amount: parseFloat(String(metadata.amount ?? 0)),
        currency: (
            currencyOverride ||
            (metadata.currency as string | undefined) ||
            "cad"
        ).toUpperCase(),
        customer: String(metadata.customer ?? ""),
        lineItems: reconstructLineItemsFromMetadata(metadata),
        deliveryDetails: parseMetadataValue(
            metadata.deliveryDetails,
            {} as Payload["deliveryDetails"],
        ),
        taxLines: parseMetadataValue(
            metadata.taxLines,
            [] as unknown as Payload["taxLines"],
        ),
        shipping: parseMetadataValue(
            metadata.shipping,
            {} as Payload["shipping"],
        ),
        discountAmount: metadata.discountAmount
            ? parseFloat(String(metadata.discountAmount))
            : 0,
        discountCodes: metadata.discountCodes
            ? parseMetadataValue(metadata.discountCodes, undefined)
            : undefined,
        secondaryDetails: metadata.secondaryDetails
            ? parseMetadataValue(metadata.secondaryDetails, undefined)
            : undefined,
        notInCart: metadata.notInCart
            ? parseMetadataValue(metadata.notInCart, undefined)
            : undefined,
        rp_id: (metadata.rp_id as string | null | undefined) ?? null,
        dorm: metadata.dorm ? String(metadata.dorm) : undefined,
        school: metadata.school ? String(metadata.school) : undefined,
        stripePaymentIntentId: metadata.stripePaymentIntentId
            ? String(metadata.stripePaymentIntentId)
            : undefined,
    } as Payload;
};

export const createOrderFromMetadata = async (req: Request, res: Response) => {
    const metadata = req.body as StripeMetadata;
    const payload = buildPayloadFromMetadata(metadata);
    const result = await createOrder(payload);

    if (result.ok) {
        res.status(200).json({
            orderId: result.orderId,
            duplicate: result.duplicate,
        });
        return;
    }

    res.status(500).json({ error: result.error, details: result.details });
};

// TODO: initially using checkoutsession but don't need
export const createCheckoutSession = async (req: Request, res: Response) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "T-shirt",
                    },
                    unit_amount: 2000,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        ui_mode: "custom",
        // The URL of your payment completion page
        return_url:
            "https://example.com/return?session_id={CHECKOUT_SESSION_ID}",
    });
    res.json({ checkoutSessionClientSecret: session.client_secret });
};
export const createPaymentIntent = async (req: Request, res: Response) => {
    const payload: Payload = req.body;
    // console.log(payload);
    const amount = req.body.amount;

    // ─────────────────────────────────────────────────────────────────
    //  DIAGNOSTIC LOG (added Aug 19 2026)
    //  Logs every incoming payment intent request so we can debug
    //  customer failures without guessing. Lets us see exactly what
    //  currency/amount/country arrived — the auto-recalc "silent"
    //  bug for anjali.adiceam@gmail.com was invisible before this.
    // ─────────────────────────────────────────────────────────────────
    console.log(
        `[create-payment-intent] IN: email=${
            req.body.deliveryDetails?.email || "(none)"
        }, currency=${req.body.currency}, amount=${amount}, shipCountry=${
            req.body.deliveryDetails?.shippingAddress?.country || "(none)"
        }, shipState=${
            req.body.deliveryDetails?.shippingAddress?.state || "(none)"
        }, shipZip=${
            req.body.deliveryDetails?.shippingAddress?.postalCode || "(none)"
        }`,
    );

    if (!amount) {
        res.status(400).send("Missing amount");
    }

    // ─────────────────────────────────────────────────────────────────
    //  CURRENCY/COUNTRY AUTO-CORRECT (updated Aug 14 2026)
    //  ---------------------------------------------------------------
    //  Shopify Markets converts prices to the customer's browser-locale
    //  currency (a French parent browsing from Paris sees €22.30 even
    //  though they're shipping to their kid's dorm in Waterloo). The
    //  frontend then hands us:
    //    - currency: "eur"
    //    - amount: 2233 (EUR cents)
    //  If we let this through, Stripe rejects because the merchant
    //  account is CAD-only and the amount doesn't match a CAD order.
    //
    //  Previous version REJECTED with a "refresh the page" message —
    //  but refreshing doesn't help when the customer's IP is stuck in
    //  France/Nigeria/etc. They stayed stranded, dozens of retries.
    //
    //  NEW: auto-recalculate the CAD amount server-side by calling
    //  Shopify's draftOrderCalculate (which uses the shop's default
    //  currency = CAD, regardless of the customer's browser locale).
    //  Then swap the payload currency/amount to the correct CAD values
    //  and continue. Customer proceeds to checkout normally. Their
    //  card gets charged in CAD; if their bank presents in EUR, the
    //  bank does the FX conversion.
    // ─────────────────────────────────────────────────────────────────
    const shippingCountryRaw = String(
        payload.deliveryDetails?.shippingAddress?.country || "",
    )
        .toUpperCase()
        .trim();
    const rawCurrencyForCheck = String(req.body.currency || "cad").toLowerCase();
    const ALLOWED_CURRENCY_BY_COUNTRY: Record<string, Set<string>> = {
        CA: new Set(["cad", "usd"]),
        US: new Set(["usd", "cad"]),
    };
    const currencyAllowlist = ALLOWED_CURRENCY_BY_COUNTRY[shippingCountryRaw];
    if (currencyAllowlist && !currencyAllowlist.has(rawCurrencyForCheck)) {
        console.warn(
            `[create-payment-intent] Currency mismatch: shipping to ${shippingCountryRaw} but currency=${rawCurrencyForCheck}, amount=${amount}. Auto-recalculating in CAD via Shopify...`,
        );
        try {
            const recalc = await calculateFinalAmount(payload);
            if (recalc.error || !recalc.data) {
                throw new Error(
                    "Shopify recalc returned no data: " +
                        JSON.stringify(recalc.error || "null"),
                );
            }
            const cadAmountFloat = parseFloat(
                String(
                    (recalc.data as any)?.totalPriceSet?.shopMoney?.amount ||
                        "0",
                ),
            );
            if (!cadAmountFloat || cadAmountFloat <= 0) {
                throw new Error(
                    "Shopify recalc returned invalid amount: " + cadAmountFloat,
                );
            }
            const cadAmountCents = Math.round(cadAmountFloat * 100);
            console.warn(
                `[create-payment-intent] Auto-corrected ${rawCurrencyForCheck} ${amount} → cad ${cadAmountCents} cents (${cadAmountFloat} CAD)`,
            );
            // Overwrite so the rest of this function uses the CAD values
            req.body.currency = "cad";
            req.body.amount = cadAmountCents;
            (payload as any).amount = cadAmountCents;
            (payload as any).currency = "CAD";
        } catch (recalcErr) {
            console.error(
                `[create-payment-intent] Auto-recalc FAILED — falling back to reject:`,
                recalcErr,
            );
            const expected = shippingCountryRaw === "CA" ? "CAD" : "USD";
            const countryName =
                shippingCountryRaw === "CA" ? "Canada" : "the United States";
            res.status(400).json({
                error:
                    "We couldn't process your payment right now. Please email contactus@mydormstore.ca and we'll send you a direct payment link within a few hours.",
                code: "currency_country_mismatch_recalc_failed",
                detected: {
                    currency: rawCurrencyForCheck,
                    shippingCountry: shippingCountryRaw,
                    expected: expected.toLowerCase(),
                },
            });
            return;
        }
    }
    function chunkString(str: string, maxLength: number): string[] {
        const chunks = [];
        for (let i = 0; i < str.length; i += maxLength) {
            chunks.push(str.substring(i, i + maxLength));
        }
        return chunks;
    }
    // 1. Stringify the full lineItems array
    const lineItemsJson = JSON.stringify(payload.lineItems);
    // 2. Chunk into pieces ≤ 500 characters
    const lineItemChunks = chunkString(lineItemsJson, 500);
    // 3. Start building metadata
    //    NOTE (Aug 8 2026): dorm + school MUST be in Stripe metadata so
    //    the webhook path can populate the Residence column on the
    //    Shopify order. Before this fix, only the frontend
    //    /create-order-from-metadata path received dorm/school (via
    //    req.body) — whenever the webhook created the order instead,
    //    Residence came out empty in the ORDER_DETAILS sheet.
    const metadata: { [key: string]: string | number | null } = {
        customer: payload.customer,
        stripePaymentIntentId: null,
        deliveryDetails: JSON.stringify(payload.deliveryDetails),
        taxLines: JSON.stringify(payload.taxLines),
        shipping: JSON.stringify(payload.shipping),
        amount: payload.amount,
        dorm: payload.dorm ?? req.body.dorm ?? null,       // ← added
        school: payload.school ?? req.body.school ?? null, // ← added
        // Pass discount info through so the webhook can apply the
        // discount to the Shopify order it creates.
        discountAmount: req.body.discountAmount ?? 0,
        discountCodes: req.body.discountCodes
            ? JSON.stringify(req.body.discountCodes)
            : null,
        secondaryDetails: payload.secondaryDetails
            ? JSON.stringify(payload.secondaryDetails)
            : null,
        notInCart: payload.notInCart ? JSON.stringify(payload.notInCart) : null,
        rp_id: payload.rp_id ?? null,
    };
    // 4. Add chunked lineItems into metadata
    lineItemChunks.forEach((chunk, index) => {
        metadata[`lineItems_part_${index + 1}`] = chunk;
    });
    // 5. Create or find a Stripe Customer so we can recover abandoned
    //    carts later (failed payments, never-completed checkouts).
    //    Wrapped in try/catch — if this fails for any reason, we fall
    //    through and create the PaymentIntent WITHOUT a customer attached,
    //    so the customer can still complete their purchase.
    let customerId: string | undefined;
    try {
        const email = payload.deliveryDetails?.email;
        if (email) {
            const firstName = payload.deliveryDetails?.firstName || "";
            const lastName = payload.deliveryDetails?.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim();
            const phone = payload.deliveryDetails?.phoneNumber;

            const customerMetadata = {
                last_cart_value_cents: String(payload.amount || 0),
                last_dorm: payload.dorm || "",
                last_school: payload.school || "",
                last_checkout_started_at: new Date().toISOString(),
            };

            // Look for an existing customer with this email first to
            // avoid creating duplicates if the same person checks out
            // multiple times.
            const existing = await stripe.customers.list({
                email,
                limit: 1,
            });

            if (existing.data.length > 0) {
                const updated = await stripe.customers.update(
                    existing.data[0].id,
                    {
                        name: fullName || undefined,
                        phone: phone || undefined,
                        metadata: customerMetadata,
                    },
                );
                customerId = updated.id;
            } else {
                const created = await stripe.customers.create({
                    email,
                    name: fullName || undefined,
                    phone: phone || undefined,
                    metadata: customerMetadata,
                });
                customerId = created.id;
            }
        }
    } catch (err) {
        console.error(
            "Stripe customer setup failed (continuing without customer):",
            err,
        );
        // Intentionally swallow — payment must still go through.
    }

    // 6. Create PaymentIntent
    //    Pull currency off the request body (sent from frontend based on
    //    Shopify cart's currencyCode). Defaults to "cad" if not provided
    //    so older clients keep working.
    //
    //    ─────────────────────────────────────────────────────────────
    //    NEW GUARD (added Aug 2026):
    //    Whitelist currencies to the ones this Stripe account actually
    //    supports. Shopify Markets can hand us deprecated ISO codes
    //    (e.g. "SLL" — renamed to SLE in 2022 when Sierra Leone
    //    redenominated) which Stripe rejects with a 400, killing the
    //    checkout. Anything not in the allowlist falls back to CAD so
    //    the intent still succeeds instead of blocking the customer.
    //    Aug 5 2026: 15 checkout attempts were killed by "sll" — this
    //    prevents that from happening again.
    //    ─────────────────────────────────────────────────────────────
    const ALLOWED_CURRENCIES = new Set(["cad", "usd", "eur", "gbp", "aud"]);
    const rawCurrency = (req.body.currency || "cad").toLowerCase();
    const currency = ALLOWED_CURRENCIES.has(rawCurrency)
        ? rawCurrency
        : "cad";
    if (rawCurrency !== currency) {
        console.warn(
            `[create-payment-intent] Rejected unsupported currency "${rawCurrency}", falling back to "cad"`,
        );
    }
    const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency,
        customer: customerId,
        metadata,
    });

    await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
            ...metadata,
            stripePaymentIntentId: paymentIntent.id,
        },
    });

    // 7. Fire "Started Checkout" event to Klaviyo for abandoned-cart
    //    recovery flows. AWAITED so the Vercel serverless function
    //    doesn't terminate before the Klaviyo HTTP call completes.
    //    The helper has its own try/catch so failures don't throw.
    if (payload.deliveryDetails?.email) {
        await trackKlaviyoEvent({
            eventName: "Started Checkout",
            email: payload.deliveryDetails.email,
            firstName: payload.deliveryDetails.firstName,
            lastName: payload.deliveryDetails.lastName,
            phone: payload.deliveryDetails.phoneNumber,
            value: (payload.amount || 0) / 100,
            properties: {
                cart_value: (payload.amount || 0) / 100,
                currency: currency.toUpperCase(),
                dorm: payload.dorm || "",
                school: payload.school || "",
                stripe_payment_intent_id: paymentIntent.id,
                checkout_url: "https://mydormstore.ca/cart",
            },
        });
    }

    res.send({
        clientSecret: paymentIntent.client_secret,
    });
};
export const getPaymentIntent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    res.send(paymentIntent);
};
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const webhook = async (req: Request, res: Response) => {
    let event: Stripe.Event = req.body;
    if (endpointSecret) {
        const signature = req.headers["stripe-signature"];
        if (signature) {
            try {
                // req.body is now a Buffer due to express.raw() middleware
                const body =
                    typeof req.body === "string"
                        ? req.body
                        : req.body.toString();
                event = stripe.webhooks.constructEvent(
                    body,
                    signature as string,
                    endpointSecret,
                );
            } catch (err) {
                console.error(`Webhook signature verification failed.`, err);
                res.sendStatus(400);
                return;
            }
        }
    }
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;
            const completedState = completedOrderStates.get(paymentIntentId);

            if (completedState?.status === "succeeded") {
                res.status(200).send();
                return;
            }

            if (completedState?.status === "failed") {
                console.warn(
                    `Skipping already-failed order import for payment intent ${paymentIntentId}`,
                );
                res.status(500).send();
                return;
            }

            if (inFlightOrderCreations.has(paymentIntentId)) {
                await inFlightOrderCreations.get(paymentIntentId);
                res.status(200).send();
                return;
            }

            const processingPromise = (async () => {
                try {
                    const metadata = paymentIntent.metadata;
                    const payload = buildPayloadFromMetadata(
                        metadata as StripeMetadata,
                        paymentIntent.currency || undefined,
                    );
                    payload.stripePaymentIntentId = paymentIntent.id;

                    const result = await createOrder(payload);

                    if (!result.ok) {
                        completedOrderStates.set(paymentIntentId, {
                            status: "failed",
                            result,
                        });
                        console.error("Stripe webhook order import failed", {
                            paymentIntentId,
                            email: payload.deliveryDetails?.email,
                            error: result.error,
                            details: result.details,
                        });

                        if (payload.deliveryDetails?.email) {
                            await trackKlaviyoEvent({
                                eventName: "Order Import Failed",
                                email: payload.deliveryDetails.email,
                                firstName: payload.deliveryDetails.firstName,
                                lastName: payload.deliveryDetails.lastName,
                                value: paymentIntent.amount / 100,
                                properties: {
                                    order_total: paymentIntent.amount / 100,
                                    currency:
                                        paymentIntent.currency?.toUpperCase(),
                                    dorm: payload.dorm || "",
                                    school: payload.school || "",
                                    stripe_payment_intent_id: paymentIntent.id,
                                    error: result.error,
                                },
                            });
                        }

                        throw new Error(result.error);
                    }

                    completedOrderStates.set(paymentIntentId, {
                        status: "succeeded",
                        result,
                    });
                    console.log(
                        `PaymentIntent for ${paymentIntent.amount} was successful! Order ${result.orderId} was created!`,
                    );

                    if (payload.deliveryDetails?.email) {
                        await trackKlaviyoEvent({
                            eventName: "Placed Order",
                            email: payload.deliveryDetails.email,
                            firstName: payload.deliveryDetails.firstName,
                            lastName: payload.deliveryDetails.lastName,
                            value: paymentIntent.amount / 100,
                            properties: {
                                order_total: paymentIntent.amount / 100,
                                currency: paymentIntent.currency?.toUpperCase(),
                                dorm: payload.dorm || "",
                                school: payload.school || "",
                                shopify_order_id: result.orderId,
                                stripe_payment_intent_id: paymentIntent.id,
                            },
                        });
                    }
                } finally {
                    inFlightOrderCreations.delete(paymentIntentId);
                }
            })();

            inFlightOrderCreations.set(paymentIntentId, processingPromise);

            try {
                await processingPromise;
                res.status(200).send();
            } catch (error) {
                res.status(500).send();
            }
            return;
        }

        case "payment_intent.payment_failed": {
            const failedIntent = event.data.object;
            const failedMeta = failedIntent.metadata;

            // Try to recover the customer's email from the PaymentIntent
            // (set when the Stripe Customer was attached) or from the
            // deliveryDetails metadata if available.
            let failEmail: string | undefined;
            let failFirstName: string | undefined;
            let failLastName: string | undefined;
            try {
                if (failedIntent.customer) {
                    const stripeCustomer = await stripe.customers.retrieve(
                        failedIntent.customer as string,
                    );
                    if (!("deleted" in stripeCustomer)) {
                        failEmail = stripeCustomer.email || undefined;
                        const parts = (stripeCustomer.name || "").split(" ");
                        failFirstName = parts[0];
                        failLastName = parts.slice(1).join(" ") || undefined;
                    }
                }
                if (!failEmail && failedMeta.deliveryDetails) {
                    const d = JSON.parse(failedMeta.deliveryDetails);
                    failEmail = d?.email;
                    failFirstName = d?.firstName;
                    failLastName = d?.lastName;
                }
            } catch (e) {
                console.warn(
                    "Couldn't look up customer for failed payment:",
                    e,
                );
            }

            console.log(
                `PaymentIntent ${failedIntent.id} failed${
                    failEmail ? ` (${failEmail})` : ""
                }`,
            );

            if (failEmail) {
                await trackKlaviyoEvent({
                    eventName: "Payment Failed",
                    email: failEmail,
                    firstName: failFirstName,
                    lastName: failLastName,
                    value: failedIntent.amount / 100,
                    properties: {
                        cart_value: failedIntent.amount / 100,
                        currency: failedIntent.currency?.toUpperCase(),
                        failure_message:
                            failedIntent.last_payment_error?.message || "",
                        failure_code:
                            failedIntent.last_payment_error?.code || "",
                        stripe_payment_intent_id: failedIntent.id,
                        checkout_url: "https://mydormstore.ca/cart",
                    },
                });
            }
            break;
        }

        default:
            console.log(`unhandled event type ${event.type}`);
    }
    res.status(200).send();
};
/*
used for reconstruction of line items
function reconstructLineItems(metadata) {
  const parts = Object.keys(metadata)
    .filter((key) => key.startsWith("lineItems_part_"))
    .sort((a, b) => {
      const aIndex = parseInt(a.split("_").pop());
      const bIndex = parseInt(b.split("_").pop());
      return aIndex - bIndex;
    })
    .map((key) => metadata[key]);
  const fullJson = parts.join("");
  return JSON.parse(fullJson);
}
 */
