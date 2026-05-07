# UI and UX Standards

## Design Direction

Care Access Map should feel like a practical care operations tool, not a marketing page or generic map clone. It should be calm, readable, and quick for tired caregivers and older users.

## Global UI Rules

- Mobile-first.
- Large default text.
- High contrast.
- Clear icon plus label for critical actions.
- No map-only workflows.
- Keep controls stable. Filters, buttons, and cards should not jump when content changes.
- Avoid dense tiny map labels. Put important details in list/detail panels.
- Use plain language: "Pickup point", "Accessible toilet", "Help desk", "Blocked ramp".

## Elderly Mode

Elderly mode should:

- Show 3-5 primary actions at a time.
- Use larger touch targets, at least 44px high.
- Prefer immediate need buttons over complex filters:
  - Toilet
  - Pickup point
  - Help desk
  - Safe route
  - Call/share
- Use short labels.
- Avoid hidden gestures.
- Keep confirmation screens simple.

Elderly mode should not:

- Hide verification status.
- Remove all fallback controls for voice.
- Encourage walking while staring at the phone.

## Caregiver Mode

Caregiver mode should:

- Show filters, verification, practical route notes, sharing, Grab handoff, and safety ping setup.
- Support planning before a trip.
- Make uncertainty visible.
- Let caregivers copy/share instructions for siblings, drivers, and volunteers.

## Voice UX

Voice search must always be optional.

Required pattern:

1. User taps microphone.
2. App listens with visible state.
3. Transcript appears in the search box.
4. User can edit transcript.
5. Search results update.

Fallback:

- If speech recognition fails, show typed search and immediate need buttons.
- Do not block any core task behind voice-only interaction.

## Map UX

The map is a spatial overview, not the only interface.

Map must show:

- Large category markers.
- Selected resource state.
- Hazard/maintenance warning markers.
- Route overlay for demo journey.
- Confidence labels in detail/list panels.

List/detail must show:

- Name.
- Category.
- Address.
- Access notes.
- Verification status.
- Last verified date.
- Hazards affecting the resource or route.

## Accessibility Checklist

- Buttons have accessible names.
- Form fields have labels.
- Color is not the only status indicator.
- Text remains readable at mobile width.
- Critical actions are reachable by keyboard.
- Focus state is visible.
- Images/photos have useful alt text or are marked decorative.

## Visual Tone

Use:

- Neutral backgrounds.
- Strong contrast.
- Category colors sparingly.
- Simple icons.
- Cards for individual resources only.

Avoid:

- Decorative gradient blobs.
- Tiny gray text.
- Overly rounded toy-like UI.
- Huge hero sections.
- Marketing copy on the first screen.
