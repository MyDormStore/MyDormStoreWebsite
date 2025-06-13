import { get, useForm } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

import { useDropdownStore } from "@/lib/store/dropdown";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import CountryDropdown from "../dropdown/countries";
import StateDropdown from "../dropdown/states";
import { Button } from "../ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import {
    paymentFormSchema,
    type PaymentFormSchemaType,
} from "@/schema/payment-form";
import { useFormStore } from "@/core/form";

// payment form for checkout

interface PaymentFormProps {
    prevTab: () => void;
}

export default function PaymentForm({ prevTab }: PaymentFormProps) {
    const payment = useFormStore((state) => state.payment);
    const addPayment = useFormStore((state) => state.addPayment);

    const form = useForm<PaymentFormSchemaType>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: payment,
    });

    const onSubmit = (data: PaymentFormSchemaType) => {
        console.log(data);
        addPayment(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Service</CardTitle>
                        <CardDescription>
                            Fill out your card details and click Pay Now
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Card Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <FormField
                                control={form.control}
                                name="expDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Expiration Date (MM/YY)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                pattern="(0[1-9]|1[0-2])\/\d{2}"
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="CVV"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Security Code</FormLabel>
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name on Card</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <div className={"flex gap-4"}>
                    <Button
                        className="flex-auto"
                        type="button"
                        onClick={() => {
                            addPayment(form.getValues());
                            prevTab();
                        }}
                    >
                        {" "}
                        Previous{" "}
                    </Button>

                    <Button className="flex-auto"> Pay Now </Button>
                </div>
            </form>
        </Form>
    );
}
