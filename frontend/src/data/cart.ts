import type { CartDetailsType } from "@/types/types";
import { products } from "./products";

export const cart: CartDetailsType[] = [
    {
        ...products[0],
        quantity: 1,
    },
    {
        ...products[4],
        quantity: 2,
    },

    {
        ...products[6],
        quantity: 3,
    },
];
