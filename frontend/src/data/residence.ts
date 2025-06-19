import { AddressSchemaType } from "@/schema/delivery-form";

export const dormList = ["chestnut", "campusOne", "parkside"] as const;

export type dorm = (typeof dormList)[number];

export const dormSelectList: { key: dorm; label: string }[] = [
    {
        key: "campusOne",
        label: "Campus One",
    },
    {
        key: "chestnut",
        label: "Chestnut Residence",
    },
    {
        key: "parkside",
        label: "Parkside Residence",
    },
];

export const campusOneAddress: AddressSchemaType = {
    street: "253 College St",
    country: "CA",
    city: "Toronto",
    state: "ON",
    postalCode: "M5T 1R5",
};
