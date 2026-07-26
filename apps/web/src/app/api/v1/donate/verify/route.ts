import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface VerifyBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

/**
 * HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET), compared against
 * what Razorpay's checkout returned. A mismatch means the payment either
 * didn't happen or the response was tampered with — never mark it as paid
 * in that case. Uses crypto.timingSafeEqual rather than === to avoid a
 * timing side-channel on the comparison itself.
 */
export async function POST(req: NextRequest) {
  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Missing order_id, payment_id, or signature." } },
      { status: 400 }
    );
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { code: "SERVER_MISCONFIGURED", message: "RAZORPAY_KEY_SECRET is not set." } },
      { status: 500 }
    );
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const provided = Buffer.from(razorpay_signature, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  const valid =
    provided.length === expectedBuf.length && crypto.timingSafeEqual(provided, expectedBuf);

  if (!valid) {
    return NextResponse.json(
      { error: { code: "SIGNATURE_MISMATCH", message: "Payment signature did not verify." } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, paymentId: razorpay_payment_id });
}