import { get, useForm } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

import { useFormStore } from "@/core/form";
import { cn } from "@/lib/utils";
import {
    shippingFormSchema,
    type ShippingFormSchemaType,
} from "@/schema/shipping-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { useShippingContext } from "@/context/shippingContext";

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

const rates: Rates[] = [
    {
        service: "UPS Express",
        cost: 20.19,
        transitTime: 2,
    },
    {
        service: "FedEx Priority Overnight",
        cost: 24.19,
        transitTime: 1,
    },
];

export default function ShippingForm({ prevTab, nextTab }: ShippingFormProps) {
    const shipping = useFormStore((state) => state.shipping);
    const addShipping = useFormStore((state) => state.addShipping);

    const [selectedRate, setSelectedRate] = useState(shipping.service ?? "");

    const form = useForm<ShippingFormSchemaType>({
        resolver: zodResolver(shippingFormSchema),
        defaultValues: shipping,
    });

    const { setShippingCost } = useShippingContext();

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
                                {rates.map((rate) => {
                                    const { service, cost, transitTime } = rate;
                                    return (
                                        <TableRow
                                            key={service}
                                            onClick={() => addRate(rate)}
                                            className={cn(
                                                "hover:cursor-pointer",
                                                selectedRate === service
                                                    ? "font-semibold"
                                                    : ""
                                            )}
                                        >
                                            <TableCell>{service}</TableCell>
                                            <TableCell>{cost}</TableCell>
                                            <TableCell>
                                                {transitTime === 1
                                                    ? "Next day delivery"
                                                    : `Ships within the ${transitTime} days`}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
                            // TODO: store in zustand
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
