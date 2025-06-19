import { z } from "zod";
export const shippingFormSchema = z.object({
    service: z.string(),
    cost: z.number(),
    transitTime: z.number().optional(),
});
export type ShippingFormSchemaType = z.infer<typeof shippingFormSchema>;
