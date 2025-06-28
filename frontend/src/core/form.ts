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
    addDelivery: (data: DeliveryFormSchemaType) => void;
    addShipping: (data: ShippingFormSchemaType) => void;
    addPayment: (data: SecondaryAddressSchemaType) => void;
    addNotInCart: (data: string[]) => void;
}

export const useFormStore = create<FormState>()(
    // persist(
    (set, get) => ({
        delivery: {} as DeliveryFormSchemaType,
        shipping: {} as ShippingFormSchemaType,
        payment: {} as PaymentFormSchemaType,
        notInCart: [],
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
    })
    //     {
    //         name: "form-storage",
    //         storage: createJSONStorage(() => localStorage),
    //     }
    // )
);
