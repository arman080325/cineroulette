"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import { track } from "@/lib/analytics-client";

const PRESETS = [49, 99, 199, 499];
const MIN_AMOUNT = 10;

type PayStatus = "idle" | "creating" | "success" | "error";

export function SupportButton() {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [amount, setAmount] = useState<number>(99);
    const [customValue, setCustomValue] = useState("");
    const [status, setStatus] = useState<PayStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Read inside the Razorpay ondismiss callback, which closes over a stale
    // "creating" value from when startPayment() was called — a ref always
    // reflects the current status regardless of which render captured it.
    const statusRef = useRef<PayStatus>("idle");
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
    useEffect(() => setMounted(true), []);

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

    function resetAndClose() {
        setOpen(false);
        setStatus("idle");
        setErrorMessage("");
    }

    const isCustomActive = customValue !== "";
    const valid = amount >= MIN_AMOUNT && Number.isFinite(amount);

    async function startPayment() {
        if (!valid || status === "creating") return;
        setStatus("creating");
        setErrorMessage("");
        track("donate_clicked", { amount });

        try {
            const orderRes = await fetch("/api/v1/donate/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                throw new Error(orderData?.error?.message ?? "Could not start payment.");
            }

            if (typeof window.Razorpay !== "function") {
                throw new Error("Payment form didn't load. Check your connection and try again.");
            }

            const rzp = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "CineRoulette",
                description: "Support the project",
                order_id: orderData.orderId,
                theme: { color: "#ff4d8d" },
                handler: async (response) => {
                    try {
                        const verifyRes = await fetch("/api/v1/donate/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(response),
                        });
                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok || !verifyData.ok) {
                            throw new Error("We couldn't confirm that payment. If money left your account, it will be refunded automatically.");
                        }

                        track("donate_completed", { amount, paymentId: verifyData.paymentId });
                        setStatus("success");
                    } catch (err) {
                        setErrorMessage(err instanceof Error ? err.message : "Verification failed.");
                        setStatus("error");
                    }
                },
                modal: {
                    ondismiss: () => {
                        // User closed the Razorpay modal without paying — not an error.
                        if (statusRef.current === "creating") setStatus("idle");
                    },
                },
            });

            rzp.on("payment.failed", (resp) => {
                setErrorMessage(resp.error.description || "Payment failed.");
                setStatus("error");
            });

            rzp.open();
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
            setStatus("error");
        }
    }

    const modal = open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                onClick={resetAndClose}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Support CineRoulette"
                className="surface glass-card relative w-full max-w-sm p-6 text-center"
            >
                {status === "success" ? (
                    <>
                        <div className="mb-2 text-4xl" aria-hidden="true">🎬</div>
                        <h2 className="font-display text-3xl tracking-wide text-gold">Thank you</h2>
                        <p className="mt-2 font-body text-sm text-ash">
                            Your ₹{amount} keeps the reels turning. Genuinely appreciated.
                        </p>
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="mt-5 w-full min-h-[48px] rounded-2xl border border-brass/50 font-body text-sm text-smoke transition hover:border-gold/60 hover:text-gold"
                        >
                            Close
                        </button>
                    </>
                ) : (
                    <>
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
                                    className={`min-h-[44px] rounded-pill border font-data text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${!isCustomActive && amount === a
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
                                className={`min-h-[44px] flex-1 rounded-pill border bg-velvet/60 px-4 py-2 font-data text-sm text-smoke outline-none transition focus-visible:ring-2 focus-visible:ring-gold ${isCustomActive ? "border-gold" : "border-brass/50 hover:border-gold/40"
                                    }`}
                            />
                        </div>

                        {isCustomActive && !valid && (
                            <p className="mt-2 font-body text-xs text-marquee">Minimum donation is ₹{MIN_AMOUNT}.</p>
                        )}

                        {status === "error" && (
                            <p role="alert" className="mt-3 font-body text-xs text-marquee">{errorMessage}</p>
                        )}

                        <button
                            type="button"
                            onClick={startPayment}
                            disabled={!valid || status === "creating"}
                            className="mt-5 w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-marquee to-[#ff7aa8] py-3 font-display text-xl tracking-wide text-velvet transition hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
                        >
                            {status === "creating" ? "Opening…" : `Pay ₹${valid ? amount : "—"}`}
                        </button>

                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="mt-3 font-data text-[11px] uppercase tracking-[0.2em] text-ash transition hover:text-gold"
                        >
                            Maybe later
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <button
                type="button"
                onClick={() => setOpen(true)}
                className="min-h-[44px] shrink-0 rounded-pill border border-brass/50 px-3 py-2 font-body text-sm text-smoke transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
                <span aria-hidden="true">✦</span>
                <span className="ml-1.5 hidden sm:inline">Support</span>
            </button>

            {mounted && modal && createPortal(modal, document.body)}
        </>
    );
}