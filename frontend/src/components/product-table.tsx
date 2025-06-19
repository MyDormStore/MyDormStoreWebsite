import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
// import { cart } from "@/data/cart";
import { Button } from "./ui/button";
import { CircleAlert, Loader2, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { useCartContext } from "@/context/cartContext";
import type { CartDetailsType } from "@/types/types";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ProductDetails, ProductDetailsCard } from "./product-details";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
    addProductToCart,
    removeProductToCart,
    updateProductQuantity,
} from "@/api/cart";
import { ShopifyProductsData } from "@/types/shopify";

export function ProductTable({
    dorm,
    products,
}: {
    dorm: string;
    products: ShopifyProductsData["products"]["edges"];
}) {
    const { cart, setCart } = useCartContext();
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(false);

    if (!cart) {
        return;
    }

    const updateQuantity = async (id: string, quantity: number) => {
        setLoading(true);
        const cartRes = await updateProductQuantity(id, quantity, cart.id);
        setCart(cartRes);
        setLoading(false);
    };

    const handleRemove = async (id: string) => {
        setLoading(true);
        const cartRes = await removeProductToCart(id, cart.id);
        setCart(cartRes);
        setLoading(false);
        // setCart(cart.filter((item) => item !== product));
    };

    if (isMobile) {
        return (
            <div className="h-fit overflow-scroll grid gap-8 px-2 py-4">
                {cart.lines.nodes.map((product, index) => {
                    return (
                        <div
                            className="grid gap-2 shadow p-2"
                            key={product.merchandise.title}
                        >
                            <ProductDetails
                                id={product.merchandise.id}
                                name={product.merchandise.title}
                                image={product.merchandise.image.url}
                                cost={Number(
                                    product.cost.amountPerQuantity.amount
                                )}
                            />

                            <div className="flex justify-between items-center w-full">
                                {/* {product.name === "Basic Bedding Package" &&
                                    dorm !== "parkside" &&
                                    dorm !== "" && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <CircleAlert className="w-4 h-4 text-orange-500" />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    className="flex flex-col gap-1 max-w-xs"
                                                    side="right">
                                                    <h1 className="text-center w-full font-bold">
                                                        Recommended Instead
                                                    </h1>
                                                    <ProductDetails
                                                        {...products[1]}
                                                    />
                                                    <Button
                                                        variant={"secondary"}
                                                        onClick={() => {
                                                            const newCart = [
                                                                ...cart,
                                                            ];
                                                            newCart[index] = {
                                                                ...products[1],
                                                                quantity:
                                                                    product.quantity,
                                                            };
                                                            setCart(newCart);
                                                        }}>
                                                        Add to Cart
                                                    </Button>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                {product.name === "Organization Essentials" &&
                                    dorm === "chestnut" && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <CircleAlert className="w-4 h-4 text-orange-500" />
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    className="flex flex-col gap-1 max-w-xs"
                                                    side="right">
                                                    <h1 className="text-center w-full font-bold">
                                                        Recommended Instead
                                                    </h1>
                                                    <ProductDetails
                                                        {...products[1]}
                                                    />
                                                    <Button
                                                        variant={"secondary"}
                                                        onClick={() => {
                                                            const newCart = [
                                                                ...cart,
                                                            ];
                                                            newCart[index] = {
                                                                ...products[1],
                                                                quantity:
                                                                    product.quantity,
                                                            };
                                                            setCart(newCart);
                                                        }}>
                                                        Add to Cart
                                                    </Button>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )} */}
                                <div
                                    className={cn(
                                        "flex gap-2 items-center justify-center mx-auto"
                                        // (product.name ===
                                        //     "Basic Bedding Package" &&
                                        //     dorm !== "parkside") ||
                                        //     (product.name ===
                                        //         "Organization Essentials" &&
                                        //         dorm === "chestnut")
                                        //     ? "-left-2.5 relative"
                                        //     : ""
                                    )}
                                >
                                    <Button
                                        variant={"outline"}
                                        size={"icon"}
                                        onClick={() => {
                                            updateQuantity(
                                                product.id,
                                                product.quantity - 1
                                            );
                                        }}
                                        disabled={product.quantity === 1}
                                    >
                                        <Minus />
                                    </Button>
                                    <span className="w-4 text-center">
                                        {product.quantity}
                                    </span>
                                    <Button
                                        variant={"outline"}
                                        size={"icon"}
                                        onClick={() => {
                                            updateQuantity(
                                                product.id,
                                                product.quantity + 1
                                            );
                                        }}
                                    >
                                        <Plus />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return (
        <Table className="h-fit overflow-scroll">
            <TableHeader>
                <TableRow>
                    <TableHead colSpan={2} className="">
                        Product
                    </TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cart.lines.nodes.map((product, index) => {
                    return (
                        <TableRow key={product.id}>
                            <TableCell>
                                <div className="flex gap-2 items-center w-24">
                                    <img
                                        src={product.merchandise.image.url}
                                        className="h-16 w-16 rounded object-fill"
                                    />
                                    {dorm !== "" &&
                                        product.merchandise.metafields[2]?.value.includes(
                                            dorm
                                        ) && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <CircleAlert className="w-4 h-4 text-orange-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        className="flex flex-col gap-1"
                                                        side="right"
                                                    >
                                                        <h1 className="text-center w-full font-bold">
                                                            Recommended Instead
                                                        </h1>
                                                        <ProductDetails
                                                            id={
                                                                products[0].node
                                                                    .id
                                                            }
                                                            name={
                                                                products[0].node
                                                                    .title
                                                            }
                                                            image={
                                                                products[0].node
                                                                    .featuredImage &&
                                                                products[0].node
                                                                    .featuredImage
                                                                    .url
                                                            }
                                                            cost={Number(
                                                                products[0].node
                                                                    .variants
                                                                    .edges[0]
                                                                    .node.price
                                                                    .amount
                                                            )}
                                                            key={
                                                                products[0].node
                                                                    .variants
                                                                    .edges[0]
                                                                    .node.id
                                                            }
                                                        />
                                                        <Button
                                                            variant={
                                                                "secondary"
                                                            }
                                                            disabled={loading}
                                                            onClick={async () => {
                                                                setLoading(
                                                                    true
                                                                );
                                                                await addProductToCart(
                                                                    products[0]
                                                                        .node
                                                                        .id,
                                                                    cart.id
                                                                );
                                                                const cartRes =
                                                                    await removeProductToCart(
                                                                        product.id,
                                                                        cart.id
                                                                    );
                                                                setCart(
                                                                    cartRes
                                                                );
                                                                setLoading(
                                                                    false
                                                                );
                                                            }}
                                                        >
                                                            {loading ? (
                                                                <Loader2 className="animate-spin" />
                                                            ) : (
                                                                "Add to Cart"
                                                            )}
                                                        </Button>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="grid gap-1">
                                    <span className="font-semibold">
                                        {product.merchandise.title}
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
                                        product.cost.amountPerQuantity.amount
                                    ).toFixed(2)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2 items-center">
                                    <Button
                                        variant={"outline"}
                                        size={"icon"}
                                        onClick={() => {
                                            updateQuantity(
                                                product.id,
                                                product.quantity - 1
                                            );
                                        }}
                                        disabled={product.quantity === 1}
                                    >
                                        <Minus />
                                    </Button>
                                    <span className="w-4 text-center">
                                        {product.quantity}
                                    </span>
                                    <Button
                                        variant={"outline"}
                                        size={"icon"}
                                        onClick={() => {
                                            updateQuantity(
                                                product.id,
                                                product.quantity + 1
                                            );
                                        }}
                                    >
                                        <Plus />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="">
                                    $
                                    {(
                                        Number(
                                            product.cost.amountPerQuantity
                                                .amount
                                        ) * product.quantity
                                    ).toFixed(2)}
                                </span>
                            </TableCell>
                            <TableCell className="grid w-full h-full place-items-center">
                                <X
                                    className="w-4 h-4"
                                    onClick={() => {
                                        handleRemove(product.id);
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
