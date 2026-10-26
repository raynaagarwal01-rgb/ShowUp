# ShowUp UX Contract

Canonical interaction behavior for accounts, events, registrations, and organizer event management. Shared visual values and primitives live in `DESIGN.md` and `src/index.css`.

- **Navigation and roles:** Use native links for routes and buttons for actions. Students can browse events, manage registrations/tickets, and view their profile. Organizers can create and manage events and check in attendees. Hide links that do not apply to the current role; server role and ownership checks remain authoritative.
- **Forms:** Use native inputs, selects, and date/time controls. Native date controls and select/listbox widgets own their calendar and option interaction; do not replace them with custom pickers. Keep labels visible, validate required fields and formats inline, preserve entered values on failure, and announce async success or error through an `aria-live` region. Preserve native `reportValidity()` when forms use it. Keep submit labels stable while loading and disable duplicate submissions.
- **Feedback and recovery:** Show loading, empty, error, and success states near the affected content. Explain what failed and offer a retry when the operation can be repeated safely. Do not use browser alert/confirm/prompt dialogs.
- **Destructive actions:** Confirm event deletion and registration cancellation with the shared `ConfirmDialog`, naming the item and consequence. The native dialog manages focus, starts with its safe Cancel action focused, and returns focus to its trigger when closed. Keep async errors and busy state in the dialog.
- **Lists and tables:** Bound organizer registration lists with client-side pagination (the current data sets are fetched in full). Keep filters and sort state coherent when changing pages or deleting records; use semantic tables for read-only tabular data.
- **Dates and time:** Store event date/time values in UTC and render them in the visitor's local timezone with native date/time controls on forms.
- **Accessibility and layout:** Target WCAG 2.2 AA. Provide visible keyboard focus, semantic controls, 44px minimum touch targets for primary navigation/actions, mobile layouts without horizontal page overflow, visible scrollbars, and reduced-motion support. Use `#737373` for normal muted text on white; the `#888888` design mute token is reserved for decorative use.

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native HTML select | This contract and src/index.css | Platform option popup | Keyboard and mobile browser |
| Date | Native datetime-local input | UTC API and this contract | Browser local date/time picker | Form and timezone browser checks |
| Form | Labeled HTML controls and reportValidity | API validation and this contract | Create, edit, sign in, sign up | Invalid input and retry browser checks |
| Scrollbar | src/index.css | DESIGN.md | Document and table overflow | Computed styles and narrow viewport |
| CRUD | src/lib/api.ts and shared ConfirmDialog | Server routes and this contract | Organizer events and student registrations | MySQL integration and browser flows |
