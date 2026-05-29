import { Request, Response } from "express";
import Stripe from "stripe";
import { config } from "dotenv";
import { Payload } from "../types/types";
import { createOrder } from "../utils/shopify";
import { trackKlaviyoEvent } from "../utils/klaviyo";
config({ path: ".env" });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
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
    if (!amount) {
        res.status(400).send("Missing amount");
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
    const metadata: { [key: string]: string | number | null } = {
        customer: payload.customer,
        deliveryDetails: JSON.stringify(payload.deliveryDetails),
        taxLines: JSON.stringify(payload.taxLines),
        shipping: JSON.stringify(payload.shipping),
        amount: payload.amount,
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
                    }
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
            err
        );
        // Intentionally swallow — payment must still go through.
    }

    // 6. Create PaymentIntent
    //    Pull currency off the request body (sent from frontend based on
    //    Shopify cart's currencyCode). Defaults to "cad" if not provided
    //    so older clients keep working.
    //    If customerId is undefined, Stripe accepts it — just means this
    //    PaymentIntent isn't attached to a customer (rare edge case).
    const currency = (req.body.currency || "cad").toLowerCase();
    const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency,
        customer: customerId,
        metadata,
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
                event = stripe.webhooks.constructEvent(
                    req.body,
                    signature,
                    endpointSecret
                );
            } catch (err) {
                console.error(`Webhook signature verification failed.`, err);
                res.sendStatus(400);
            }
        }
    }
    switch (event.type) {
        case "payment_intent.succeeded":
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata;
            const payload: Payload = {
                amount: parseFloat(metadata.amount),
                // Pass through the actual currency Stripe charged in
                // (e.g. "USD" for US customers) so the Shopify order
                // is created with the matching currency labels.
                currency: (paymentIntent.currency || "cad").toUpperCase(),
                customer: metadata.customer,
                lineItems: JSON.parse(metadata.lineItems),
                deliveryDetails: JSON.parse(metadata.deliveryDetails),
                taxLines: JSON.parse(metadata.taxLines),
                shipping: JSON.parse(metadata.shipping),
                // Read discount info back from metadata to apply to
                // the Shopify order so the breakdown shows correctly.
                discountAmount: metadata.discountAmount
                    ? parseFloat(metadata.discountAmount)
                    : 0,
                discountCodes: metadata.discountCodes
                    ? JSON.parse(metadata.discountCodes)
                    : undefined,
                secondaryDetails: metadata.secondaryDetails
                    ? JSON.parse(metadata.secondaryDetails)
                    : null,
                notInCart: metadata.notInCart
                    ? JSON.parse(metadata.notInCart)
                    : null,
                rp_id: metadata.rp_id ?? null,
            };
            console.log(payload);
            const ID = await createOrder(payload);
            console.log(
                `PaymentIntent for ${paymentIntent.amount} was successful! Order ${ID} was created!`
            );

            // Fire "Placed Order" event so Klaviyo knows to exclude
            // this customer from abandoned-cart flows. Awaited so the
            // serverless function doesn't terminate before the call.
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
                        shopify_order_id: typeof ID === "string" ? ID : "",
                        stripe_payment_intent_id: paymentIntent.id,
                    },
                });
            }
            break;

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
                        failedIntent.customer as string
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
                    e
                );
            }

            console.log(
                `PaymentIntent ${failedIntent.id} failed${
                    failEmail ? ` (${failEmail})` : ""
                }`
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
