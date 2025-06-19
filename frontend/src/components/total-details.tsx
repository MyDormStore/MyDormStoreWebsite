// import { cart } from "@/data/cart";
import { useCartContext } from "@/context/cartContext";
import { useEffect, useState } from "react";
import { Separator } from "./ui/separator";
import { useShippingContext } from "@/context/shippingContext";
import { Skeleton } from "./ui/skeleton";

export function TotalDetails() {
    const { cart } = useCartContext();

    const { shippingCost, taxLines } = useShippingContext();

    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        if (cart) {
            const total = cart?.lines.nodes.reduce((sum, product) => {
                return (
                    sum +
                    Number(product.cost.amountPerQuantity.amount) *
                        product.quantity
                );
            }, 0);

            setTotalPrice(total);
        }
    }, [cart]);

    return (
        <div className="grid gap-2">
            <CostDetails title="Subtotal:" value={totalPrice} />
            <CostDetails title="Shipping" value={shippingCost} />
            <CostDetails
                title="Estimated Tax:"
                value={
                    taxLines[0] &&
                    parseFloat(taxLines[0].priceSet.shopMoney.amount)
                }
            />
            <Separator />
            <CostDetails
                title="Total:"
                className="font-bold"
                value={
                    totalPrice +
                    shippingCost +
                    (taxLines[0]
                        ? parseFloat(taxLines[0].priceSet.shopMoney.amount)
                        : 0)
                }
            />
        </div>
    );
}

interface CostDetailsProps {
    title: string;
    value: number;
    className?: string;
}

function CostDetails({ title, value, className = "" }: CostDetailsProps) {
    return (
        <div className="grid gap-2 grid-cols-[1fr_0.3fr]">
            <h1 className={`text-sm ${className}`}>{title}</h1>
            {value && value !== 0 ? (
                <span className="text-right">${value.toFixed(2)}</span>
            ) : (
                <Skeleton />
            )}
        </div>
    );
}
