import { AddressSchemaType } from "@/schema/delivery-form";

export const dormList = ["chestnut", "campusOne", "parkside"] as const;
export type dorm = (typeof dormList)[number];

export const schoolList = ["uoft", "tmu", "york"] as const;
export type school = (typeof schoolList)[number];

export const dormSelectList: { key: dorm; label: string; school?: school }[] = [
    {
        key: "campusOne",
        label: "Campus One",
        school: "uoft",
    },
    {
        key: "chestnut",
        label: "Chestnut Residence",
        school: "uoft",
    },
    {
        key: "parkside",
        label: "Parkside Residence",
        school: "tmu",
    },
];

export const schoolSelectList: { key: school; label: string }[] = [
    {
        key: "uoft",
        label: "University of Toronto",
    },
    {
        key: "tmu",
        label: "Toronto Metropolitan University",
    },
    {
        key: "york",
        label: "York University",
    },
];

export const campusOneAddress: AddressSchemaType = {
    street: "253 College St",
    country: "CA",
    city: "Toronto",
    state: "ON",
    postalCode: "M5T 1R5",
};
