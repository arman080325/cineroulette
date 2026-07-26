export {};

declare global {
  interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    handler: (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => void;
    theme?: { color?: string };
    modal?: { ondismiss?: () => void };
  }

  interface RazorpayInstance {
    open: () => void;
    on: (
      event: "payment.failed",
      handler: (response: { error: { description: string } }) => void
    ) => void;
  }

  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}