import type { CartDetailsType } from "@/types/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PayloadState {
    payload: any | null;
    setPayload: (payload: any | null) => void;
}

export const usePayloadStore = create<PayloadState>()(
    persist(
        (set, get) => ({
            payload: null,
            setPayload(payload) {
                set({ payload: payload });
            },
        }),
        {
            name: "payload-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
