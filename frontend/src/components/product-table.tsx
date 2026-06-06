import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import {
    addProductToCart,
    removeProductFromCart,
    updateProductQuantity,
} from "@/api/cart";
import { useCartContext } from "@/context/cartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ShopifyProductsData, ShopifyProductsType } from "@/types/shopify";
import { Ban, CircleAlert, Loader2, Minus, Plus, X } from "lucide-react";
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

// Parse a Shopify list-metafield value safely.
// Handles proper JSON arrays from Shopify as well as legacy comma-separated values.
const parseMetafieldGroups = (value: string | undefined): DormGroups[] => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.map((s) => String(s).trim()) as DormGroups[];
        }
    } catch {
        // fall through
    }
    return value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, "")) as DormGroups[];
};

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
                    const isRestricted =
                        dorm !== "" &&
                        (checkGroupFromDorm(
                            parseMetafieldGroups(
                                product.merchandise.metafields[2]?.value
                            ),
                            dorm
                        ) ||
                            product.merchandise.metafields[2]?.value.includes(
                                dorm
                            ));
                    if (isRestricted) {
                        const allProductVariants =
                            product.merchandise.product.variants.edges;
                        allProductVariants.forEach((product) => {
                            if (
                                checkGroupFromDorm(
                                    parseMetafieldGroups(
                                        product.node.metafields[3]?.value
                                    ),
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
                    const hasAlternative =
                        recommendedProduct !== null &&
                        recommendedProductVariants.length > 0;
                    const showRemoveOnlyIcon =
                        isRestricted && !hasAlternative;
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
                                {hasAlternative && (
                                    <Popover>
                                        <PopoverTrigger>
                                            <CircleAlert className="w-4 h-4 text-orange-500 -mr-4" />
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="flex flex-col gap-1"
                                            side="bottom"
                                        >
                                            <h1 className="text-center w-full font-bold">
                                                Incorrect for your residence.
                                                Please update to the correct
                                                item:
                                            </h1>
                                            {[
                                                recommendedProductVariants[0],
                                            ].map((recommendedProductVariant) => {
                                                return (
                                                    <>
                                                        <ProductDetails
                                                            id={
                                                                recommendedProduct!.id
                                                            }
                                                            name={
                                                                recommendedProduct!.title
                                                            }
                                                            description={
                                                                recommendedProductVariant
                                                                    .node.title
                                                            }
                                                            image={
                                                                recommendedProduct!.featuredImage &&
                                                                recommendedProduct!
                                                                    .featuredImage
                                                                    .url
                                                            }
                                                            cost={Number(
                                                                recommendedProductVariant
                                                                    .node.price
                                                                    .amount
                                                            )}
                                                            key={
                                                                recommendedProductVariant
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
                                            })}
                                        </PopoverContent>
                                    </Popover>
                                )}
                                {showRemoveOnlyIcon && (
                                    <Popover>
                                        <PopoverTrigger>
                                            <Ban className="w-4 h-4 text-red-500 -mr-4" />
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="flex flex-col gap-2"
                                            side="bottom"
                                        >
                                            <h1 className="text-center w-full font-bold">
                                                Not allowed at your residence.
                                                Please remove this item from
                                                your cart.
                                            </h1>
                                            <Button
                                                variant={"destructive"}
                                                disabled={loading}
                                                onClick={() => {
                                                    handleRemove(product.id);
                                                }}
                                            >
                                                {loading ? (
                                                    <Loader2 className="animate-spin" />
                                                ) : (
                                                    "Remove from Cart"
                                                )}
                                            </Button>
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
                    const isRestricted =
                        dorm !== "" &&
                        (checkGroupFromDorm(
                            parseMetafieldGroups(
                                product.merchandise.metafields[2]?.value
                            ),
                            dorm
                        ) ||
                            product.merchandise.metafields[2]?.value.includes(
                                dorm
                            ));
                    if (isRestricted) {
                        const allProductVariants =
                            product.merchandise.product.variants.edges;
                        allProductVariants.forEach((product) => {
                            if (
                                checkGroupFromDorm(
                                    parseMetafieldGroups(
                                        product.node.metafields[3]?.value
                                    ),
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
                    const hasAlternative =
                        recommendedProduct !== null &&
                        recommendedProductVariants.length > 0;
                    const showRemoveOnlyIcon =
                        isRestricted && !hasAlternative;
                    return (
                        <TableRow key={index}>
                            <TableCell>
                                <div className="flex gap-2 items-center w-24">
                                    <img
                                        src={product.merchandise.image.url}
                                        className="h-16 w-16 rounded object-fill"
                                    />
                                    {hasAlternative && (
                                        <Popover>
                                            <PopoverTrigger>
                                                <CircleAlert className="w-4 h-4 text-orange-500" />
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="flex flex-col gap-1 w-full"
                                                side="right"
                                            >
                                                <h1 className="text-center w-full font-bold">
                                                    Incorrect for your
                                                    residence. Please update
                                                    to the correct item:
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
                                                                        recommendedProduct!.id
                                                                    }
                                                                    name={
                                                                        recommendedProduct!.title
                                                                    }
                                                                    description={
                                                                        recommendedProductVariant
                                                                            .node
                                                                            .title
                                                                    }
                                                                    image={
                                                                        recommendedProduct!.featuredImage &&
                                                                        recommendedProduct!
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
                                    {showRemoveOnlyIcon && (
                                        <Popover>
                                            <PopoverTrigger>
                                                <Ban className="w-4 h-4 text-red-500" />
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="flex flex-col gap-2 w-full"
                                                side="right"
                                            >
                                                <h1 className="text-center w-full font-bold">
                                                    Not allowed at your
                                                    residence. Please remove
                                                    this item from your cart.
                                                </h1>
                                                <Button
                                                    variant={"destructive"}
                                                    disabled={loading}
                                                    onClick={() => {
                                                        handleRemove(
                                                            product.id
                                                        );
                                                    }}
                                                >
                                                    {loading ? (
                                                        <Loader2 className="animate-spin" />
                                                    ) : (
                                                        "Remove from Cart"
                                                    )}
                                                </Button>
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
                                    {product.attributes &&
                                        product.attributes.some(
                                            (prod) =>
                                                prod.key === "Included Products"
                                        ) && (
                                            <span className="font-light max-w-96 text-wrap">
                                                {
                                                    product.attributes.find(
                                                        (prod) =>
                                                            prod.key ===
                                                            "Included Products"
                                                    )?.value
                                                }
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
