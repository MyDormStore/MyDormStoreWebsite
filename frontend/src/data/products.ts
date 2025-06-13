import type { ProductsType } from "@/types/types";

export const products: ProductsType[] = [
    {
        name: "Basic Bedding Package",
        cost: 99.95,
        image: "/product-photos/basic-bedding-package.jpeg",
        description: "Twin size",
        dorm: ["parkside"],
    },
    {
        name: "Standard Bedding Package",
        cost: 149.95,
        image: "/product-photos/full-bedding-package.jpeg",
        description: "Twin size. Blue Comforter",
        dorm: ["campusOne", "chestnut"],
    },
    {
        name: "Exam & Midterm Care Package",
        cost: 84.0,
        image: "/product-photos/exam-midterm-care-package.jpeg",
        description: "Bathrobe and Tea",
        dorm: ["campusOne", "chestnut"],
    },
    {
        name: "Laundry Essentials",
        cost: 44.99,
        image: "/product-photos/laundry-essentials.jpeg",
        description: "Blue Laundry Hamper and Large Washing Basket",
        dorm: ["chestnut"],
    },
    {
        name: "Tech Essentials",
        cost: 29.99,
        image: "/product-photos/tech-essentials.jpeg",
        dorm: ["campusOne", "parkside"],
    },
    {
        name: "Birthday Care Package",
        cost: 49.0,
        image: "/product-photos/birthday-care-package.jpeg",
    },
    {
        name: "Organization Essentials",
        cost: 24.99,
        image: "/product-photos/organization-essentials.jpeg",
        dorm: ["campusOne", "parkside"],
    },
    {
        name: "Sleep Country Complete Bedding Package",
        cost: 259.95,
        image: "/product-photos/sleep-country-signature-package.jpeg",
    },
    {
        name: "Kitchen Essentials",
        cost: 149.99,
        image: "/product-photos/kitchen-essentials.jpeg",
        dorm: ["campusOne"],
    },
    {
        name: "Cleaning Essentials",
        cost: 39.99,
        image: "/product-photos/cleaning-essentials.jpeg",
    },
];
