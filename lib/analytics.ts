/**
 * GA4 Measurement Protocol - server-side event tracking
 *
 * Fires events to Google Analytics 4 from API routes so we can track
 * airdrop outcomes (success, each failure reason) without relying on
 * client-side JS.
 *
 * Required env vars:
 *   GA4_MEASUREMENT_ID  – e.g. "G-XXXXXXXXXX"
 *   GA4_API_SECRET      – created in GA4 Admin › Data Streams › Measurement Protocol API secrets
 */

const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Send a single event to GA4 via the Measurement Protocol.
 *
 * `clientId` should be a stable identifier for the request — we use the
 * cleaned IP so GA4 can group events per visitor without cookies.
 *
 * This function is fire-and-forget: it never throws and never blocks the
 * airdrop response.
 */
export function trackEvent(
  name: string,
  params: EventParams,
  clientId: string,
): void {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) return;

  const url = `${GA4_ENDPOINT}?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  // Strip undefined values so GA4 doesn't receive "undefined" strings
  const cleanParams: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) cleanParams[k] = v;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      events: [{ name, params: cleanParams }],
    }),
  }).catch((err) => {
    console.error(`[ANALYTICS] Failed to send event "${name}":`, err);
  });
}
