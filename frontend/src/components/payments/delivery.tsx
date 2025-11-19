import { useForm, UseFormReturn } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

import { useFormStore } from "@/core/form";
import { dorm } from "@/data/residence";
import { getAddress } from "@/lib/dorm-details";
import {
    deliveryFormSchema,
    type DeliveryFormSchemaType,
} from "@/schema/delivery-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import CountryDropdown from "../dropdown/countries";
import StateDropdown from "../dropdown/states";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { SecondaryAddressSchemaType } from "@/schema/payment-form";

// delivery form for checkout

interface DeliveryFormProps {
    nextTab: () => void;
    dorm: string;
}

export default function DeliveryForm({ nextTab, dorm }: DeliveryFormProps) {
    const delivery = useFormStore((state) => state.delivery);
    const addDelivery = useFormStore((state) => state.addDelivery);

    const form = useForm<DeliveryFormSchemaType>({
        resolver: zodResolver(deliveryFormSchema),
        defaultValues: delivery
            ? delivery
            : {
                  email: "",
                  firstName: "",
                  lastName: "",
                  phoneNumber: "",
                  shippingAddress: {
                      street: "",
                      city: "",
                      country: "",

                      state: "",
                      postalCode: "",
                  },
              },
        mode: "onChange",
        reValidateMode: "onChange",
    });

    const onSubmit = async (data: DeliveryFormSchemaType) => {
        addDelivery(data);
        nextTab();
    };

    const [countryValue, setCountryValue] = useState(
        form.getValues(`shippingAddress.country`) || ""
    );
    const [stateValue, setStateValue] = useState(
        form.getValues(`shippingAddress.state`) || ""
    );

    const [openCountryDropdown, setOpenCountryDropdown] = useState(false);
    const [openStateDropdown, setOpenStateDropdown] = useState(false);

    useEffect(() => {
        form.setValue(`shippingAddress.country`, countryValue);
        form.clearErrors(`shippingAddress.country`);
    }, [countryValue]);

    useEffect(() => {
        form.setValue(`shippingAddress.state`, stateValue);
        form.clearErrors(`shippingAddress.state`);
    }, [stateValue]);

    useEffect(() => {
        if (dorm) {
            const address = getAddress(dorm as dorm);
            if (address) {
                form.setValue("shippingAddress", address);
                setCountryValue(address.country);
                setStateValue(address.state);
            }
        }
    }, [dorm]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Details</CardTitle>
                        <CardDescription>
                            Fill your delivery details for the residence you're
                            staying at.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Order Confirmation Email
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col gap-4">
                            <div className="grid gap-2 grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Student's First Name
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
                                                Student's Last Name
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
                                            Student's Phone Number
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Separator />
                            <FormField
                                control={form.control}
                                name={`shippingAddress.street`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Residence Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`shippingAddress.city`}
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
                                    name={`shippingAddress.country`}
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
                                    name={`shippingAddress.state`}
                                    render={() => {
                                        return (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <StateDropdown
                                                    countryValue={countryValue}
                                                    stateValue={stateValue}
                                                    setStateValue={
                                                        setStateValue
                                                    }
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
                                    name={`shippingAddress.postalCode`}
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
                        </div>
                    </CardContent>
                </Card>
                <div className={"flex gap-4"}>
                    <Button className="flex-auto"> Next </Button>
                </div>
            </form>
        </Form>
    );
}
