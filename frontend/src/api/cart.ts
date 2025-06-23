import { Cart } from "@/types/shopify";
import { client } from "./client";

const cartResponse = `
id
    totalQuantity
    lines(first: 250) {
      nodes {
        id
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
            metafields(identifiers: [{namespace: "dorm", key: "required"}, {namespace: "dorm", key: "recommended"}, {namespace: "dorm", key: "not-allowed"}]) {
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
                    price {
                      amount
                    }
                      metafields(identifiers: [{namespace: "dorm", key: "required"}, {namespace: "dorm", key: "recommended"}, {namespace: "dorm", key: "not-allowed"}]) {
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

const cartQuery = `
query GetCart($cartId: ID!) {
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
mutation UpdateCartLine($cartId: ID!, $id: ID!, $quantity: Int!) {
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
mutation AddCartLine($cartId: ID!, $id: ID!) {
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
mutation removeCartLines($cartId: ID!, $lineIds: [ID!]!) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
  cart {
    ${cartResponse}
  }
}
}
`;

export const removeProductToCart = async (id: string, cartId: string) => {
    try {
        const { data, errors } = await client.request(removeProductQuery, {
            variables: {
                cartId: cartId,
                lineIds: [id],
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
