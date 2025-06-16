import { Control, useForm } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

import { useDropdownStore } from "@/lib/store/dropdown";
import {
    deliveryFormSchema,
    type DeliveryFormSchemaType,
} from "@/schema/delivery-form";
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
import { useFormStore } from "@/core/form";
import { Separator } from "../ui/separator";
import { getAddress } from "@/lib/address";
import { dorm } from "@/data/residence";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

// delivery form for checkout

interface DeliveryFormProps {
    nextTab: () => void;
    dorm: string;
}

export default function DeliveryForm({ nextTab, dorm }: DeliveryFormProps) {
    const { countryValue, stateValue, setCountryValue, setStateValue } =
        useDropdownStore();

    const delivery = useFormStore((state) => state.delivery);
    const addDelivery = useFormStore((state) => state.addDelivery);

    const form = useForm<DeliveryFormSchemaType>({
        resolver: zodResolver(deliveryFormSchema),
        defaultValues: delivery,
    });

    useEffect(() => {
        form.setValue("shippingAddress.country", countryValue);
        form.clearErrors("shippingAddress.country");
    }, [countryValue]);

    useEffect(() => {
        form.setValue("shippingAddress.state", stateValue);
        form.clearErrors("shippingAddress.state");
    }, [stateValue]);

    const onSubmit = (data: DeliveryFormSchemaType) => {
        addDelivery(data);
        nextTab();
    };

    useEffect(() => {
        console.log(dorm);
        const address = getAddress(dorm as dorm);
        if (address) {
            form.setValue("shippingAddress", address);
            setCountryValue(address.country);
            setStateValue(address.state);
        }
    }, [dorm]);

    const [isSeperateBilling, setIsSeperateBilling] = useState(
        delivery.billingAddress.street !== undefined ? true : false
    );

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
                                    <FormLabel>Email</FormLabel>
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
                                            <FormLabel>First Name</FormLabel>
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
                                            <FormLabel>Last Name</FormLabel>
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
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="moveInDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Move-in Date (Optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Separator />
                            <AddressForm
                                control={form.control}
                                type="shippingAddress"
                            />
                            <div className="flex gap-2">
                                <Checkbox
                                    checked={isSeperateBilling}
                                    onCheckedChange={() => {
                                        setIsSeperateBilling(
                                            !isSeperateBilling
                                        );
                                        if (isSeperateBilling) {
                                            form.setValue("billingAddress", {});
                                        }
                                    }}
                                    name="isSeperateBilling"
                                    id="isSeperateBilling"
                                />
                                <Label htmlFor="isSeperateBilling">
                                    Use a seperate billing address
                                </Label>
                            </div>
                            {isSeperateBilling && (
                                <AddressForm
                                    control={form.control}
                                    type="billingAddress"
                                />
                            )}
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

interface AddressFormProps {
    control: Control<DeliveryFormSchemaType>;
    type: "shippingAddress" | "billingAddress";
}

const AddressForm = ({ control, type }: AddressFormProps) => {
    return (
        <>
            <FormField
                control={control}
                name={`${type}.street`}
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
                control={control}
                name={`${type}.city`}
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
                    control={control}
                    name={`${type}.country`}
                    render={() => {
                        return (
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <CountryDropdown />
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
                <FormField
                    control={control}
                    name={`${type}.state`}
                    render={() => {
                        return (
                            <FormItem>
                                <FormLabel>State</FormLabel>
                                <StateDropdown />
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
                <FormField
                    control={control}
                    name={`${type}.postalCode`}
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
    );
};
