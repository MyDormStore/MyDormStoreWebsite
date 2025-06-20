import { z } from "zod";

const addressSchema = z.object({
    postalCode: z.string().min(1, "Postal Code is required").toUpperCase(),
    country: z.string().min(1, "Country Code is required").toUpperCase(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required").toUpperCase(),
    street: z.string().min(1, "Street is required"),
    residential: z.boolean().optional(),
});

export const deliveryFormSchema = z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    shippingAddress: addressSchema,
    phoneNumber: z.string(),
    toggleSecondaryDetails: z.boolean().optional(),
    secondaryDetails: z
        .object({
            email: z.string().email(),
            firstName: z.string(),
            lastName: z.string(),
            billingAddress: addressSchema,
            phoneNumber: z.string(),
        })
        .optional(),
});

export type DeliveryFormSchemaType = z.infer<typeof deliveryFormSchema>;

export type AddressSchemaType = z.infer<typeof addressSchema>;
