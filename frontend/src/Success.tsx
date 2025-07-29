import {
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router";
import NavBar from "./components/layout/navbar";
import { useEffect, useRef, useState } from "react";
import { Cart } from "./types/shopify";
import { applyDiscountCode, getCart, removeProductFromCart } from "./api/cart";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./components/ui/table";
import CheckoutLayout from "./components/layout/checkout-layout";
import axios from "axios";
import { usePayloadStore } from "./core/payload";

export function SuccessPage() {
    const { cartID } = useParams();
    const [searchParams] = useSearchParams();
    const [cart, setCart] = useState<Cart | null>(null);
    const navigate = useNavigate();

    const payload = usePayloadStore((state) => state.payload);
    const setPayload = usePayloadStore((state) => state.setPayload);

    const hasOrdered = useRef(false); // Prevent duplicate order creation

    if (cart && cart.lines.nodes.length <= 0) {
        navigate("/");
    }

    useEffect(() => {
        const fetchAPI = async () => {
            if (cartID) {
                const key = searchParams.get("key");
                console.log(key);
                const cartResponse = await getCart(
                    `gid://shopify/Cart/${cartID}?key=${key}`
                );
                setCart(cartResponse);

                if (
                    cartResponse.discountCodes &&
                    cartResponse.discountCodes[0].applicable
                ) {
                    applyDiscountCode(cartResponse.id, "");
                }
            }
        };
        fetchAPI();
    }, [cartID]);

    useEffect(() => {
        const createOrder = async () => {
            const paymentIntent = searchParams.get("payment_intent");
            const paymentIntentClientSecret = searchParams.get(
                "payment_intent_client_secret"
            );

            // console.log(payload);

            const response = await axios.get(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/Stripe/payment-intent/${paymentIntent}`
            );

            const data = response.data;
            // console.log(data);

            if (!hasOrdered.current && paymentIntent && payload) {
                if (data.status === "succeeded") {
                    hasOrdered.current = true; // 👈 Mark as executed
                    try {
                        const response = await axios.post(
                            `${import.meta.env.VITE_BACKEND_URL}/Shopify/order`,
                            payload
                        );
                        console.log(response);
                        if (!response.data.graphQLErrors) {
                            setPayload({});
                        }
                    } catch (error) {
                        console.error("Order creation failed:", error);
                        hasOrdered.current = false; // Optionally allow retry on failure
                    }
                }
            }
        };

        createOrder();
    }, [searchParams, payload]);

    useEffect(() => {
        if (cart && hasOrdered.current) {
            const IDs = cart.lines.nodes.map((cartLine) => cartLine.id);
            removeProductFromCart(IDs, cart.id);
        }
    }, [cart, hasOrdered]);

    return (
        <div className="w-dvw h-dvh overflow-y-scroll flex flex-col">
            <div className="h-fit">
                <NavBar />
            </div>

            <div className="flex flex-col items-center h-full justify-center w-full">
                <CheckoutLayout>
                    <Table className="h-fit overflow-scroll">
                        <TableHeader>
                            <TableRow>
                                <TableHead colSpan={2} className="">
                                    Product
                                </TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Total Cost</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart &&
                                cart.lines.nodes.map((product, index) => {
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="flex gap-2 items-center w-24">
                                                    <img
                                                        src={
                                                            product.merchandise
                                                                .image.url
                                                        }
                                                        className="h-16 w-16 rounded object-fill"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid gap-1">
                                                    <span className="font-semibold">
                                                        {
                                                            product.merchandise
                                                                .product.title
                                                        }
                                                    </span>
                                                    {product.merchandise
                                                        .title !==
                                                        "Default Title" && (
                                                        <span className="font-light">
                                                            {
                                                                product
                                                                    .merchandise
                                                                    .title
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="">
                                                    $
                                                    {Number(
                                                        product.cost
                                                            .amountPerQuantity
                                                            .amount
                                                    ).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="w-4 text-center">
                                                    {product.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="">
                                                    $
                                                    {(
                                                        Number(
                                                            product.cost
                                                                .amountPerQuantity
                                                                .amount
                                                        ) * product.quantity
                                                    ).toFixed(2)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                    <div className="flex flex-col items-center justify-center h-full text-center w-full">
                        <h1 className="text-3xl font-bold mb-4">
                            Payment Successful!
                        </h1>
                        <p className="text-lg font-bold mb-2">
                            Thank you for your purchase.
                        </p>
                        <p className="text-md">
                            Your order has been processed successfully.
                        </p>
                        <p className="text-md">
                            You will receive a confirmation email shortly.
                        </p>
                        <p className="text-md">
                            If you have any questions, please contact our
                            support team.
                        </p>
                        <p className="text-md">
                            Thank you for choosing our service!
                        </p>{" "}
                    </div>
                </CheckoutLayout>
            </div>
        </div>
    );
}
