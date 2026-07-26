"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { track } from "@/lib/analytics-client";

const PRESETS = [49, 99, 199, 499];
const MIN_AMOUNT = 10;

/**
 * ⚠️ PAYMENT INTEGRATION — READ BEFORE SHIPPING:
 * UI + click intent only. Real money movement needs:
 *   1. A Razorpay account + Key ID / Key Secret (dashboard.razorpay.com)
 *   2. Backend POST /api/v1/donate — creates a Razorpay Order server-side
 *      with your SECRET key (never expose it client-side), returns
 *      { orderId, amount }.
 *   3. Razorpay Checkout script, opened with that orderId.
 *   4. A webhook route verifying payment signature server-side.
 * `startPayment` below is stubbed at exactly the handoff point.
 */
export function SupportButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState<number>(99);
  const [customValue, setCustomValue] = useState("");

  useEffect(() => setMounted(true), []);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function pickPreset(a: number) {
    setAmount(a);
    setCustomValue("");
  }

  function onCustomChange(v: string) {
    setCustomValue(v);
    const n = Number(v);
    if (v && !Number.isNaN(n)) setAmount(n);
  }

  const isCustomActive = customValue !== "";
  const valid = amount >= MIN_AMOUNT && Number.isFinite(amount);

  async function startPayment() {
    if (!valid) return;
    track("donate_clicked", { amount });

    // ── REPLACE with real Razorpay/JusPay integration ──
    // const res = await fetch("/api/v1/donate", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ amount }),
    // });
    // const { orderId } = await res.json();
    // const rzp = new window.Razorpay({
    //   key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    //   order_id: orderId,
    //   amount: amount * 100,
    //   currency: "INR",
    //   name: "CineRoulette",
    //   description: "Support the project",
    //   handler: () => setOpen(false),
    // });
    // rzp.open();
    // ─────────────────────────────────────────────────
    alert(`Payment integration pending — would charge ₹${amount}. Wire Razorpay in SupportButton.tsx.`);
  }

  const modal = open && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Support CineRoulette"
        className="surface glass-card relative w-full max-w-sm p-6 text-center"
      >
        <div className="mb-1 text-3xl" aria-hidden="true">✦</div>
        <h2 className="font-display text-3xl tracking-wide text-gold">Enjoying the show?</h2>
        <p className="mt-2 font-body text-sm text-ash">
          CineRoulette is free and ad-free. If it saved you from scrolling, chip in what a ticket&apos;s worth — any amount from ₹{MIN_AMOUNT}.
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => pickPreset(a)}
              aria-pressed={!isCustomActive && amount === a}
              className={`min-h-[44px] rounded-pill border font-data text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                !isCustomActive && amount === a
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-brass/50 text-smoke hover:border-gold/50"
              }`}
            >
              ₹{a}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="font-data text-sm text-ash">₹</span>
          <input
            type="number"
            min={MIN_AMOUNT}
            step={1}
            inputMode="numeric"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={`Custom amount (min ₹${MIN_AMOUNT})`}
            aria-label="Custom donation amount in rupees"
            className={`min-h-[44px] flex-1 rounded-pill border bg-velvet/60 px-4 py-2 font-data text-sm text-smoke outline-none transition focus-visible:ring-2 focus-visible:ring-gold ${
              isCustomActive ? "border-gold" : "border-brass/50 hover:border-gold/40"
            }`}
          />
        </div>

        {isCustomActive && !valid && (
          <p className="mt-2 font-body text-xs text-marquee">Minimum donation is ₹{MIN_AMOUNT}.</p>
        )}

        <button
          type="button"
          onClick={startPayment}
          disabled={!valid}
          className="mt-5 w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-marquee to-[#ff7aa8] py-3 font-display text-xl tracking-wide text-velvet transition hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
        >
          Pay ₹{valid ? amount : "—"}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 font-data text-[11px] uppercase tracking-[0.2em] text-ash transition hover:text-gold"
        >
          Maybe later
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[44px] shrink-0 rounded-pill border border-brass/50 px-3 py-2 font-body text-sm text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <span aria-hidden="true">✦</span>
        <span className="ml-1.5 hidden sm:inline">Support</span>
      </button>

      {/* Portal to document.body: sidesteps any ancestor with backdrop-filter
          or transform, which otherwise silently breaks position:fixed and
          was why this modal rendered squished at the top of the header
          instead of centered in the viewport. */}
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}




