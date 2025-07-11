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
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
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
    dorm: string;
}

interface Rates {
    logo?: string;
    service: string;
    cost: number;
    transitTime: number;
}

export default function ShippingForm({
    prevTab,
    nextTab,
    dorm,
}: ShippingFormProps) {
    const shipping = useFormStore((state) => state.shipping);
    const addShipping = useFormStore((state) => state.addShipping);
    const delivery = useFormStore((state) => state.delivery);

    const [rates, setRates] = useState<Rates[] | null>([]);
    const [selectedRate, setSelectedRate] = useState("");

    const form = useForm<ShippingFormSchemaType>({
        resolver: zodResolver(shippingFormSchema),
    });

    const { cart } = useCartContext();
    const { setShippingCost, setTaxLines } = useShippingContext();

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
                `${import.meta.env.VITE_BACKEND_URL}/Shopify/calculate`,
                payload
            );

            if (response.data.availableShippingRates.length === 0) {
                setRates(null);
                return;
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

    useEffect(() => {
        // Watch for changes in the form and update the shipping context

        const subscription = form.watch((data) => {
            if (data.moveInDate && rates && dorm) {
                const moveInDate = new Date(data.moveInDate);
                if (
                    (moveInDate.getMonth() === 7 &&
                        moveInDate.getDate() >= 24) ||
                    (moveInDate.getMonth() === 8 && moveInDate.getDate() <= 7)
                ) {
                    // If the move-in date is in August or September, show the flat rates
                    setRates((prevRates) => {
                        if (!prevRates) return prevRates;
                        // Check if flat rates already exist
                        // If flat rates already exist, do not add them again
                        const hasFlatRate = prevRates.some((rate) =>
                            rate.service.includes("Flat Rate")
                        );
                        if (hasFlatRate) return prevRates;

                        return [
                            // ...prevRates,
                            {
                                service: "Flat Rate",
                                cost: 10,
                                transitTime: 2,
                            },
                        ];
                    });
                }
            } else {
                // If the move-in date is not in August or September, show the original rates
                fetchRates();
            }
        });
        return () => subscription.unsubscribe();
    }, [form, dorm]);

    useEffect(() => {
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
                        <div className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="moveInDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>
                                            Move in Date (Optional)
                                        </FormLabel>{" "}
                                        <div className="flex gap-2">
                                            <Popover>
                                                <PopoverTrigger
                                                    asChild
                                                    className=""
                                                >
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "grow pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "PPP"
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Pick a date
                                                                </span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date <= new Date()
                                                        }
                                                        captionLayout="dropdown"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <Button
                                                variant={"outline"}
                                                type="button"
                                                onClick={() =>
                                                    field.onChange(undefined)
                                                }
                                                className=""
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <FormDescription>
                                            The move in date is used to
                                            calculate the rates
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/2">
                                                Service
                                            </TableHead>
                                            <TableHead className="w-1/12">
                                                Cost
                                            </TableHead>
                                            <TableHead>
                                                Delivery Times
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rates !== null ? (
                                            rates.length > 0 ? (
                                                rates
                                                    .sort((a, b) =>
                                                        a.cost > b.cost ? 1 : -1
                                                    )
                                                    .map((rate) => {
                                                        const {
                                                            service,
                                                            cost,
                                                            transitTime,
                                                        } = rate;
                                                        return (
                                                            <TableRow
                                                                key={service}
                                                                onClick={() =>
                                                                    addRate(
                                                                        rate
                                                                    )
                                                                }
                                                                className={cn(
                                                                    "hover:cursor-pointer",
                                                                    selectedRate ===
                                                                        service
                                                                        ? "font-bold bg-secondary"
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
                                                                    {transitTime ===
                                                                    1
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
                                                    Rates not available. Try
                                                    changing the delivery
                                                    address or the items in your
                                                    cart.
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
                            </div>
                        </div>
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
