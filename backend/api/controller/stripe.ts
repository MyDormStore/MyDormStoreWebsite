import { Request, Response } from "express";
import Stripe from "stripe";

import { config } from "dotenv";
import { Payload } from "../types/types";
import { createOrder } from "../utils/shopify";

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

    // 5. Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount),
        currency: "cad",
        metadata,
    });

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
                customer: metadata.customer,
                lineItems: JSON.parse(metadata.lineItems),
                deliveryDetails: JSON.parse(metadata.deliveryDetails),
                taxLines: JSON.parse(metadata.taxLines),
                shipping: JSON.parse(metadata.shipping),
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
            break;
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
