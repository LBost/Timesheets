# Settings feature notes

## Current scope

- Settings are stored in local storage under `timesheets.settings`.
- Implemented field: `nextInvoiceNumber` (example: `RLZ-20260001`).
- Implemented field: `preferredTimeEntriesView` (`month` or `week`).
- Settings page lets users edit and save this value.

## Planned invoice creation integration

When invoice creation is implemented, use this flow to keep numbering consistent:

1. Read `nextInvoiceNumber` once at the start of invoice creation.
2. Assign that value to the newly created invoice record.
3. Compute the next value by incrementing the numeric suffix while preserving:
   - prefix before the dash (`RLZ` in the example),
   - year segment (`2026`),
   - zero-padding width of the sequence (`0001` -> `0002`).
4. Persist the incremented value back to settings in the same transaction boundary as invoice creation.
5. If invoice creation fails, do not increment settings.

## Suggested helper contract

Create a small pure utility for predictable numbering:

- `parseInvoiceNumber(input: string): { prefix: string; year: string; sequence: number; width: number }`
- `incrementInvoiceNumber(input: string): string`

Input format currently validated as:

- `^[A-Z]{2,10}-\\d{8}$`
- Interpreted as: `<PREFIX>-<YYYY><NNNN>`
