import { useFormStore } from "@/core/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";

export function SelectOrderType() {
    const orderType = useFormStore((state) => state.orderType);
    const setOrderType = useFormStore((state) => state.setOrderType);

    const handleOrderTypeSelect = (type: "move-in" | "regular") => {
        setOrderType(type);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>What type of order is this?</CardTitle>
                <CardDescription>
                    Select whether you're preparing for move-in or ordering for
                    regular use
                </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button
                    variant={orderType === "move-in" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleOrderTypeSelect("move-in")}
                >
                    Move-In Order
                </Button>
                <Button
                    variant={orderType === "regular" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => handleOrderTypeSelect("regular")}
                >
                    Regular Order
                </Button>
            </CardContent>
        </Card>
    );
}