// Integrate Razorpay Standard Web Checkout into this codebase.

// === CREDENTIALS ===

// RAZORPAY_KEY_ID: rzp_test_TIFcHtHrjdk3kE
// RAZORPAY_KEY_SECRET: WfPk2vXd8OTl1zIK9VZzg7jP

// === TASK ===

// Detect the project stack and implement Razorpay Standard Checkout with:
// 1. Backend endpoint to create orders
// 2. Frontend checkout button with payment modal
// 3. Backend endpoint to verify payment signature

// === IMPLEMENTATION DETAILS ===

// STEP 1: BACKEND - Create Order
// - Endpoint: POST /api/create-order (or framework equivalent)
// - Call Razorpay API: POST https://api.razorpay.com/v1/orders
// - Request: { amount (paise), currency, receipt }
// - Return: { order_id, amount, currency }
// - Minimum amount: 100 paise

// STEP 2: FRONTEND - Checkout
// - Script: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
// - On button click: call create-order, then open Razorpay modal with order_id
// - On success: receive razorpay_payment_id, razorpay_order_id, razorpay_signature
// - Send all three to verify endpoint

// STEP 3: BACKEND - Verify Signature
// - Endpoint: POST /api/verify-payment (or framework equivalent)
// - Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
// - Compare generated signature with razorpay_signature
// - Return success only if signatures match

// === ENVIRONMENT SETUP ===

// Create .env file:
// RAZORPAY_KEY_ID=rzp_test_TIFcHtHrjdk3kE
// RAZORPAY_KEY_SECRET=WfPk2vXd8OTl1zIK9VZzg7jP

// Frontend framework prefixes (KEY_ID only, never KEY_SECRET):
// - Next.js: NEXT_PUBLIC_RAZORPAY_KEY_ID
// - Vite: VITE_RAZORPAY_KEY_ID
// - CRA: REACT_APP_RAZORPAY_KEY_ID

// Add .env to .gitignore.

// === SDK INSTALLATION ===

// Node.js: npm install razorpay
// Python: pip install razorpay
// PHP: composer require razorpay/razorpay
// Ruby: gem install razorpay
// Go: go get github.com/razorpay/razorpay-go

// === OPERATION ORDER ===

// Execute in this sequence:
// 1. Install dependencies first
// 2. Create .env file
// 3. Create or modify code files
// 4. Verify setup

// === ERROR HANDLING ===

// Backend - Create Order:
// - Validate amount >= 100 paise
// - Handle Razorpay API errors (return 500)
// - Handle auth failures (return 401)

// Backend - Verify Signature:
// - Signature mismatch: return 400, do NOT mark as paid
// - Missing fields: return 400

// Frontend:
// - Handle modal dismiss (user cancelled)
// - Handle payment.failed event
// - Show error messages to user

// === EDGE CASES ===

// If no backend framework detected:
// - Stop and explain that Razorpay requires a backend for order creation
// - Suggest serverless functions (Vercel/Netlify) or Razorpay Payment Links

// If Razorpay already integrated:
// - Do not duplicate code
// - Only fix or complete missing parts

// If static site only:
// - Suggest adding serverless API routes
// - Or suggest Razorpay Payment Links as alternative

// === REQUIREMENTS ===

// - Never hardcode credentials in source files
// - KEY_SECRET must never reach frontend code
// - Use environment variables everywhere
// - Follow existing code style in the project
// - Do not create database tables unless project already has a database

// === REFERENCE ===

// Documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/

// === OUTPUT ===

// After completing integration:
// 1. List files created or modified
// 2. Explain how to test (e.g., start server, click pay button)
// 3. Note any manual steps required

// Begin integration now.