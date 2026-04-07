// lib/webhooks.ts
// HMAC-SHA256 signature verification for incoming OpenSolar webhooks.
// OpenSolar sends the secret in the x-opensolar-signature header.
// We verify it matches to prevent fake webhook injection.

import { createHmac, timingSafeEqual } from "crypto"

/**
 * Verify the signature on an incoming OpenSolar webhook.
 * Returns true if valid, false if invalid or secret not configured.
 */
export function verifyWebhookSignature(
  rawBody: string,
  receivedSignature: string
): boolean {
  const secret = process.env.OPENSOLAR_WEBHOOK_SECRET

  // If no secret configured, reject all webhooks
  if (!secret) {
    console.warn(
      "[webhooks] OPENSOLAR_WEBHOOK_SECRET not set — rejecting all webhooks"
    )
    return false
  }

  if (!receivedSignature) return false

  try {
    const expected = createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex")

    const expectedBuf = Buffer.from(expected, "hex")
    const receivedBuf = Buffer.from(receivedSignature, "hex")

    // Length check before timingSafeEqual (it throws on mismatched lengths)
    if (expectedBuf.length !== receivedBuf.length) return false

    return timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    return false
  }
}
