import {
    dorm,
    dormAddresses,
    DormGroups,
    dormGroupsList,
} from "@/data/residence";
import { AddressSchemaType } from "@/schema/delivery-form";

export function getAddress(dorm: dorm) {
    if (dormAddresses[dorm]) {
        return dormAddresses[dorm];
    }
    return null;
}

// all the groups are in an array of string
export function checkGroupFromDorm(groups: DormGroups[], dorm: dorm) {
    if (groups) {
        return groups.some((group) => {
            if (dormGroupsList[group])
                return dormGroupsList[group].includes(dorm);
            else return false;
        });
    } else {
        return false;
    }
}
