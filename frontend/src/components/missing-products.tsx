import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function MissingProducts({ products }: { products: string[] }) {
    return (
        <Alert>
            <CircleAlert className="w-4 h-4 text-orange-500" />

            <AlertTitle>
                Products are missing from your cart. Please check the following
                items:
            </AlertTitle>
            <AlertDescription>
                {products.length > 0 && (
                    <ul className="list-disc pl-5">
                        {products.map((product, index) => (
                            <li key={index} className="text-orange-700">
                                Recommended product "{product}" is not in the
                                cart.
                            </li>
                        ))}
                    </ul>
                )}
            </AlertDescription>
        </Alert>
    );
}
