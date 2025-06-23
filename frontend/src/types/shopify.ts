type ProductImage = {
    id?: string;
    url?: string;
};

type ProductVariant = {
    id: string;
    title: string;
    price: {
        amount: string;
    };
    metafields: Metafields;
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
    metafields: Metafields;
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
        metafields: Metafields;
        product: ShopifyProductsType;
    };
    quantity: number;
    cost: {
        amountPerQuantity: {
            amount: string;
        };
    };
};

export type Metafields = [
    {
        id: string;
        namespace: "dorm";
        key: "required";
        value: string;
        type: "list.single_line_text_field";
    } | null,
    {
        id: string;
        namespace: "dorm";
        key: "recommended";
        value: string;
        type: "list.single_line_text_field";
    } | null,
    {
        id: string;
        namespace: "dorm";
        key: "not-allowed";
        value: string;
        type: "list.single_line_text_field";
    } | null
];
