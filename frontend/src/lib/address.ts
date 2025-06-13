import { campusOneAddress, dorm } from "@/data/residence";
import { AddressSchemaType } from "@/schema/delivery-form";

export function getAddress(dorm: dorm) {
    if (dorm === "campusOne") {
        return campusOneAddress;
    } else {
        return null;
    }
}
