# ShowUp UX Contract

Canonical interaction behavior for accounts, events, registrations, and organizer event management. Shared visual values and primitives live in `DESIGN.md` and `src/index.css`.

- **Navigation and roles:** Use native links for routes and buttons for actions. Students can browse events, manage registrations/tickets, and edit their profile. Organizers can create and manage events and check in attendees. Hide links that do not apply to the current role; route protection remains authoritative.
- **Forms:** Use native inputs, selects, and date/time controls. Keep labels visible, validate required fields and formats inline, preserve entered values on failure, and announce async success or error through an `aria-live` region. Keep submit labels stable while loading and disable duplicate submissions.
- **Feedback and recovery:** Show loading, empty, error, and success states near the affected content. Explain what failed and offer a retry when the operation can be repeated safely. Do not use browser alert/confirm/prompt dialogs.
- **Destructive actions:** Confirm event deletion and registration cancellation with an app-owned accessible dialog that names the item and consequence. Place focus on the safe action initially and restore focus when the dialog closes.
- **Lists and tables:** Bound organizer registration lists with pagination. Keep filters and sort state coherent when changing pages or deleting records; use semantic tables for read-only tabular data.
- **Accessibility and layout:** Target WCAG 2.2 AA. Provide visible keyboard focus, semantic controls, 44px minimum touch targets for primary navigation/actions, mobile layouts without horizontal page overflow, visible scrollbars, and reduced-motion support.
