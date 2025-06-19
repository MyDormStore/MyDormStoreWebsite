export type LineItems = {
    variantId: string;
    quantity: number;
};

export type Payload = {
    customer: string;
    lineItems: LineItems[];
    deliveryDetails: DeliveryForm;
};

type DeliveryForm = {
    email: string;
    firstName: string;
    lastName: string;
    shippingAddress: AddressSchemaType;
    phoneNumber: string;
    moveInDate?: string;
    toggleSecondaryDetails?: boolean;
    secondaryDetails?: {
        email: string;
        firstName: string;
        lastName: string;
        billingAddress: AddressSchemaType;
        phoneNumber: string;
    };
};

type AddressSchemaType = {
    state: string;
    postalCode: string;
    country: string;
    city: string;
    street: string;
    residential?: boolean | undefined;
};

export type Order = {
    currency: string;
    financialStatus: string;
    email?: string;
    phone?: string;
    lineItems: LineItems[];
    shippingAddress: AddressType;
    test?: boolean;
    billingAddress?: AddressType;
    fulfillment?: {
        trackingCompany: string;
    };
    shippingLines?: {
        title: string;
        priceSet: {
            shopMoney: {
                amount: number;
                currencyCode: string;
            };
        };
    }[];
};

type AddressType = {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    countryCode: string;
    zip: string;
    provinceCode: string;
};
