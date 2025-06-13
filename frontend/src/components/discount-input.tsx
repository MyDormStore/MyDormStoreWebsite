import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function DiscountInput() {
    const [input, setInput] = useState("");

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
                    className="px-8">
                    Apply
                </Button>
            </div>
        </div>
    );
}
