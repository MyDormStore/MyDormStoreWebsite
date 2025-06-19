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
import { dormSelectList } from "./data/residence";
import {
    Cart,
    ShopifyProductsData,
    ShopifyProductsType,
} from "./types/shopify";

export default function App() {
    const [cart, setCart] = useState<Cart | null>(null);

    const [dorm, setDorm] = useState("");
    const [shippingCost, setShippingCost] = useState(0);
    const [products, setProducts] = useState<
        ShopifyProductsData["products"]["edges"]
    >([]);

    const [productRecommendations, setProductRecommendations] = useState<
        ShopifyProductsData["products"]["edges"]
    >([]);

    /* 
        The website should get the cart and the products on page load
        with the products loaded, the dorm state should filter the list by the metafields of the variants/products

        * Only one API call -> filter the array and make shadow copy
    
    */
    useEffect(() => {
        const fetchAPI = async () => {
            setCart(
                await getCart(
                    "gid://shopify/Cart/Z2NwLXVzLWNlbnRyYWwxOjAxSlhEWDIyTlQ2WkVNQkZQTTREUEQ3NjZY?key=2649bf3eca523015f392cd2b5747bb55"
                )
            );
            const productsResponse = await getProducts();

            productsResponse && setProducts(productsResponse);
        };
        fetchAPI();
    }, []);

    return (
        <CartContextProvider value={{ cart, setCart }}>
            <ShippingContextProvider value={{ shippingCost, setShippingCost }}>
                <div className="w-dvw h-dvh overflow-y-scroll">
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

                            <SelectDorm dorm={dorm} setDorm={setDorm} />

                            <ProductTable dorm={dorm} products={products} />
                            <div className="grid gap-8 lg:gap-8 md:grid-cols-2">
                                <div className="flex flex-col gap-4">
                                    <DiscountInput />
                                </div>
                                <div className="md:w-3/4 md:ml-auto">
                                    <TotalDetails />
                                </div>
                            </div>

                            <div className="w-full gap-4">
                                <h1 className="md:text-lg font-semibold">
                                    Recommended Product For{" "}
                                    {dormSelectList.find(
                                        (select) => select.key === dorm
                                    )?.label ?? "Your Residence"}
                                </h1>
                                <RecommendedProducts>
                                    {products.length > 0 &&
                                        products
                                            .filter((product) => {
                                                // TODO: remove the product metafield and assign to just variants?
                                                // ? filter the products that are assigned and then filter the variants
                                                if (dorm) {
                                                    if (
                                                        product.node
                                                            .metafields &&
                                                        product.node
                                                            .metafields[1] !==
                                                            null
                                                    ) {
                                                        console.log(product);
                                                        return product.node.metafields[1].value.includes(
                                                            dorm
                                                        );
                                                    }
                                                } else {
                                                    return true;
                                                }
                                            })
                                            .map((value) => {
                                                const data =
                                                    value.node as ShopifyProductsType;

                                                return data.variants.edges
                                                    .filter((product) => {
                                                        if (dorm) {
                                                            if (
                                                                product.node
                                                                    .metafields &&
                                                                product.node
                                                                    .metafields[1] !==
                                                                    null
                                                            ) {
                                                                return product.node.metafields[1].value.includes(
                                                                    dorm
                                                                );
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
                                                // console.log(data);
                                            })}
                                </RecommendedProducts>
                            </div>
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
