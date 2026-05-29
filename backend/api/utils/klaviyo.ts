/**
 * Klaviyo event tracking helper.
 *
 * Sends events to Klaviyo's API so we can build segments and flows
 * for abandoned checkouts, failed payments, and completed orders.
 *
 * IMPORTANT: This is wrapped in try/catch — any Klaviyo failure is
 * logged but swallowed. Klaviyo problems must never break payment
 * or order creation.
 */

const KLAVIYO_EVENTS_API = "https://a.klaviyo.com/api/events/";
const KLAVIYO_REVISION = "2024-10-15";

interface KlaviyoEventOptions {
    eventName: string;
    email: string;
    properties?: Record<string, any>;
    firstName?: string;
    lastName?: string;
    phone?: string;
    value?: number;
}

/**
 * Fires a custom event to Klaviyo for the given email.
 * Returns void — errors are logged but never thrown.
 */
export async function trackKlaviyoEvent(
    opts: KlaviyoEventOptions
): Promise<void> {
    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;

    // Silent no-op if env var missing or no email — both are fine
    if (!apiKey) {
        console.warn("KLAVIYO_PRIVATE_API_KEY not set — skipping event");
        return;
    }
    if (!opts.email) return;

    try {
        const profileAttributes: Record<string, any> = {
            email: opts.email,
        };
        if (opts.firstName) profileAttributes.first_name = opts.firstName;
        if (opts.lastName) profileAttributes.last_name = opts.lastName;
        if (opts.phone) profileAttributes.phone_number = opts.phone;

        const eventAttributes: Record<string, any> = {
            properties: opts.properties || {},
            metric: {
                data: {
                    type: "metric",
                    attributes: { name: opts.eventName },
                },
            },
            profile: {
                data: {
                    type: "profile",
                    attributes: profileAttributes,
                },
            },
        };

        if (typeof opts.value === "number") {
            eventAttributes.value = opts.value;
        }

        const response = await fetch(KLAVIYO_EVENTS_API, {
            method: "POST",
            headers: {
                Authorization: `Klaviyo-API-Key ${apiKey}`,
                revision: KLAVIYO_REVISION,
                accept: "application/json",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                data: {
                    type: "event",
                    attributes: eventAttributes,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(
                `Klaviyo event "${opts.eventName}" failed:`,
                response.status,
                errorBody
            );
        }
    } catch (err) {
        // Catch network errors etc — never throw
        console.error(`Klaviyo event "${opts.eventName}" exception:`, err);
    }
}
