import { useEffect, useRef, type ReactNode } from "react";

export function RecommendedProducts({ children }: { children: ReactNode }) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = scrollRef.current;

        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener("wheel", onWheel, { passive: false });

        return () => {
            el.removeEventListener("wheel", onWheel);
        };
    }, []);

    return (
        <div
            className="flex gap-2 overflow-x-scroll overflow-y-hidden"
            ref={scrollRef}>
            {children}
        </div>
    );
}
