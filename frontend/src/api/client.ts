import { createStorefrontApiClient } from "@shopify/storefront-api-client";

const client = createStorefrontApiClient({
    storeDomain: "mydormstore.myshopify.com",
    apiVersion: "2025-04",
    publicAccessToken: import.meta.env.VITE_SHOPIFY_PUBLIC_KEY,
});

export { client };
