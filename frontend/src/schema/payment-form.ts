import { z } from "zod";

export const paymentFormSchema = z.object({
    cardNumber: z.string(),
    expDate: z.string(),
    CVV: z.string(),
    name: z.string(),
});
export type PaymentFormSchemaType = z.infer<typeof paymentFormSchema>;
