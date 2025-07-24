import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { applyDiscountCode } from "@/api/cart";
import { useCartContext } from "@/context/cartContext";

export function DiscountInput() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const { cart, setCart } = useCartContext();

    const handleApply = async () => {
        setLoading(true);
        if (cart) {
            const cartResponse = await applyDiscountCode(
                cart?.id,
                input.replace(" ", "") // remove spaces
            );
            setCart(cartResponse);
        }
        setLoading(false);
    };

    return (
        <div className="w-full items-center gap-2 grid">
            <Label>Discount code or gift card</Label>
            <div className="grid lg:flex gap-2">
                <Input
                    placeholder=""
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <Button
                    variant={input ? "default" : "secondary"}
                    disabled={!input}
                    className="px-8"
                    onClick={handleApply}
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Apply"}
                </Button>
            </div>
            {cart?.discountCodes &&
                cart.discountCodes[0] &&
                cart.discountCodes[0].applicable &&
                `${cart.discountCodes[0].code} has been applied`}
        </div>
    );
}
