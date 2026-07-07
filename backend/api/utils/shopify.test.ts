import test from "node:test";
import assert from "node:assert/strict";

const { buildDuplicateOrderLookupInput } = require("./shopify.ts");

test("buildDuplicateOrderLookupInput normalizes the lookup values", () => {
    const input = buildDuplicateOrderLookupInput({
        customer: "customer-1",
        amount: 12345,
        currency: "cad",
        lineItems: [],
        deliveryDetails: {
            email: "Tester@Example.com",
            firstName: "Test",
            lastName: "User",
            shippingAddress: {
                street: " 123 Main St ",
                city: "Toronto",
                country: "CA",
                postalCode: "M5V 2T6",
                state: "ON",
            },
            phoneNumber: "5555555555",
        },
        taxLines: [] as any,
        shipping: {
            service: "Standard",
            cost: 0,
        },
    });

    assert.equal(input.email, "tester@example.com");
    assert.equal(input.address1, "123 Main St");
    assert.equal(input.city, "Toronto");
    assert.equal(input.country, "CA");
    assert.equal(input.zip, "M5V2T6");
    assert.equal(input.totalAmountCents, 12345);
    assert.equal(input.currencyCode, "CAD");
});
