import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
// import { cart } from "@/data/cart";
import {
    addProductToCart,
    removeProductFromCart,
    updateProductQuantity,
} from "@/api/cart";
import { useCartContext } from "@/context/cartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ShopifyProductsData, ShopifyProductsType } from "@/types/shopify";
import { CircleAlert, Loader2, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { ProductDetails } from "./product-details";
import { Button } from "./ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { DormGroups } from "@/data/residence";
import { checkGroupFromDorm } from "@/lib/dorm-details";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
        const cartRes = await removeProductFromCart([id], cart.id);
        setCart(cartRes);
        setLoading(false);
    };

    if (isMobile) {
        return (
            <div className="h-fit overflow-scroll grid gap-8 px-2 py-4">
                {cart.lines.nodes.map((product, index) => {
                    let recommendedProductVariants: ShopifyProductsType["variants"]["edges"][number][] =
                        [];

                    let recommendedProduct: ShopifyProductsType | null = null;
                    if (
                        dorm !== "" &&
                        (checkGroupFromDorm(
                            product.merchandise.metafields[2]?.value
                                .replace(/^\[|\]$/g, "")
                                .replace(/^\"|\"$/g, "")
                                .split(",") as DormGroups[],
                            dorm
                        ) ||
                            product.merchandise.metafields[2]?.value.includes(
                                dorm
                            ))
                    ) {
                        const allProductVariants =
                            product.merchandise.product.variants.edges;

                        allProductVariants.forEach((product) => {
                            // console.log(product);
                            if (
                                checkGroupFromDorm(
                                    product.node.metafields[3]?.value
                                        .replace(/^\[|\]$/g, "")
                                        .replace(/^\"|\"$/g, "")
                                        .split(",") as DormGroups[],
                                    dorm
                                ) ||
                                product.node.metafields[3]?.value.includes(dorm)
                            ) {
                                recommendedProductVariants.push(product);
                            }
                        });

                        if (recommendedProductVariants.length > 0) {
                            recommendedProduct = product.merchandise.product;
                        }
                    }

                    return (
                        <div className="grid gap-2 shadow p-2" key={index}>
                            <ProductDetails
                                id={product.merchandise.id}
                                name={product.merchandise.product.title}
                                description={
                                    product.merchandise.title !==
                                    "Default Title"
                                        ? product.merchandise.title
                                        : undefined
                                }
                                image={product.merchandise.image.url}
                                cost={Number(
                                    product.cost.amountPerQuantity.amount
                                )}
                            />

                            <div className="flex justify-between items-center w-full">
                                {dorm !== "" &&
                                    recommendedProduct !== null &&
                                    recommendedProductVariants.length > 0 && (
                                        <Popover>
                                            <PopoverTrigger>
                                                <CircleAlert className="w-4 h-4 text-orange-500 -mr-4" />
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="flex flex-col gap-1"
                                                side="bottom"
                                            >
                                                <h1 className="text-center w-full font-bold">
                                                    Incorrect bedding size for
                                                    your residence. Please
                                                    update to the required size:
                                                </h1>
                                                {[
                                                    recommendedProductVariants[0],
                                                ].map(
                                                    (
                                                        recommendedProductVariant
                                                    ) => {
                                                        return (
                                                            <>
                                                                <ProductDetails
                                                                    id={
                                                                        recommendedProduct.id
                                                                    }
                                                                    name={
                                                                        recommendedProduct.title
                                                                    }
                                                                    description={
                                                                        recommendedProductVariant
                                                                            .node
                                                                            .title
                                                                    }
                                                                    image={
                                                                        recommendedProduct.featuredImage &&
                                                                        recommendedProduct
                                                                            .featuredImage
                                                                            .url
                                                                    }
                                                                    cost={Number(
                                                                        recommendedProductVariant
                                                                            .node
                                                                            .price
                                                                            .amount
                                                                    )}
                                                                    key={
                                                                        recommendedProductVariant
                                                                            .node
                                                                            .id
                                                                    }
                                                                />
                                                                <Button
                                                                    variant={
                                                                        "secondary"
                                                                    }
                                                                    disabled={
                                                                        loading
                                                                    }
                                                                    onClick={async () => {
                                                                        setLoading(
                                                                            true
                                                                        );

                                                                        // const cartRes =
                                                                        await addProductToCart(
                                                                            recommendedProductVariant
                                                                                .node
                                                                                .id,
                                                                            cart?.id as string
                                                                        );
                                                                        const cartRes =
                                                                            await removeProductFromCart(
                                                                                [
                                                                                    product.id,
                                                                                ],
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
                                                            </>
                                                        );
                                                    }
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    )}

                                <div
                                    className={
                                        "flex gap-2 items-center justify-center mx-auto"
                                    }
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
                                {loading ? (
                                    <Loader2 className="animate-spin w-4 h-4" />
                                ) : (
                                    <X
                                        className="w-4 h-4 cursor-pointer"
                                        onClick={() => {
                                            handleRemove(product.id);
                                        }}
                                    />
                                )}
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
                    let recommendedProductVariants: ShopifyProductsType["variants"]["edges"][number][] =
                        [];

                    let recommendedProduct: ShopifyProductsType | null = null;
                    if (
                        dorm !== "" &&
                        (checkGroupFromDorm(
                            product.merchandise.metafields[2]?.value
                                .replace(/^\[|\]$/g, "")
                                .replace(/^\"|\"$/g, "")
                                .split(",") as DormGroups[],
                            dorm
                        ) ||
                            product.merchandise.metafields[2]?.value.includes(
                                dorm
                            ))
                    ) {
                        const allProductVariants =
                            product.merchandise.product.variants.edges;

                        allProductVariants.forEach((product) => {
                            // console.log(product);
                            if (
                                checkGroupFromDorm(
                                    product.node.metafields[3]?.value
                                        .replace(/^\[|\]$/g, "")
                                        .replace(/^\"|\"$/g, "")
                                        .split(",") as DormGroups[],
                                    dorm
                                ) ||
                                product.node.metafields[3]?.value.includes(dorm)
                            ) {
                                recommendedProductVariants.push(product);
                            }
                        });

                        if (recommendedProductVariants.length > 0) {
                            recommendedProduct = product.merchandise.product;
                        }
                    }

                    return (
                        <TableRow key={index}>
                            <TableCell>
                                <div className="flex gap-2 items-center w-24">
                                    <img
                                        src={product.merchandise.image.url}
                                        className="h-16 w-16 rounded object-fill"
                                    />
                                    {dorm !== "" &&
                                        recommendedProduct !== null &&
                                        recommendedProductVariants.length >
                                            0 && (
                                            <Popover>
                                                <PopoverTrigger>
                                                    <CircleAlert className="w-4 h-4 text-orange-500" />
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="flex flex-col gap-1 w-full"
                                                    side="right"
                                                >
                                                    <h1 className="text-center w-full font-bold">
                                                        Incorrect bedding size
                                                        for your residence.
                                                        Please update to the
                                                        required size:
                                                    </h1>
                                                    {[
                                                        recommendedProductVariants[0],
                                                    ].map(
                                                        (
                                                            recommendedProductVariant
                                                        ) => {
                                                            return (
                                                                <>
                                                                    <ProductDetails
                                                                        id={
                                                                            recommendedProduct.id
                                                                        }
                                                                        name={
                                                                            recommendedProduct.title
                                                                        }
                                                                        description={
                                                                            recommendedProductVariant
                                                                                .node
                                                                                .title
                                                                        }
                                                                        image={
                                                                            recommendedProduct.featuredImage &&
                                                                            recommendedProduct
                                                                                .featuredImage
                                                                                .url
                                                                        }
                                                                        cost={Number(
                                                                            recommendedProductVariant
                                                                                .node
                                                                                .price
                                                                                .amount
                                                                        )}
                                                                        key={
                                                                            recommendedProductVariant
                                                                                .node
                                                                                .id
                                                                        }
                                                                    />
                                                                    <Button
                                                                        variant={
                                                                            "secondary"
                                                                        }
                                                                        disabled={
                                                                            loading
                                                                        }
                                                                        onClick={async () => {
                                                                            setLoading(
                                                                                true
                                                                            );

                                                                            // const cartRes =
                                                                            await addProductToCart(
                                                                                recommendedProductVariant
                                                                                    .node
                                                                                    .id,
                                                                                cart?.id as string
                                                                            );
                                                                            const cartRes =
                                                                                await removeProductFromCart(
                                                                                    [
                                                                                        product.id,
                                                                                    ],
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
                                                                </>
                                                            );
                                                        }
                                                    )}
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="grid gap-1">
                                    <span className="font-semibold">
                                        {product.merchandise.product.title}
                                    </span>
                                    {product.merchandise.title !==
                                        "Default Title" && (
                                        <span className="font-light">
                                            {product.merchandise.title}
                                        </span>
                                    )}
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
                            <TableCell className="">
                                {loading ? (
                                    <Loader2 className="animate-spin w-4 h-4" />
                                ) : (
                                    <X
                                        className="w-4 h-4 cursor-pointer"
                                        onClick={() => {
                                            handleRemove(product.id);
                                        }}
                                    />
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
