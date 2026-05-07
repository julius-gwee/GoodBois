# Integration Boundaries

## OneMap

MVP use:

- Singapore location foundation.
- OneMap-compatible coordinates.
- Search/geocoding/routing where practical.

Boundary:

- Resource data stores latitude/longitude, not provider-specific objects.
- Provider references are optional metadata.
- UI must work if map provider changes.

## Grab

MVP use:

- Deep link if available.
- Copyable pickup/drop-off instructions if deep link fails.

Not MVP:

- Ride booking.
- Payment.
- Voucher redemption.
- Accessible vehicle allocation.
- API-level partnership.

## Hazard Agencies / Venue Operators

MVP use:

- Export CSV/JSON report package.

Not MVP:

- Official dispatch.
- Work-order status sync.
- Government authentication.
- Guaranteed response.

## Voice

MVP use:

- Browser speech recognition where available.
- Transcript into normal search.
- Short spoken guidance prompts where available.

Boundary:

- All voice flows have text/touch fallback.
- Do not require always-on listening.

## Route Safety Ping

MVP use:

- Opt-in active route session.
- Simulated or browser location.
- In-app/demo notification.

Not MVP:

- Medical monitoring.
- Emergency response.
- Background tracking after session ends.
- Permanent route trace storage.

## Street View / AR

MVP use:

- None.

Future:

- Caregiver route preview.
- Street-level entrance inspection.
- AR only after safety testing.
