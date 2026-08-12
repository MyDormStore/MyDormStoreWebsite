// ============================================================================
//  PATCHED shopify controller  —  fixes 500 crash on /Shopify/finalize
// ----------------------------------------------------------------------------
//  WHAT CHANGED vs. GitHub main (Aug 12 2026):
//
//    finalAmount()  — used to blindly read result.data.totalPriceSet.shopMoney
//    which crashed with "Cannot read properties of null (reading
//    'totalPriceSet')" whenever Shopify's draftOrderCalculate returned
//    calculatedDraftOrder: null. That happens when the address is unshippable,
//    a line-item variant no longer exists, or Shopify has transient hiccups.
//    Aug 12 logs showed 13 such crashes clustered as 2 stuck customers who
//    couldn't reach the payment page.
//
//    Now: null-safe access + 400 response with a HUMAN-READABLE error message
//    so the frontend can display something useful to the customer instead of
//    the checkout page freezing.
//
//    calculateOrder() — same defense: if calculatedDraftOrder is null, return
//    400 instead of sending null to the frontend (which would cascade into
//    the same class of crash downstream).
//
//    orderCreation() — unchanged behaviour; kept in this file for completeness.
//
//  HOW TO DEPLOY
//  ─────────────
//    Copy this file's contents into backend/api/controller/shopify.ts on
//    GitHub main. Commit. Vercel auto-deploys.
// ============================================================================

import { Request, Response } from "express";
import {
    calculateDraftOrder,
    calculateFinalAmount,
    createOrder,
} from "../utils/shopify";

export const orderCreation = async (req: Request, res: Response) => {
    const payload = req.body;

    const result = await createOrder(payload);
    if (!result.ok) {
        res.status(500)
            .json({ error: result.error, details: result.details })
            .end();
        return;
    }

    res.status(200).json(result);
};

export const calculateOrder = async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await calculateDraftOrder(payload);

    if (result.error) {
        res.status(500).json({
            error: "Failed to calculate draft order",
            details: result.error,
        });
        return;
    }

    // NEW GUARD (Aug 12 2026): Shopify can return calculatedDraftOrder=null
    // for unshippable addresses / missing variants / transient API issues.
    // Before, we returned null to the frontend which then crashed on
    // downstream reads. Now: return a 400 with a useful message.
    const calc = result.data?.draftOrderCalculate?.calculatedDraftOrder;
    if (!calc) {
        console.error(
            "[calculateOrder] Shopify returned no calculatedDraftOrder — likely unshippable address or invalid line items",
            { input: payload?.deliveryDetails?.shippingAddress },
        );
        res.status(400).json({
            error: "We couldn't calculate shipping and tax for this order. Please double-check your shipping address (postal code, province, and country) — some remote areas or non-Canadian addresses aren't supported. If the problem continues, email contactus@mydormstore.ca.",
            code: "shopify_calc_returned_null",
        });
        return;
    }

    res.status(200).json(calc);
};

export const finalAmount = async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await calculateFinalAmount(payload);

    if (result.error) {
        res.status(500)
            .json({
                error: "Failed to calculate final amount",
                details: result.error,
            })
            .end();
        return;
    }

    // ── FIX (Aug 12 2026) ──
    // Was: res.json(result.data.totalPriceSet.shopMoney.amount)
    // When result.data was null (Shopify returned calculatedDraftOrder=null),
    // reading .totalPriceSet crashed with a raw 500. The customer's checkout
    // page then froze — they never got a PaymentIntent and couldn't pay.
    // 13 such crashes appeared in the Aug 12 log, clustered as 2 stuck retry
    // loops, ~2 unique customers stranded.
    //
    // Now: null-check and return a helpful 400 so the frontend can show the
    // customer WHY it failed (usually a bad shipping address).
    if (!result.data || !result.data.totalPriceSet?.shopMoney?.amount) {
        console.error(
            "[finalAmount] Shopify returned no calculatedDraftOrder — likely unshippable address, invalid line items, or transient Shopify API issue",
            {
                addr: payload?.deliveryDetails?.shippingAddress,
                lineItemCount: payload?.lineItems?.length,
            },
        );
        res.status(400).json({
            error: "We couldn't calculate the final amount for this order. This usually means your shipping address can't be reached, or one of the items in your cart is no longer available. Please double-check your address and cart — or email contactus@mydormstore.ca and we'll sort it out.",
            code: "shopify_calc_returned_null",
        });
        return;
    }

    res.status(200).json(result.data.totalPriceSet.shopMoney.amount);
};
