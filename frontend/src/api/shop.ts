import { client } from "./client";

const shopQuery = `
  query shop {
    shop {
      name
      description
      id
          primaryDomain{
      host
      url
    }
    }
  }
`;

export const getShop = async () => {
    const { data, errors, extensions } = await client.request(shopQuery);
    console.log(data);
    return data;
};
