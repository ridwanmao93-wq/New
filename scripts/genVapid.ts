import webpush from "web-push";

/**
 * Generate a VAPID key pair for Web Push. Run once:  npm run vapid
 * Then copy the printed values into your environment (Vercel + .env.local).
 */
const keys = webpush.generateVAPIDKeys();

console.log("\nAdd these to your environment variables:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:you@example.com\n`);
