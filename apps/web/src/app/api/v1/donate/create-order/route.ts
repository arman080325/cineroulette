import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

// ₹10 — matches the Support modal's own stated minimum, enforced again
// here so a tampered client request can't bypass it.
const MIN_AMOUNT_PAISE = 1000;

export async function POST(req: NextRequest) {
  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const rupees = body.amount;
  if (!rupees || !Number.isFinite(rupees) || rupees <= 0) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "amount (in rupees) is required." } },
      { status: 400 }
    );
  }

  const amountPaise = Math.round(rupees * 100);
  if (amountPaise < MIN_AMOUNT_PAISE) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Minimum donation is ₹10." } },
      { status: 400 }
    );
  }

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `cr_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Razorpay error";
    const isAuthError = message.toLowerCase().includes("authentication");
    return NextResponse.json(
      { error: { code: isAuthError ? "UNAUTHORIZED" : "RAZORPAY_ERROR", message } },
      { status: isAuthError ? 401 : 500 }
    );
  }
}