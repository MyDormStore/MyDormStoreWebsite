import type { CartDetailsType, ProductsType } from "@/types/types";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { CirclePlus, Loader2 } from "lucide-react";
import { useCartContext } from "@/context/cartContext";
import { addProductToCart } from "@/api/cart";
// import { updateCart } from "@/hooks/use-update-cart";
import { useState } from "react";
import { ShopifyProductsData, ShopifyProductsType } from "@/types/shopify";

export function ProductDetails(product: ProductsType) {
    return (
        <div className="flex gap-2 h-fit items-center">
            <img src={product.image} className="object-cover h-16 rounded" />
            <div className="grid gap-2">
                <span className="font-semibold">{product.name}</span>
                {product.description && (
                    <span className="font-light">{product.description}</span>
                )}
            </div>
            <span className="ml-auto">${product.cost.toFixed(2)}</span>
        </div>
    );
}

export function ProductDetailsCard(product: ProductsType) {
    const { cart, setCart } = useCartContext();

    const addProduct = async () => {
        setLoading(true);
        const cartRes = await addProductToCart(product.id, cart?.id as string);
        if (cartRes) {
            setCart(cartRes);
        }
        setLoading(false);
    };

    const [loading, setLoading] = useState(false);

    return (
        <Card className="min-w-52">
            <CardContent className="h-full">
                <img
                    src={product.image}
                    className="object-cover w-48 rounded"
                />
                <div className="grid gap-2 mt-2">
                    <span className="font-semibold">{product.name}</span>
                    {product.description && (
                        <span className="font-light">
                            {product.description}
                        </span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-end">
                <span className="font-medium">${product.cost.toFixed(2)}</span>
                <Button
                    variant={loading ? "ghost" : "secondary"}
                    size={"icon"}
                    disabled={loading}
                    onClick={addProduct}
                >
                    {loading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <CirclePlus />
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

// export function ProductDetails(product: ProductsType) {
//     return (
//         <div className="flex gap-2 h-fit items-center">
//             <img src={product.image} className="object-cover h-16 rounded" />
//             <div className="grid gap-1">
//                 <span className="font-semibold">{product.name}</span>
//                 <span className="font-light">{product.description}</span>
//             </div>
//             <span className="ml-auto">${product.cost}</span>
//         </div>
//     );
// }

// export function ProductDetailsCard(product: ProductsType) {
//     const { setCart } = useCartContext();
//     const addProduct = async () => {
//         setLoading(true);
//         const cartRes = await addProductToCart();
//         if (cartRes) {
//             setCart(await updateCart(cartRes));
//         }
//         setLoading(false);
//     };

//     const [loading, setLoading] = useState(false);

//     return (
//         <Card className="min-w-52">
//             <CardContent className="h-full">
//                 <img
//                     src={product.image}
//                     className="object-cover w-48 rounded"
//                 />
//                 <div className="grid gap-2 mt-2">
//                     <span className="font-semibold">{product.name}</span>
//                     <span className="font-light">{product.description}</span>
//                 </div>
//             </CardContent>
//             <CardFooter className="flex gap-2 justify-end">
//                 <span className="font-medium">${product.cost.toFixed(2)}</span>
//                 <Button
//                     variant={loading ? "ghost" : "secondary"}
//                     size={"icon"}
//                     disabled={loading}
//                     onClick={addProduct}>
//                     {loading ? (
//                         <Loader2 className="animate-spin" />
//                     ) : (
//                         <CirclePlus />
//                     )}
//                 </Button>
//             </CardFooter>
//         </Card>
//     );
// }
