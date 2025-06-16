// TODO: DELETE FILE!

// import { getCart } from "@/api/cart";
// import { Cart } from "@/types/shopify";
// import { CartDetailsType } from "@/types/types";
// import { useEffect, useState } from "react";

// export const updateCart = async (cartRes?: Cart | null) => {
//     if (!cartRes) {
//         console.log("getting new carts");
//         cartRes = await getCart(
//             "gid://shopify/Cart/Z2NwLXVzLWNlbnRyYWwxOjAxSlhEWDIyTlQ2WkVNQkZQTTREUEQ3NjZY?key=2649bf3eca523015f392cd2b5747bb55"
//         );
//     }
//     if (cartRes) {
//         const cartLines: CartDetailsType[] = cartRes.lines.nodes.map(
//             (cartLine) => {
//                 return {
//                     name: cartLine.merchandise.title,
//                     cost: Number(cartLine.cost.amountPerQuantity.amount),
//                     image: cartLine.merchandise.image.url,
//                     quantity: Number(cartLine.quantity),
//                 };
//             }
//         );
//         return cartLines;
//     }
//     return [] as CartDetailsType[];
// };
