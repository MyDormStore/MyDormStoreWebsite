import { get, useForm } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { useIsMobile } from "@/hooks/use-mobile";

// Residences whose packages ship to the school's BOOKSTORE for pickup
// (rather than direct-to-room). Used to swap the move-in delivery label.
const BOOKSTORE_RESIDENCES = new Set<string>([
    // Algonquin
    "Algonquin College",
    // Mount Allison
    "Mount Allison University",
    // TMU
    "TMU Bookstore",
    // Sheridan
    "Sheridan College",
    // Wilfrid Laurier (residences + hawkshops)
    "Wilfrid Laurier University (Waterloo Residence)",
    "Wilfrid Laurier University (Brantford Residence)",
    "Wilfrid Laurier University HawkShop (Waterloo)",
    "Wilfrid Laurier University HawkShop (Brantford)",
    // University of Alberta — all residences
    "Elsey's House",
    "Marge's House",
    "Rockress (Graduate Residence)",
    "Stonecrop (Graduate Residence)",
    "Juniper (Graduate Residence)",
    "Speedwell (Graduate Residence)",
    "Aspen House",
    "Maple House",
    "Alexander Mackenzie Hall (Lister)",
    "Anthony Henday Hall (Lister)",
    "Henry Kelsey Hall (Lister)",
    "Mary Schäffer Hall (Lister)",
    "Thelma Chalifoux Hall (Lister)",
    "Peter Lougheed Hall",
    "Alder House",
    "Linden House",
    "International House",
    "Nîpisîy House",
    "Résidence Saint-Jean",
    "Pinecrest House",
    "Tamarack House",
    "HUB",
    "University of Alberta Bookstore",
    // Nova Scotia Community College — all campuses
    "Nova Scotia Community College",
    "Akerley Campus",
    "Centre of Geographic Sciences (COGS)",
    "Ivany Campus",
    "Pictou Campus",
    "Strait Area Campus",
    "Truro Campus",
]);

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
    const orderType = useFormStore((state) => state.orderType);
    const [rates, setRates] = useState<Rates[] | null>([]);
    const form = useForm<ShippingFormSchemaType>({
        resolver: zodResolver(shippingFormSchema),
        defaultValues: {
            service: shipping?.service || "",
            cost: shipping?.cost || 0,
            transitTime: shipping?.transitTime || 0,
            moveInDate: shipping?.moveInDate || undefined,
        },
        mode: "onChange",
        reValidateMode: "onChange",
    });
    const [selectedRate, setSelectedRate] = useState(
        form.getValues("service") || ""
    );
    const { cart } = useCartContext();
    const { shippingCost, setShippingCost, setTaxLines } = useShippingContext();
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
                        attributes: cartItem.attributes,
                        amount: cartItem.cost.amountPerQuantity.amount,
                    };
                }),
                discountCodes: cart.discountCodes?.[0]?.applicable
                    ? [cart.discountCodes?.[0].code]
                    : undefined,
                deliveryDetails: delivery,
            };
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/Shopify/calculate`,
                payload
            );
            response.data.taxLines && setTaxLines(response.data.taxLines);
            if (
                response.data.availableShippingRates === null ||
                response.data.availableShippingRates.length === 0
            ) {
                setRates([
                    {
                        service: "Standard",
                        cost: 23.0,
                        transitTime: 3,
                    },
                ]);
                return;
            }
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
            if (orderType === "move-in" && data.moveInDate && rates && dorm) {
                const moveInDate = new Date(data.moveInDate);
                if (
                    (moveInDate.getMonth() === 7 &&
                        moveInDate.getDate() >= 24) ||
                    (moveInDate.getMonth() === 8 && moveInDate.getDate() <= 7)
                ) {
                    // Show the move-in / bookstore-pickup rate during the Aug 24–Sept 7 window
                    setRates((prevRates) => {
                        if (!prevRates) return prevRates;
                        // Skip if a move-in / bookstore rate is already in the list
                        const hasMoveInRate = prevRates.some((rate) =>
                            rate.service.includes("Move-In Day") ||
                            rate.service.includes("Bookstore Pickup")
                        );
                        if (hasMoveInRate) return prevRates;

                        // Province-based pricing: ON/QC = $19.95, rest of Canada = $34.95
                        const province =
                            delivery?.shippingAddress?.state?.toUpperCase() || "";
                        const moveInCost =
                            province === "ON" || province === "QC"
                                ? 19.95
                                : 34.95;

                        // Label depends on whether the selected residence has a bookstore partnership
                        const isBookstore = BOOKSTORE_RESIDENCES.has(dorm);
                        const serviceName = isBookstore
                            ? "Bookstore Pickup on Move-In Day"
                            : "Move-In Day Delivery";

                        return [
                            {
                                service: serviceName,
                                cost: moveInCost,
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
    }, [form, dorm, orderType]);
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
        if (shippingCost > 0 || (shippingCost === 0 && data.service !== "")) {
            nextTab();
        } else {
            form.setError("service", {
                type: "required",
                message: "Shipping service is required",
            });
        }
    };
    const errorMessage = get(form.formState.errors, "service")?.message;
    const isMobile = useIsMobile();
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
                            {orderType === "move-in" && (
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
                            )}
                            <div className="flex flex-col gap-2">
                                {isMobile ? (
                                    rates !== null ? (
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
                                                        <Card key={service}>
                                                            <CardHeader className="text-lg">
                                                                {service}
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="flex flex-col gap-2">
                                                                    <span>
                                                                        {" "}
                                                                        {cost ===
                                                                        0
                                                                            ? "Free"
                                                                            : `$${cost.toFixed(
                                                                                  2
                                                                              )}`}
                                                                    </span>
                                                                    <span>
                                                                        {service.includes(
                                                                            "Move-In Day"
                                                                        ) ||
                                                                        service.includes(
                                                                            "Bookstore Pickup"
                                                                        )
                                                                            ? service
                                                                            : transitTime ===
                                                                              1
                                                                            ? "Next day delivery"
                                                                            : `Ships in ${transitTime} days`}
                                                                    </span>
                                                                </div>
                                                            </CardContent>
                                                            <CardFooter>
                                                                <Button
                                                                    variant={
                                                                        selectedRate ===
                                                                        service
                                                                            ? "default"
                                                                            : "outline"
                                                                    }
                                                                    className="w-full"
                                                                    type="button"
                                                                    onClick={() =>
                                                                        addRate(
                                                                            rate
                                                                        )
                                                                    }
                                                                >
                                                                    Select
                                                                    Service
                                                                </Button>
                                                            </CardFooter>
                                                        </Card>
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
                                                changing the delivery address or
                                                the items in your cart.
                                            </TableCell>
                                        </TableRow>
                                    )
                                ) : (
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
                                                            a.cost > b.cost
                                                                ? 1
                                                                : -1
                                                        )
                                                        .map((rate) => {
                                                            const {
                                                                service,
                                                                cost,
                                                                transitTime,
                                                            } = rate;
                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        service
                                                                    }
                                                                    onClick={() =>
                                                                        addRate(
                                                                            rate
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "hover:cursor-pointer",
                                                                        selectedRate ===
                                                                            service
                                                                            ? "font-bold bg-secondary hover:bg-secondary"
                                                                            : ""
                                                                    )}
                                                                >
                                                                    <TableCell>
                                                                        {
                                                                            service
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {cost ===
                                                                        0
                                                                            ? "Free"
                                                                            : `$${cost.toFixed(
                                                                                  2
                                                                              )}`}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {service.includes(
                                                                            "Move-In Day"
                                                                        ) ||
                                                                        service.includes(
                                                                            "Bookstore Pickup"
                                                                        )
                                                                            ? service
                                                                            : transitTime ===
                                                                              1
                                                                            ? "Next day delivery"
                                                                            : `Ships in ${transitTime} days`}
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
                                                        address or the items in
                                                        your cart.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
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
