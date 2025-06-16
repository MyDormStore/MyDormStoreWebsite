export type LineItems = {
    variantId: string;
    quantity: number;
};

export type Payload = {
    customer: string;
    lineItems: LineItems[];
};
