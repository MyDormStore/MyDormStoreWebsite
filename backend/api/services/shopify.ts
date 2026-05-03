import { createAdminApiClient } from "@shopify/admin-api-client";
import { config } from "dotenv";

config({ path: ".env" });

export const client = createAdminApiClient({
    storeDomain: "mydormstore.myshopify.com",
    apiVersion: "2025-10",
    accessToken: process.env.SHOPIFY_ADMIN_TOKEN as string,
});

// Test the client
(async () => {
    try {
        const { data, errors } = await client.request(`
            query {
                shop {
                    name
                }
            }
        `);
        if (errors) {
            console.error("Shopify client test failed with errors:", errors);
        } else {
            console.log("Shopify client test successful:", data.shop.name);
        }
    } catch (error) {
        console.error("Shopify client test failed:", error);
    }
})();
