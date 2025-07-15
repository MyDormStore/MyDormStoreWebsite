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
    const [originalPrice, setOriginalPrice] = useState<number | undefined>(
        undefined
    );

    useEffect(() => {
        if (cart) {
            const totalCart = parseFloat(cart.cost.totalAmount.amount);

            const totalCalculated = cart?.lines.nodes.reduce((sum, product) => {
                return (
                    sum +
                    Number(product.cost.amountPerQuantity.amount) *
                        product.quantity
                );
            }, 0);

            setTotalPrice(
                totalCart < totalCalculated ? totalCart : totalCalculated
            );

            setOriginalPrice(
                totalCart < totalCalculated ? totalCalculated : undefined
            );
        }
    }, [cart]);

    return (
        <div className="grid gap-2">
            <CostDetails
                title="Subtotal:"
                value={totalPrice}
                originalPrice={originalPrice}
            />
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
    originalPrice?: number;
    className?: string;
}

function CostDetails({
    title,
    value,
    originalPrice,
    className = "",
}: CostDetailsProps) {
    return (
        <div className="grid gap-2 grid-cols-[1fr_0.3fr]">
            <h1 className={`text-sm ${className}`}>{title}</h1>
            {value && value !== 0 ? (
                <span className="text-right flex gap-2">
                    {originalPrice && (
                        <span className="line-through">
                            ${originalPrice.toFixed(2)}
                        </span>
                    )}
                    ${value.toFixed(2)}
                </span>
            ) : (
                <Skeleton />
            )}
        </div>
    );
}
