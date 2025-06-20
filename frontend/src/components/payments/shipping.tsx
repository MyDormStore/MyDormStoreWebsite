import { get, useForm } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

import { useCartContext } from "@/context/cartContext";
import { useShippingContext } from "@/context/shippingContext";
import { useFormStore } from "@/core/form";
import { cn } from "@/lib/utils";
import {
    shippingFormSchema,
    type ShippingFormSchemaType,
} from "@/schema/shipping-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { Skeleton } from "../ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";

// rates form for checkout

interface ShippingFormProps {
    prevTab: () => void;
    nextTab: () => void;
}

interface Rates {
    logo?: string;
    service: string;
    cost: number;
    transitTime: number;
}

// const rates: Rates[] = [
//     {
//         service: "UPS Express",
//         cost: 20.19,
//         transitTime: 2,
//     },
//     {
//         service: "FedEx Priority Overnight",
//         cost: 24.19,
//         transitTime: 1,
//     },
// ];

export default function ShippingForm({ prevTab, nextTab }: ShippingFormProps) {
    const shipping = useFormStore((state) => state.shipping);
    const addShipping = useFormStore((state) => state.addShipping);
    const delivery = useFormStore((state) => state.delivery);

    const [rates, setRates] = useState<Rates[] | null>([]);
    const [selectedRate, setSelectedRate] = useState(shipping.service ?? "");

    const form = useForm<ShippingFormSchemaType>({
        resolver: zodResolver(shippingFormSchema),
        defaultValues: shipping,
    });

    const { cart } = useCartContext();
    const { setShippingCost, setTaxLines } = useShippingContext();

    useEffect(() => {
        const fetchRates = async () => {
            // Simulating an API call to fetch shipping rates
            if (cart) {
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
                };

                const response = await axios.post(
                    `http://localhost:3000/Shopify/calculate`,
                    payload
                );

                console.log(response.data);

                if (response.data.availableShippingRates.length === 0) {
                    setRates(null);
                }

                setTaxLines(response.data.taxLines);

                setRates(
                    response.data.availableShippingRates.map((rate: any) => {
                        let transitTime = 5; // default transit time
                        if (
                            rate.title.includes("Express") ||
                            rate.title.includes("Expedited") ||
                            rate.title.includes("Priority")
                        ) {
                            transitTime = 3; // express services usually have a transit time of 1 day\
                        }

                        return {
                            service: rate.title,
                            cost: Number(rate.price.amount),
                            transitTime: transitTime,
                        } as Rates;
                    })
                );
            }
        };
        fetchRates();
    }, [cart]);

    const addRate = (rate: Rates) => {
        const { service, cost, transitTime } = rate;

        form.setValue("cost", cost);
        form.setValue("service", service);
        form.setValue("transitTime", transitTime);

        setShippingCost(cost);
        setSelectedRate(service);
    };

    const onSubmit = (data: ShippingFormSchemaType) => {
        console.log(data);
        addShipping(data);
        nextTab();
    };

    const errorMessage = get(form.formState.errors, "service")?.message;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Service</CardTitle>
                        <CardDescription>
                            Choose the rate that you want to use for shipping
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/2">
                                        Service
                                    </TableHead>
                                    <TableHead className="w-1/12">
                                        Cost
                                    </TableHead>
                                    <TableHead>Delivery Times</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rates ? (
                                    rates.length > 0 ? (
                                        rates.map((rate) => {
                                            const {
                                                service,
                                                cost,
                                                transitTime,
                                            } = rate;
                                            return (
                                                <TableRow
                                                    key={service}
                                                    onClick={() =>
                                                        addRate(rate)
                                                    }
                                                    className={cn(
                                                        "hover:cursor-pointer",
                                                        selectedRate === service
                                                            ? "font-semibold"
                                                            : ""
                                                    )}
                                                >
                                                    <TableCell>
                                                        {service}
                                                    </TableCell>
                                                    <TableCell>
                                                        {cost === 0
                                                            ? "Free"
                                                            : `$${cost.toFixed(
                                                                  2
                                                              )}`}
                                                    </TableCell>
                                                    <TableCell>
                                                        {transitTime === 1
                                                            ? "Next day delivery"
                                                            : `Ships within the ${transitTime} days`}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            Rates not available. Try changing
                                            the delivery address or the items in
                                            your cart.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <p
                            data-slot="form-message"
                            className={cn("text-destructive text-sm")}
                        >
                            {errorMessage}
                        </p>
                    </CardContent>
                </Card>
                <div className={"flex gap-4"}>
                    <Button
                        className="flex-auto"
                        type="button"
                        onClick={() => {
                            addShipping(form.getValues());
                            prevTab();
                        }}
                    >
                        {" "}
                        Previous{" "}
                    </Button>

                    <Button className="flex-auto"> Next </Button>
                </div>
            </form>
        </Form>
    );
}
