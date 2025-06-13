type ProductImage = {
    id?: string;
    url?: string;
};

type ProductVariant = {
    id: string;
    price: {
        amount: string;
    };
};

export interface ShopifyProductsType {
    id: string;
    onlineStoreUrl: string;
    title: string;
    featuredImage: ProductImage;
    variants: {
        edges: {
            node: ProductVariant;
        }[];
    };
}

export interface ShopifyProductsData {
    products: {
        edges: {
            node: ShopifyProductsType;
        }[];
    };
}

export type Cart = {
    id: string;
    lines: {
        nodes: CartLine[];
    };
    totalQuantity: number;
};

export type CartLine = {
    id: string;
    merchandise: {
        id: string;
        title: string;
        image: {
            url?: string; // Assuming the image object contains a URL
        };
    };
    quantity: number;
    cost: {
        amountPerQuantity: {
            amount: string;
        };
    };
};
