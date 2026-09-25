import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../auth.js";
import { sendRegistrationNotification } from "../notify.js";
import { forbidden, notFound } from "../util.js";

export const notificationsRouter = Router();

// The client only says *which registration*. The event, recipient email/phone
// and status are read from the database — otherwise this endpoint would be an
// open relay that emails/SMSes anyone with any text.
notificationsRouter.post("/notifications/registration-confirmed", requireAuth, async (req, res) => {
  const [row] = await query(
    `SELECT r.id AS registration_id, r.status, r.user_id,
            e.id AS event_id, e.title, e.start_at, e.venue, e.city,
            p.name, p.email, p.phone
       FROM registrations r
       JOIN events e   ON e.id = r.event_id
       JOIN profiles p ON p.id = r.user_id
      WHERE r.id = ?`,
    [req.body.registrationId],
  );
  if (!row) throw notFound("Registration not found.");
  if (row.user_id !== req.user.id) throw forbidden("You can only send notifications for your own registration.");

  const results = await sendRegistrationNotification({
    event: {
      id: row.event_id,
      title: row.title,
      start_at: new Date(row.start_at).toISOString(),
      venue: row.venue,
      city: row.city,
    },
    profile: { name: row.name, email: row.email, phone: row.phone },
    registration: { id: row.registration_id, status: row.status },
  });
  res.json({ results });
});
