import { z } from "zod";
import { addressSchema } from "./delivery-form";

export const secondaryAddressSchema = z.object({
    toggleSecondaryDetails: z.boolean().optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    billingAddress: addressSchema.partial().optional(),
    phoneNumber: z.string().optional(),
});
export type SecondaryAddressSchemaType = z.infer<typeof secondaryAddressSchema>;

export const paymentFormSchema = z.object({
    cardNumber: z.string(),
    expDate: z.string(),
    CVV: z.string(),
    name: z.string(),
});
export type PaymentFormSchemaType = z.infer<typeof paymentFormSchema>;
