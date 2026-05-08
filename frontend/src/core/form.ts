import type { DeliveryFormSchemaType } from "@/schema/delivery-form";
import type {
    PaymentFormSchemaType,
    SecondaryAddressSchemaType,
} from "@/schema/payment-form";
import type { ShippingFormSchemaType } from "@/schema/shipping-form";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface FormState {
    delivery: DeliveryFormSchemaType;
    shipping: ShippingFormSchemaType;
    payment: SecondaryAddressSchemaType;
    notInCart: string[];
    orderType: "move-in" | "regular" | "";
    addDelivery: (data: DeliveryFormSchemaType) => void;
    addShipping: (data: ShippingFormSchemaType) => void;
    addPayment: (data: SecondaryAddressSchemaType) => void;
    addNotInCart: (data: string[]) => void;
    setOrderType: (type: "move-in" | "regular") => void;
}

export const useFormStore = create<FormState>()(
    // persist(
    (set, get) => ({
        delivery: {} as DeliveryFormSchemaType,
        shipping: {} as ShippingFormSchemaType,
        payment: {} as SecondaryAddressSchemaType,
        notInCart: [],
        orderType: "",
        addDelivery(data) {
            set({ delivery: data });
        },
        addShipping(data) {
            set({ shipping: data });
        },
        addPayment(data) {
            set({ payment: data });
        },
        addNotInCart(data) {
            set({ notInCart: data });
        },
        setOrderType(type) {
            set({ orderType: type });
        },
    }),
    //     {
    //         name: "form-storage",
    //         storage: createJSONStorage(() => localStorage),
    //     }
    // )
);
