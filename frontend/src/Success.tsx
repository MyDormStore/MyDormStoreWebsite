import { useNavigate, useParams, useSearchParams } from "react-router";
import NavBar from "./components/layout/navbar";
import { useEffect, useState } from "react";
import { Cart } from "./types/shopify";
import { getCart, removeProductFromCart } from "./api/cart";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./components/ui/table";
import CheckoutLayout from "./components/layout/checkout-layout";

export function SuccessPage() {
    const { cartID } = useParams();
    const [searchParams] = useSearchParams();
    const [cart, setCart] = useState<Cart | null>(null);

    useEffect(() => {
        const fetchAPI = async () => {
            if (cartID) {
                const key = searchParams.get("key");
                console.log(key);
                setCart(
                    await getCart(`gid://shopify/Cart/${cartID}?key=${key}`)
                );
            }
        };
        fetchAPI();
    }, [cartID]);

    useEffect(() => {
        if (cart) {
            console.log(cart);
            const IDs = cart.lines.nodes.map((cartLine) => {
                return cartLine.id;
            });

            removeProductFromCart(IDs, cart.id);
        }
    }, [cart]);

    const navigate = useNavigate();
    if (cart && cart.lines.nodes.length <= 0) {
        navigate("/");
    }

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
                                                                .title
                                                        }
                                                    </span>
                                                    {/* <span className="font-light">
                                        {product.description}
                                    </span> */}
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
