export type LineItems = {
    variantId: string;
    quantity: number;
};

export type Payload = {
    customer: string;
    lineItems: LineItems[];
    deliveryDetails: {
        email: string;
        firstName: string;
        lastName: string;
        shippingAddress: {
            postalCode: string;
            country: string;
            city: string;
            state: string;
            street: string;
            residential?: boolean | undefined;
        };
        phoneNumber: string;
        billingAddress?:
            | {
                  postalCode: string;
                  country: string;
                  city: string;
                  state: string;
                  street: string;
                  residential?: boolean | undefined;
              }
            | undefined;
        toggleBillingAddress?: boolean | undefined;
        moveInDate?: string | undefined;
    };
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
