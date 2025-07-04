import { dorm, dormAddresses } from "@/data/residence";
import { AddressSchemaType } from "@/schema/delivery-form";

export function getAddress(dorm: dorm) {
    if (dormAddresses[dorm]) {
        return dormAddresses[dorm];
    }
    return null;
}

export function getGrouping(dorm: dorm) {}
