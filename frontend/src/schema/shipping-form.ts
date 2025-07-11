import { z } from "zod";
export const shippingFormSchema = z.object({
    service: z.string().optional(),
    cost: z.number().optional(),
    transitTime: z.number().optional(),
    moveInDate: z.date().optional(),
});
export type ShippingFormSchemaType = z.infer<typeof shippingFormSchema>;
