import { createAdminApiClient } from "@shopify/admin-api-client";
import { config } from "dotenv";

config({ path: ".env" });

export const client = createAdminApiClient({
    storeDomain: "mydormstore.myshopify.com",
    apiVersion: "2025-04",
    accessToken: process.env.SHOPIFY_ADMIN_TOKEN as string,
});
