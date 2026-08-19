// ============================================================================
//  PATCHED cart.ts  —  force Canadian context via @inContext directive
// ----------------------------------------------------------------------------
//  WHAT CHANGED vs. GitHub main (Aug 19 2026):
//
//    Every cart query and mutation now includes @inContext(country: CA).
//    Without it, Shopify Storefront API auto-detects the buyer's country
//    from their IP and serves them a localized market:
//      - French buyer  → French translations, no QST/GST tax
//      - German buyer  → German translations, EUR prices
//      - Nigerian buyer → NGN prices, no CAD conversion
//
//    Result: Anjali (browsing from France) saw her cart in French with
//    $0 tax, and her checkout total was ~$100 short of what should have
//    been collected. Even if her PaymentIntent had gone through, MDS
//    would have absorbed the tax loss.
//
//    @inContext(country: CA) forces every request to use the Canadian
//    market — Canadian tax, CAD prices, English (the shop's default
//    language), and Move-In Day Delivery rates all compute correctly
//    regardless of where the buyer is browsing from.
//
//  HOW TO DEPLOY:
//    Copy this file's contents into frontend/src/api/cart.ts on
//    GitHub main. No changes needed to other files. Vercel will
//    auto-rebuild the frontend.
// ============================================================================

import { Cart } from "@/types/shopify";
import { client } from "./client";

const cartResponse = `
    id
    totalQuantity
    discountCodes {
      applicable
      code
    }
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 250) {
      nodes {
        id

        attributes {
          key
          value
        }
        cost {
          amountPerQuantity {
            amount
          }
        }
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            image {
              url
            }
              metafields(identifiers: [{namespace: "dorm", key: "required"}, {namespace: "dorm", key: "recommended"}, {namespace: "dorm", key: "not-allowed"}, {namespace: "dorm", key: "alternative"}]) {
                id
                namespace
                key
                value
                type
            }
            product {
                id
                title
                featuredImage {
                id
                url
              }
                variants(first: 250) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                    }
                    metafields(identifiers: [{namespace: "dorm", key: "required"}, {namespace: "dorm", key: "recommended"}, {namespace: "dorm", key: "not-allowed"}, {namespace: "dorm", key: "alternative"}]) {
                        id
                        namespace
                        key
                        value
                        type
                      }
                  }
                }
              }
            }
          }
        }
      }
    }
`;

// ─── NEW: @inContext(country: CA) forces Canadian market on EVERY query ────
const cartQuery = `
query GetCart($cartId: ID!) @inContext(country: CA) {
  cart(id: $cartId) {
    ${cartResponse}
  }
}
`;

export const getCart = async (cartId: string) => {
    try {
        const { data, errors } = await client.request(cartQuery, {
            variables: {
                cartId: cartId,
            },
        });

        if (errors) {
            throw errors;
        }

        return data.cart as Cart;
    } catch (err) {
        console.error(err);
        return {} as Cart;
    }
};

const changeItemQuery = `
mutation UpdateCartLine($cartId: ID!, $id: ID!, $quantity: Int!) @inContext(country: CA) {
  cartLinesUpdate(
    cartId: $cartId
    lines: {
      id: $id
      quantity: $quantity
    }
  ){
  cart {
    ${cartResponse}
  }
}
}
`;

export const updateProductQuantity = async (
    id: string,
    quantity: number,
    cartId: string
) => {
    try {
        const { data, errors } = await client.request(changeItemQuery, {
            variables: {
                cartId: cartId,
                id: id,
                quantity: quantity,
            },
        });

        if (errors) {
            throw errors;
        }

        return data.cartLinesUpdate.cart as Cart;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const addProductQuery = `
mutation AddCartLine($cartId: ID!, $id: ID!) @inContext(country: CA) {
  cartLinesAdd(
    cartId: $cartId
    lines: {
      merchandiseId: $id
    }
  ){
  cart {
    ${cartResponse}
  }
}
}
`;

export const addProductToCart = async (id: string, cartId: string) => {
    try {
        const { data, errors } = await client.request(addProductQuery, {
            variables: {
                cartId: cartId,
                id: id,
            },
        });

        if (errors) {
            throw errors;
        }

        return data.cartLinesAdd.cart as Cart;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const removeProductQuery = `
mutation removeCartLines($cartId: ID!, $lineIds: [ID!]!) @inContext(country: CA) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
  cart {
    ${cartResponse}
  }
}
}
`;

export const removeProductFromCart = async (id: string[], cartId: string) => {
    try {
        const { data, errors } = await client.request(removeProductQuery, {
            variables: {
                cartId: cartId,
                lineIds: id,
            },
        });

        if (errors) {
            throw errors;
        }

        return data.cartLinesRemove.cart as Cart;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const applyDiscountQuery = `
mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) @inContext(country: CA) {
  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
    cart {
      ${cartResponse}
    }
    userErrors {
      field
      message
    }
  }
}
`;

export const applyDiscountCode = async (
    cartId: string,
    discountCode: string
) => {
    try {
        const { data, errors } = await client.request(applyDiscountQuery, {
            variables: {
                cartId: cartId,
                discountCodes: [discountCode],
            },
        });

        if (errors) {
            throw errors;
        }

        console.log(data);

        return data.cartDiscountCodesUpdate.cart as Cart;
    } catch (err) {
        console.error(err);
        return null;
    }
};
