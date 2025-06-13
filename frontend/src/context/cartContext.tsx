import { Cart } from "@/types/shopify";
import type { CartDetailsType } from "@/types/types";
import { createContext, useContext, type ReactNode } from "react";

interface CartContextProps {
    cart: Cart | null;
    setCart: React.Dispatch<React.SetStateAction<Cart | null>>;
}

export const CartContext = createContext<CartContextProps>(
    {} as CartContextProps
);

// * CartContext hook
export const useCartContext = () => {
    const cart = useContext(CartContext);

    if (cart === undefined) {
        throw new Error("useCartContext must be used to with a pageContext");
    }

    return cart;
};

interface CartContextProviderProps {
    value: CartContextProps;
    children: ReactNode;
}

export const CartContextProvider = ({
    value,
    children,
}: CartContextProviderProps) => {
    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};
