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
    const [product, setProduct] = useState<
        ShopifyProductsData["products"]["edges"]
    >([]);
    useEffect(() => {
        const fetchAPI = async () => {
            // await getShop();
            // await getProduct();

            setCart(
                await getCart(
                    "gid://shopify/Cart/Z2NwLXVzLWNlbnRyYWwxOjAxSlhEWDIyTlQ2WkVNQkZQTTREUEQ3NjZY?key=2649bf3eca523015f392cd2b5747bb55"
                )
            );
        };
        fetchAPI();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            console.log(dorm);
            const products =
                dorm !== ""
                    ? await getProductsByDorm(dorm)
                    : await getProducts();
            if (products) {
                setProduct(products);
            }
        };

        fetchProducts();
    }, [dorm]);

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

                            <ProductTable dorm={dorm} />
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
                                    {product.length > 0 &&
                                        product.map((value) => {
                                            const data =
                                                value.node as ShopifyProductsType;
                                            return (
                                                <ProductDetailsCard
                                                    id={
                                                        data.variants.edges[0]
                                                            .node.id
                                                    }
                                                    name={data.title}
                                                    image={
                                                        data.featuredImage.url
                                                    }
                                                    cost={Number(
                                                        data.variants.edges[0]
                                                            .node.price.amount
                                                    )}
                                                    key={data["title"]}
                                                />
                                            );
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
