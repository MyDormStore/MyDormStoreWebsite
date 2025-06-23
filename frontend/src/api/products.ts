// getProducts.js
import { ShopifyProductsData } from "@/types/shopify";
import { client } from "./client";

const productsQuery = `
{
  products(first: 250) {
    edges {
      node {
        id
        title
        tags
        onlineStoreUrl
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

`;

export const getProducts = async () => {
    try {
        const { data, errors } = await client.request(productsQuery);

        if (errors) {
            throw errors;
        }

        return (data as ShopifyProductsData).products.edges;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const productQuery = `
  query ProductQuery($handle: String) {
  product(handle: $handle) {
    id
    title
    featuredImage {
      id
      url
    }
  }
}
`;
export const getProduct = async () => {
    try {
        const { data, errors, extensions } = await client.request(
            productQuery,
            {
                variables: {
                    handle: "tide-pods-9-pk-copy",
                },
            }
        );

        if (errors) {
            throw errors;
        }

        console.log(data);

        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
};

// const productsDormQuery = `
// query GetProductsByTag($tag: String!) {
//   products(first: 10, query: $tag) {
//     edges {
//       node {
//         id
//         title
//         featuredImage {
//           url
//         }
//         tags
//         onlineStoreUrl
//         variants(first: 1) {
//           edges {
//             node {
//               id
//               price {
//                 amount
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }
// `;

// export const getProductsByDorm = async (tag: string) => {
//     try {
//         const { data, errors } = await client.request(productsDormQuery, {
//             variables: {
//                 tag: "tag:campusone",
//             },
//         });

//         if (errors) {
//             throw errors;
//         }

//         return (data as ShopifyProductsData).products.edges;
//     } catch (err) {
//         console.error(err);
//         return null;
//     }
// };

const productsDormQuery = `
query GetProductsByMetafield($metafieldQuery: String!) {
  products(first: 10, query: $metafieldQuery) {
    edges {
      node {
        id
        title
        featuredImage {
          url
        }
        tags
        onlineStoreUrl
        variants(first: 1) {
          edges {
            node {
              id
              price {
                amount
              }
            }
          }
        }
      }
    }
  }
}
`;

export const getProductsByDorm = async (tag: string) => {
    try {
        const { data, errors } = await client.request(productsDormQuery, {
            variables: {
                metafieldQuery: "metafield:residence.dorm:campusOne",
            },
        });

        if (errors) {
            throw errors;
        }

        console.log(data);

        return (data as ShopifyProductsData).products.edges;
    } catch (err) {
        console.error(err);
        return null;
    }
};
