import { ChevronLeft, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import CheckoutLayout from "./components/layout/checkout-layout";
import { Button } from "./components/ui/button";
// import { products } from "./data/products";
import { getCart } from "./api/cart";
import { getProducts, getProductsByDorm } from "./api/products";
import { DiscountInput } from "./components/discount-input";
import NavBar from "./components/layout/navbar";
import PaymentLayout from "./components/layout/payment-layout";
import { ProductDetailsCard } from "./components/product-details";
import { ProductTable } from "./components/product-table";
import { RecommendedProducts } from "./components/recommended-products";
import { SelectDorm } from "./components/select-dorm";
import { TotalDetails } from "./components/total-details";
import { CartContextProvider } from "./context/cartContext";
import { ShippingContextProvider } from "./context/shippingContext";
import { DormGroups, dormSelectList } from "./data/residence";
import {
    Cart,
    ShopifyProductsData,
    ShopifyProductsType,
} from "./types/shopify";
import { useParams, useSearchParams } from "react-router";
import { MissingProducts } from "./components/missing-products";
import { useFormStore } from "./core/form";
import { checkGroupFromDorm } from "./lib/dorm-details";

export default function App() {
    const [cart, setCart] = useState<Cart | null>(null);

    const [dorm, setDorm] = useState("");
    const [shippingCost, setShippingCost] = useState(0);
    const [taxLines, setTaxLines] = useState<any[]>([]);

    const [products, setProducts] = useState<
        ShopifyProductsData["products"]["edges"]
    >([]);

    /* 
        The website would load the cart and products on page load
        and then filter the products by the dorm selected
        The cart would be used to display the products in the cart
        The dorm would be used to filter the products by the metafields of the variants/products
        The shipping cost and tax lines would be used to display the total cost of the cart
        The products would be used to display the recommended products based on the dorm selected


        to get the cartID, we can use the URL params
        and then use the cartID to get the cart from the API
    
    */

    const { cartID } = useParams();
    const [searchParams] = useSearchParams();

    /* 
        The website should get the cart and the products on page load
        with the products loaded, the dorm state should filter the list by the metafields of the variants/products

        * Only one API call -> filter the array and make shadow copy
    
    */
    useEffect(() => {
        const fetchAPI = async () => {
            if (cartID) {
                const key = searchParams.get("key");
                setCart(
                    await getCart(`gid://shopify/Cart/${cartID}?key=${key}`)
                );
                const productsResponse = await getProducts();
                productsResponse && setProducts(productsResponse);
            }
        };
        fetchAPI();
    }, [cartID]);

    /* 
        For the required products, we can filter the products by the dorm selected
        and then filter the variants by the metafields of the variants/products

        Using the filtered list, we can display the list of products that are required that are missing from the cart by checking the cart lines
        variants and the metafields of the variants/products from the recommended products
    
    
    */

    const requiredProducts = products.filter((product) => {
        // filter the products that are assigned and then filter the variants
        if (dorm) {
            if (
                product.node.metafields &&
                product.node.metafields[0] !== null
            ) {
                const hasDorm =
                    checkGroupFromDorm(
                        product.node.metafields[0].value
                            .replace(/^\[|\]$/g, "")
                            .replace(/^\"|\"$/g, "")
                            .split(",") as DormGroups[],
                        dorm
                    ) || product.node.metafields[0].value.includes(dorm);
                console.log(hasDorm);
                return hasDorm;
            }
        } else {
            return true;
        }
    });

    const recommendedProducts = products.filter((product) => {
        // filter the products that are assigned and then filter the variants
        if (dorm) {
            if (
                product.node.metafields &&
                product.node.metafields[1] !== null
            ) {
                const hasDorm =
                    checkGroupFromDorm(
                        product.node.metafields[1].value
                            .replace(/^\[|\]$/g, "")
                            .replace(/^\"|\"$/g, "")
                            .split(",") as DormGroups[],
                        dorm
                    ) || product.node.metafields[1].value.includes(dorm);
                console.log(hasDorm);
                return hasDorm;
            }
        } else {
            return true;
        }
    });

    const notInCart = useFormStore((state) => state.notInCart);
    const addNotInCart = useFormStore((state) => state.addNotInCart);

    useEffect(() => {
        const missingProducts: string[] = [];

        if (cart && dorm) {
            requiredProducts.forEach((product) => {
                const productVariants = product.node.variants.edges;

                const isInCart = productVariants.some((variant) => {
                    const variantId = variant.node.id;

                    if (variant.node.title !== "Default Title") {
                        const hasDorm =
                            variant.node.metafields &&
                            variant.node.metafields[0] !== null &&
                            (checkGroupFromDorm(
                                variant.node.metafields[0].value
                                    .replace(/^\[|\]$/g, "")
                                    .replace(/^\"|\"$/g, "")
                                    .split(",") as DormGroups[],
                                dorm
                            ) ||
                                variant.node.metafields[0].value.includes(
                                    dorm
                                ));

                        if (!hasDorm) return false;
                    }

                    return cart.lines.nodes.some(
                        (line) => line.merchandise.id === variantId
                    );
                });

                if (!isInCart) {
                    const disclaimer = product.node.title;
                    missingProducts.push(disclaimer);
                }
            });
        }
        addNotInCart(missingProducts);
    }, [cart, dorm]);

    if (!cartID) return;
    return (
        <CartContextProvider value={{ cart, setCart }}>
            <ShippingContextProvider
                value={{ shippingCost, setShippingCost, taxLines, setTaxLines }}
            >
                <div className="w-dvw h-dvh overflow-y-scroll text-primary">
                    <NavBar />
                    <CheckoutLayout>
                        <div className="p-4 lg:mt-12 lg:pr-8 flex flex-col gap-16">
                            <div className="w-fit flex gap-4 items-center">
                                <Button variant={"outline"} size={"icon"}>
                                    <ChevronLeft />
                                </Button>
                                <ShoppingCart />{" "}
                                <h1 className="text-4xl font-bold">
                                    Shopping Cart
                                </h1>
                            </div>

                            <div className="grid gap-4">
                                <SelectDorm dorm={dorm} setDorm={setDorm} />

                                {notInCart.length > 0 && (
                                    <MissingProducts products={notInCart} />
                                )}
                            </div>
                            <ProductTable dorm={dorm} products={products} />
                            <div className="grid gap-8 lg:gap-8 md:grid-cols-2">
                                <div className="flex flex-col gap-4">
                                    {/* <DiscountInput /> */}
                                </div>
                                <div className="md:w-3/4 md:ml-auto">
                                    <TotalDetails />
                                </div>
                            </div>
                            {requiredProducts.concat(recommendedProducts)
                                .length > 0 && (
                                <div className="w-full gap-4">
                                    <h1 className="md:text-lg font-semibold">
                                        Recommended Product For{" "}
                                        {dormSelectList.find(
                                            (select) => select.key === dorm
                                        )?.label ?? "Your Residence"}
                                    </h1>
                                    <RecommendedProducts>
                                        {requiredProducts
                                            .concat(recommendedProducts)
                                            .map((value) => {
                                                const data =
                                                    value.node as ShopifyProductsType;

                                                return data.variants.edges
                                                    .filter((product) => {
                                                        if (dorm) {
                                                            if (
                                                                product.node
                                                                    .metafields
                                                            ) {
                                                                console.log(
                                                                    product.node
                                                                        .metafields
                                                                );
                                                                if (
                                                                    product.node
                                                                        .metafields[0] !==
                                                                    null
                                                                ) {
                                                                    return (
                                                                        checkGroupFromDorm(
                                                                            product.node.metafields[0].value
                                                                                .replace(
                                                                                    /^\[|\]$/g,
                                                                                    ""
                                                                                )
                                                                                .replace(
                                                                                    /^\"|\"$/g,
                                                                                    ""
                                                                                )
                                                                                .split(
                                                                                    ","
                                                                                ) as DormGroups[],
                                                                            dorm
                                                                        ) ||
                                                                        product.node.metafields[0].value.includes(
                                                                            dorm
                                                                        )
                                                                    );
                                                                } else if (
                                                                    product.node
                                                                        .metafields[1] !==
                                                                    null
                                                                ) {
                                                                    return (
                                                                        checkGroupFromDorm(
                                                                            product.node.metafields[1].value
                                                                                .replace(
                                                                                    /^\[|\]$/g,
                                                                                    ""
                                                                                )
                                                                                .replace(
                                                                                    /^\"|\"$/g,
                                                                                    ""
                                                                                )
                                                                                .split(
                                                                                    ","
                                                                                ) as DormGroups[],
                                                                            dorm
                                                                        ) ||
                                                                        product.node.metafields[1].value.includes(
                                                                            dorm
                                                                        )
                                                                    );
                                                                } else {
                                                                    return true;
                                                                }
                                                            } else {
                                                                return true;
                                                            }
                                                        } else {
                                                            return true;
                                                        }
                                                    })
                                                    .map((variant) => {
                                                        return (
                                                            <ProductDetailsCard
                                                                id={
                                                                    variant.node
                                                                        .id
                                                                }
                                                                name={
                                                                    data.title
                                                                }
                                                                description={
                                                                    variant.node
                                                                        .title !==
                                                                    "Default Title"
                                                                        ? variant
                                                                              .node
                                                                              .title
                                                                        : undefined
                                                                }
                                                                image={
                                                                    data.featuredImage &&
                                                                    data
                                                                        .featuredImage
                                                                        .url
                                                                }
                                                                cost={Number(
                                                                    variant.node
                                                                        .price
                                                                        .amount
                                                                )}
                                                                key={
                                                                    variant.node
                                                                        .id
                                                                }
                                                            />
                                                        );
                                                    });
                                            })}
                                    </RecommendedProducts>
                                </div>
                            )}
                        </div>
                        <div className="p-4 lg:pl-8 lg:mt-24 w-full">
                            <PaymentLayout dorm={dorm} />
                        </div>
                    </CheckoutLayout>
                </div>
            </ShippingContextProvider>
        </CartContextProvider>
    );
}
