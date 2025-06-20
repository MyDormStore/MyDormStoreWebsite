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
import { getAddress } from "@/lib/address";
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
        defaultValues: delivery,
    });

    const onSubmit = async (data: DeliveryFormSchemaType) => {
        addDelivery(data);
        nextTab();
    };

    const [toggleSecondaryDetails, setToggleSecondaryDetails] = useState(
        delivery.secondaryDetails
            ? delivery.secondaryDetails !== undefined
                ? true
                : false
            : false
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
                                    <FormLabel>
                                        Student's School Email
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
                            <AddressForm
                                form={form}
                                type="shippingAddress"
                                dorm={dorm}
                            />
                            <div className="flex gap-2">
                                <Checkbox
                                    checked={toggleSecondaryDetails}
                                    onCheckedChange={() => {
                                        setToggleSecondaryDetails(
                                            !toggleSecondaryDetails
                                        );
                                        if (toggleSecondaryDetails) {
                                            form.setValue(
                                                "secondaryDetails",
                                                undefined
                                            );
                                        }
                                    }}
                                    name="toggleSecondaryDetails"
                                    id="toggleSecondaryDetails"
                                />
                                <Label htmlFor="toggleSecondaryDetails">
                                    Use a secondary address
                                </Label>
                            </div>
                            {toggleSecondaryDetails && (
                                <>
                                    <Separator />
                                    <FormField
                                        control={form.control}
                                        name="secondaryDetails.email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Personal Email
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
                                            name="secondaryDetails.firstName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        First Name
                                                        (Parents/Others)
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
                                            name="secondaryDetails.lastName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Last Name
                                                        (Parents/Others)
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
                                        name="secondaryDetails.phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Phone Number
                                                    (Parents/Others)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <AddressForm
                                        form={form}
                                        type="secondaryDetails.billingAddress"
                                    />
                                </>
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
    form: UseFormReturn<DeliveryFormSchemaType>;
    type: "shippingAddress" | "secondaryDetails.billingAddress";
    dorm?: string;
}

const AddressForm = ({ form, type, dorm }: AddressFormProps) => {
    const { control } = form;

    const [countryValue, setCountryValue] = useState(
        form.getValues(`${type}.country`) || ""
    );
    const [stateValue, setStateValue] = useState(
        form.getValues(`${type}.state`) || ""
    );

    const [openCountryDropdown, setOpenCountryDropdown] = useState(false);
    const [openStateDropdown, setOpenStateDropdown] = useState(false);

    useEffect(() => {
        form.setValue(`${type}.country`, countryValue);
        form.clearErrors(`${type}.country`);
    }, [countryValue]);

    useEffect(() => {
        form.setValue(`${type}.state`, stateValue);
        form.clearErrors(`${type}.state`);
    }, [stateValue]);

    useEffect(() => {
        if (dorm && type === "shippingAddress") {
            console.log(dorm);
            const address = getAddress(dorm as dorm);
            if (address) {
                form.setValue("shippingAddress", address);
                setCountryValue(address.country);
                setStateValue(address.state);
            }
        }
    }, [dorm]);

    return (
        <>
            <FormField
                control={control}
                name={`${type}.street`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {type === "secondaryDetails.billingAddress"
                                ? "Billing Address"
                                : "Residence Address"}
                        </FormLabel>
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
                                <CountryDropdown
                                    countryValue={countryValue}
                                    setCountryValue={setCountryValue}
                                    openCountryDropdown={openCountryDropdown}
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
                    control={control}
                    name={`${type}.state`}
                    render={() => {
                        return (
                            <FormItem>
                                <FormLabel>State</FormLabel>
                                <StateDropdown
                                    countryValue={countryValue}
                                    stateValue={stateValue}
                                    setStateValue={setStateValue}
                                    openStateDropdown={openStateDropdown}
                                    setOpenStateDropdown={setOpenStateDropdown}
                                />
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
