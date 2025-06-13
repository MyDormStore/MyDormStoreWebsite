import type { LayoutProps } from "@/types/types";

// The Checkout component is used to change the grid layout when it is mobile

export default function CheckoutLayout({ children }: LayoutProps) {
    return (
        <div className="grid grid-cols-1 gap-8 px-4 sm:px-6 lg:px-32 lg:grid-cols-[65%_35%] w-full max-w-screen overflow-x-hidden">
            {children}
        </div>
    );
}
