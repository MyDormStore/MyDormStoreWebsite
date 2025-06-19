import type { DeliveryFormSchemaType } from "@/schema/delivery-form";
import type { PaymentFormSchemaType } from "@/schema/payment-form";
import type { ShippingFormSchemaType } from "@/schema/shipping-form";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface FormState {
    delivery: DeliveryFormSchemaType;
    shipping: ShippingFormSchemaType;
    payment: PaymentFormSchemaType;
    addDelivery: (data: DeliveryFormSchemaType) => void;
    addShipping: (data: ShippingFormSchemaType) => void;
    addPayment: (data: PaymentFormSchemaType) => void;
}

export const useFormStore = create<FormState>()(
    persist(
        (set, get) => ({
            delivery: {} as DeliveryFormSchemaType,
            shipping: {} as ShippingFormSchemaType,
            payment: {} as PaymentFormSchemaType,
            addDelivery(data) {
                set({ delivery: data });
            },
            addShipping(data) {
                set({ shipping: data });
            },
            addPayment(data) {
                set({ payment: data });
            },
        }),
        {
            name: "form-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
