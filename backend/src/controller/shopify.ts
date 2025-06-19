import { Request, Response } from "express";
import { client } from "../services/shopify";

export const getAvailableRates = async (req: Request, res: Response) => {
    const query = `query CarrierServiceList {
    carrierServices(first: 10, query: "active:true") {
      edges {
        node {
          id
          name
          callbackUrl
          active
          supportsServiceDiscovery
        }
      }
    }
  }`;

    const { data, errors } = await client.request(query);

    if (errors) {
        console.error(errors);
        res.status(500).send(errors).end();
    }

    res.send(data);
};
/*
const queryString = `{
  products (first: 3) {
    edges {
      node {
        id
        title
      }
    }
  }
}`;
export const getProducts = async (req: Request, res: Response) => {
    const { data, errors, extensions } = await client.request(queryString);

    res.send(data);
};

const productsDormQuery = `
query GetProductsByMetafield($query: String!) {
  products(first: 10, query: $query) {
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
              price
            }
          }
        }
        metafields(first: 10) {
          edges {
            node {
              key
              value
              namespace
            }
          }
        }
      }
    }
  }
}

`;
export const getProductsByDorm = async (req: Request, res: Response) => {
    const dorm = req.params.dorm; // gets the dorm

    const { data, errors, extensions } = await client.request(
        productsDormQuery,
        {
            variables: {
                query: `metafield:residence.dorm="${dorm}"`,
            },
        }
    );

    if (errors) {
        console.error(errors);
        res.status(500).send(errors);
    }

    res.send(data);
};

*/

const orderMutation = `
mutation {
  orderCreate(order: {
    currency: CAD,
    financialStatus: PAID
    lineItems: [
      {
        variantId: "gid://shopify/ProductVariant/45179591557282",
        quantity: 1
      }
    ]
  }) {
    order {
      id
    }
    userErrors {
      field
      message
    }
  }
}

`;

export const createOrder = async (req: Request, res: Response) => {
    const { data, errors } = await client.request(orderMutation);

    console.error(errors);
    res.send(data);
};
