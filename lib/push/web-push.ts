import webpush from "web-push";

let configured = false;

/** Lazily configure web-push with VAPID details from the environment. */
export function getWebPush() {
  if (!configured) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
    if (!publicKey || !privateKey) {
      throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set. Run `npm run vapid`.");
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return webpush;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}
