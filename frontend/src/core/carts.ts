import type { CartDetailsType } from "@/types/types";
import { create } from "zustand";

interface CartState {
    cart: CartDetailsType[];
    addCart: (cart: CartDetailsType[]) => void;
    removeProduct: (product: CartDetailsType) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    cart: [],
    addCart: (cart) => {
        set({ cart: cart });
    },
    removeProduct: (product) => {
        const index = get().cart.indexOf(product);
        if (index > -1) {
            // only splice array when item is found
            set((state) => ({
                cart: state.cart.splice(index, 1),
            }));
        }
    },
}));
