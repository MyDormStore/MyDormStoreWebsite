import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function MissingProducts({ products }: { products: string[] }) {
    return (
        <Alert>
            <CircleAlert className="w-4 h-4 text-error" />

            <AlertTitle className="text-error line-clamp-none">
                Products are missing from your cart. Please check the following
                items:
            </AlertTitle>
            <AlertDescription>
                {products.length > 0 && (
                    <ul className="list-disc pl-5">
                        {products.map((product, index) => (
                            <li key={index}>
                                Required product "{product}" is not in the cart.
                            </li>
                        ))}
                    </ul>
                )}
            </AlertDescription>
        </Alert>
    );
}
