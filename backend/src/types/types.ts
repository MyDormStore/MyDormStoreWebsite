export type LineItems = {
    variantID: string;
    quantity: number;
};

export type Payload = {
    customer: string;
    lineItems: LineItems[];
};
