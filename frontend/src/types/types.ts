import { dorm } from "@/data/residence";
import type { ReactNode } from "react";

export interface ProductsType {
    id: string;
    name: string;
    cost: number; // the number should be a float
    description?: string;
    size?: string;
    image?: string; // filename to product
    dorm?: dorm[];
}

export interface CartDetailsType extends ProductsType {
    quantity: number;
    // totalCost: number;
}

export interface LayoutProps {
    children: ReactNode;
}
