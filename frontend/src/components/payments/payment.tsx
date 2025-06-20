import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

import { stripe } from "@/api/stripe";
import { useCartContext } from "@/context/cartContext";
import { useShippingContext } from "@/context/shippingContext";
import { useFormStore } from "@/core/form";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useLocation } from "react-router";

// payment form for checkout

interface PaymentFormProps {
    prevTab: () => void;
}

export default function PaymentForm({ prevTab }: PaymentFormProps) {
    const { cart } = useCartContext();
    const { shippingCost, taxLines } = useShippingContext();
    const delivery = useFormStore((state) => state.delivery);
    const shipping = useFormStore((state) => state.shipping);

    const [clientSecret, setClientSecret] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (cart && clientSecret === "") {
                const lineItems = cart.lines.nodes; // contains cart items
                const payload = {
                    customer: "customer ID", // TODO: get the ID from shopify
                    lineItems: lineItems.map((cartItem) => {
                        return {
                            variantId: cartItem.merchandise.id,
                            quantity: cartItem.quantity,
                        };
                    }),
                    deliveryDetails: delivery,
                    taxLines: taxLines,
                    shipping: shipping,
                };

                console.log(taxLines, shippingCost, shipping);

                const amount =
                    lineItems.reduce((sum, curr) => {
                        return (
                            parseFloat(curr.cost.amountPerQuantity.amount) *
                                curr.quantity +
                            sum
                        );
                    }, 0) +
                    shippingCost +
                    parseFloat(taxLines[0].priceSet.shopMoney.amount);

                console.log(amount);
                const response = await axios.post(
                    `http://localhost:3000/Stripe/create-payment-intent/${
                        amount * 100
                    }`,
                    payload
                );
                setClientSecret(response.data.clientSecret);
            }
        };
        fetchData();
    }, [cart]);

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Shipping Service</CardTitle>
                    <CardDescription>
                        Fill out your card details and click Pay Now
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {clientSecret && (
                        <Elements
                            options={{
                                clientSecret,
                                appearance: {
                                    theme: "stripe",
                                },
                                loader: "auto",
                            }}
                            stripe={stripe}
                        >
                            <CheckoutForm />
                        </Elements>
                    )}
                </CardContent>
            </Card>
            <div className={"flex gap-4"}>
                <Button
                    className="flex-auto"
                    type="button"
                    onClick={() => {
                        prevTab();
                    }}
                >
                    {" "}
                    Previous{" "}
                </Button>
            </div>
        </div>
    );
}

const CheckoutForm = () => {
    const elements = useElements();
    const stripe = useStripe();

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (stripe && elements) {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location}/success`, // not needed because we are going to handle the payment on the frontend
                },
                // redirect: "if_required",
            });

            if (error) {
                console.error(error);
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            id="payment-form"
            className="flex flex-col gap-2"
        >
            <PaymentElement options={{ layout: "auto" }} id="payment-element" />
            <Button className="flex-auto" type="submit">
                {" "}
                Pay Now{" "}
            </Button>
        </form>
    );
};
