import Razorpay from "razorpay";

/**
 * Server-only Razorpay client. KEY_SECRET must never reach the browser —
 * this file is only ever imported from API route handlers, never from a
 * "use client" component.
 */
let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set");
    }
    client = new Razorpay({ key_id, key_secret });
  }
  return client;
}