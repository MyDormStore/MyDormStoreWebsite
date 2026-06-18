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
// Residences that have an on-campus bookstore partnership.
// If the customer picks one of these as their dorm, the
// "Move-In Day Delivery" rate is renamed to "Bookstore Pickup".
const BOOKSTORE_RESIDENCES = new Set<string>([
    // Algonquin
    "Algonquin College",
    // Sheridan
    "Sheridan College",
    // Mount Allison
    "Mount Allison University",
    // TMU
    "TMU Bookstore",
    "TMU Residence",
    // Wilfrid Laurier
    "Wilfrid Laurier University (Waterloo Residence)",
    "Wilfrid Laurier University (Brantford Residence)",
    "Wilfrid Laurier University HawkShop (Waterloo)",
    "Wilfrid Laurier University HawkShop (Brantford)",
    // U of A
    "University of Alberta Bookstore",
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
    // NSCC
    "Nova Scotia Community College",
    "Akerley Campus",
    "Centre of Geographic Sciences (COGS)",
    "Ivany Campus",
    "Pictou Campus",
    "Strait Area Campus",
    "Truro Campus",
    // McGill
    "Carrefour Sherbrooke",
    "Douglas Hall",
    "Eco Residence",
    "Gardner Hall",
    "Greenbriar",
    "Hutchison",
    "La Citadelle",
    "Laird Hall",
    "McConnell Hall",
    "Molson Hall",
    "New Residence Hall",
    "Royal Victoria College",
    "Solin Hall",
    "University Hall",
    "506 Pins",
    "510 Pins",
    "522 Pins",
    "3559 University",
    "3601 University",
    "3643 University",
    "3647 University",
    "3653 University",
    "3653 de la Montagne",
    "3704 Peel",
    "3710 Peel",
    // UVic
    "UVic Single Dorm",
    "UVic Double Dorm",
    "UVic Pod Single Dorm",
    "UVic 4-Bedroom Cluster Room",
]);
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
        defaultValues: {
            service: shipping?.service || "",
            cost: shipping?.cost || 0,
            transitTime: shipping?.transitTime || 0,
            moveInDate: shipping?.moveInDate || undefined,
        },
        resolver: zodResolver(shippingFormSchema),
        mode: "onChange",
        reValidateMode: "onChange",
    });
    const [selectedRate, setSelectedRate] = useState(
        form.getValues("service") || ""
    );
    const { cart } = useCartContext();
    const { shippingCost, setShippingCost, setTaxLines } = useShippingContext();
    // Build the single move-in rate (currency- + province-aware)
    const buildMoveInRate = (): Rates => {
        const province =
            delivery?.shippingAddress?.state?.toUpperCase() || "";

        // Detect the cart's currency (set by Shopify Markets based on
        // customer location — USD for US visitors, CAD for Canadian, etc.)
        const cartCurrency =
            cart?.cost?.totalAmount?.currencyCode?.toUpperCase() || "CAD";

        let moveInCost: number;
        if (cartCurrency === "USD") {
            // US customers see USD prices — charge $34.95 USD shipping
            moveInCost = 34.95;
        } else {
            // CAD customers — province-based pricing
            moveInCost =
                province === "ON" || province === "QC" ? 19.95 : 34.95;
        }

        const isBookstore = BOOKSTORE_RESIDENCES.has(dorm);
        const serviceName = isBookstore
            ? "Bookstore Pickup"
            : "Move-In Day Delivery";
        return {
            service: serviceName,
            cost: moveInCost,
            transitTime: 2,
        };
    };
    const fetchRates = async () => {
        if (!cart) return;
        // Set move-in rate IMMEDIATELY for move-in orders — it's pure local
        // logic and doesn't depend on the backend. If the backend call also
        // succeeds we'll get tax lines too, but the rate is never blocked.
        if (orderType === "move-in") {
            setRates([buildMoveInRate()]);
        }
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
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/Shopify/calculate`,
                payload
            );
            // Set tax lines if present (used by Payment + summary)
            if (response?.data?.taxLines) {
                setTaxLines(response.data.taxLines);
            }
            // Move-in already handled above — just need tax from the call
            if (orderType === "move-in") return;
            // Regular orders → display backend carrier rates
            const carrierRates = response?.data?.availableShippingRates;
            if (!carrierRates || carrierRates.length === 0) {
                setRates([
                    { service: "Standard", cost: 23.0, transitTime: 3 },
                ]);
                return;
            }
            setRates(
                carrierRates.map((rate: any) => {
                    let transitTime = 5; // default transit time
                    if (
                        rate.title.includes("Express") ||
                        rate.title.includes("Expedited") ||
                        rate.title.includes("Priority")
                    ) {
                        transitTime = 3;
                    }
                    return {
                        service: rate.title,
                        cost: Number(rate.price.amount),
                        transitTime: transitTime,
                    } as Rates;
                })
            );
        } catch (err) {
            console.warn("Shipping calculate failed:", err);
            // Backend failed — make sure regular orders still see SOMETHING
            // so the checkout isn't blocked on a never-loading skeleton row
            if (orderType !== "move-in") {
                setRates([
                    { service: "Standard", cost: 23.0, transitTime: 3 },
                ]);
            }
        }
    };
    useEffect(() => {
        fetchRates();
    }, [cart, orderType, dorm, delivery]);
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
    // Helper — friendly delivery-time text for a rate row
    const getDeliveryTimeText = (service: string, transitTime: number) => {
        if (
            service.includes("Move-In Day") ||
            service.includes("Bookstore Pickup")
        ) {
            return "Arrives by move-in day";
        }
        if (transitTime === 1) return "Next day delivery";
        return `Ships in ${transitTime} days`;
    };
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
                                                                        {getDeliveryTimeText(
                                                                            service,
                                                                            transitTime
                                                                        )}
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
                                    <div className="overflow-hidden rounded-lg border">
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
                                                                        {getDeliveryTimeText(
                                                                            service,
                                                                            transitTime
                                                                        )}
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
                                    </div>
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
