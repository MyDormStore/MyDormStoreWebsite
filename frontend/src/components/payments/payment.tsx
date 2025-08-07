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
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import {
    secondaryAddressSchema,
    SecondaryAddressSchemaType,
} from "@/schema/payment-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import CountryDropdown from "../dropdown/countries";
import StateDropdown from "../dropdown/states";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { usePayloadStore } from "@/core/payload";
import { constructFromSymbol } from "date-fns/constants";

// payment form for checkout

interface PaymentFormProps {
    prevTab: () => void;
}

export default function PaymentForm({ prevTab }: PaymentFormProps) {
    const { cart } = useCartContext();
    const { shippingCost, taxLines } = useShippingContext();
    const delivery = useFormStore((state) => state.delivery);
    const shipping = useFormStore((state) => state.shipping);
    const notInCart = useFormStore((state) => state.notInCart);

    const [clientSecret, setClientSecret] = useState("");
    const [searchParams] = useSearchParams();

    const payload = usePayloadStore((state) => state.payload);
    const setPayload = usePayloadStore((state) => state.setPayload);

    useEffect(() => {
        const fetchData = async () => {
            if (cart && clientSecret === "") {
                console.log(cart);
                const lineItems = cart.lines.nodes; // contains cart items

                const baseAmount = parseFloat(
                    cart.cost.totalAmount.amount || "0"
                );
                const totalTax =
                    taxLines?.reduce((sum: number, line: any) => {
                        return (
                            sum +
                            parseFloat(line?.priceSet?.shopMoney?.amount || "0")
                        );
                    }, 0) || 0;

                const totalShipping = Number(shippingCost || "0");

                const amount = baseAmount + totalTax + totalShipping;

                const rp_id = searchParams.get("rp_id");

                const newPayload = {
                    ...payload,
                    customer: "customer ID", // TODO: get the ID from shopify
                    lineItems: lineItems.map((cartItem) => {
                        return {
                            variantId: cartItem.merchandise.id,
                            quantity: cartItem.quantity,
                            attributes: cartItem.attributes,
                        };
                    }),
                    deliveryDetails: delivery,
                    taxLines: taxLines,
                    shipping: shipping,
                    amount: Math.round(amount * 100),
                    notInCart: notInCart,
                    rp_id: rp_id ? rp_id : undefined,
                };

                const finalAmount = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/Shopify/finalize`,
                    newPayload
                );

                console.log(
                    "Final amount from Shopify:",
                    Number(finalAmount.data)
                );

                if (finalAmount.data) {
                    newPayload.amount = Math.round(
                        (Number(finalAmount.data) + totalShipping) * 100
                    );
                }

                setPayload(newPayload);

                if (amount > 0) {
                    // console.log(newPayload);
                    try {
                        const response = await axios.post(
                            `${
                                import.meta.env.VITE_BACKEND_URL
                            }/Stripe/create-payment-intent`,
                            newPayload
                        );

                        if (response.data) {
                            setClientSecret(response.data.clientSecret);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
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

    const payment = useFormStore((state) => state.payment);
    const addPayment = useFormStore((state) => state.addPayment);

    const form = useForm<SecondaryAddressSchemaType>({
        resolver: zodResolver(secondaryAddressSchema),
        defaultValues: payment
            ? payment
            : {
                  toggleSecondaryDetails: false,
                  email: "",
                  firstName: "",
                  lastName: "",
                  billingAddress: undefined,
                  phoneNumber: "",
              },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    console.log(form.formState.errors, form.getValues());

    const payload = usePayloadStore((state) => state.payload);
    const setPayload = usePayloadStore((state) => state.setPayload);

    const [loading, setLoading] = useState(false);

    const { cartID } = useParams();
    const [searchParams] = useSearchParams();

    const onSubmit = async (data: SecondaryAddressSchemaType) => {
        setLoading(true);
        addPayment(data);

        const newPayload = {
            ...payload,
            secondaryDetails: data,
        };
        setPayload(newPayload);

        console.log(payload);
        try {
            if (stripe && elements) {
                const { error } = await stripe.confirmPayment({
                    elements,

                    confirmParams: {
                        return_url: `${
                            window.location.origin
                        }/${cartID}/success?key=${searchParams.get("key")}`,
                    },
                });

                if (error) {
                    console.error("Payment error", error);
                    // optionally show user error
                    return;
                }
                // No navigation here — redirect handled by Stripe
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const [toggleSecondaryDetails, setToggleSecondaryDetails] = useState(
        payment.toggleSecondaryDetails ? true : false
    );

    const [countryValue, setCountryValue] = useState(
        form.getValues(`billingAddress.country`) || ""
    );
    const [stateValue, setStateValue] = useState(
        form.getValues(`billingAddress.state`) || ""
    );

    const [openCountryDropdown, setOpenCountryDropdown] = useState(false);
    const [openStateDropdown, setOpenStateDropdown] = useState(false);

    useEffect(() => {
        form.setValue(`billingAddress.country`, countryValue);
        form.clearErrors(`billingAddress.country`);
    }, [countryValue]);

    useEffect(() => {
        form.setValue(`billingAddress.state`, stateValue);
        form.clearErrors(`billingAddress.state`);
    }, [stateValue]);

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                id="payment-form"
                className="flex flex-col gap-4"
            >
                <div className="flex gap-2">
                    <Checkbox
                        checked={toggleSecondaryDetails}
                        onCheckedChange={() => {
                            setToggleSecondaryDetails(!toggleSecondaryDetails);
                            form.setValue(
                                "toggleSecondaryDetails",
                                !toggleSecondaryDetails
                            );
                            form.clearErrors("toggleSecondaryDetails");
                        }}
                        name="toggleSecondaryDetails"
                        id="toggleSecondaryDetails"
                    />
                    <Label htmlFor="toggleSecondaryDetails">
                        Use a home/billing address
                    </Label>
                </div>
                {toggleSecondaryDetails && (
                    <>
                        <Separator />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Email (Parents/Others)
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-2 grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            First Name (Parents/Others)
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Last Name (Parents/Others)
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Phone Number (Parents/Others)
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`billingAddress.street`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Billing/Personal Address
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`billingAddress.city`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid gap-2 2xl:grid-cols-3">
                            <FormField
                                control={form.control}
                                name={`billingAddress.country`}
                                render={() => {
                                    return (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <CountryDropdown
                                                countryValue={countryValue}
                                                setCountryValue={
                                                    setCountryValue
                                                }
                                                openCountryDropdown={
                                                    openCountryDropdown
                                                }
                                                setOpenCountryDropdown={
                                                    setOpenCountryDropdown
                                                }
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                            <FormField
                                control={form.control}
                                name={`billingAddress.state`}
                                render={() => {
                                    return (
                                        <FormItem>
                                            <FormLabel>State</FormLabel>
                                            <StateDropdown
                                                countryValue={countryValue}
                                                stateValue={stateValue}
                                                setStateValue={setStateValue}
                                                openStateDropdown={
                                                    openStateDropdown
                                                }
                                                setOpenStateDropdown={
                                                    setOpenStateDropdown
                                                }
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                            <FormField
                                control={form.control}
                                name={`billingAddress.postalCode`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Postal Code</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </>
                )}
                <Separator />
                {stripe && elements ? (
                    <PaymentElement
                        options={{ layout: "auto" }}
                        id="payment-element"
                    />
                ) : (
                    <Skeleton className="w-full h-10" />
                )}
                <Button
                    className="flex-auto"
                    type="submit"
                    disabled={!stripe || !elements || loading}
                    variant={loading ? "secondary" : "default"}
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Pay Now"}
                </Button>
            </form>
        </Form>
    );
};
