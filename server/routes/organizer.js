import { Router } from "express";
import { query, tx } from "../db.js";
import { requireOrganizer } from "../auth.js";
import { mapEvent } from "../mappers.js";
import { newId } from "../util.js";

export const organizerRouter = Router();

const DAY = 24 * 60 * 60 * 1000;

const SAMPLE_PEOPLE = [
  { key: "ananya", name: "Ananya Sharma", email: "ananya.sharma@vitstudent.ac.in", college: null, branch: "Computer Science & Engg", phone: "+91 98765 43210" },
  { key: "rohan", name: "Rohan Mehta", email: "rohan.mehta@vitstudent.ac.in", college: null, branch: "Information Technology", phone: "+91 98765 43211" },
  { key: "vikram", name: "Vikram Malhotra", email: "vikram.m@iitm.ac.in", college: "IIT Madras", branch: "Electrical & Computer Engg", phone: "+91 98765 43212" },
  { key: "priya", name: "Priya Patel", email: "priya.patel@bmsce.ac.in", college: "BMS College of Engineering", branch: "Artificial Intelligence", phone: "+91 98765 43213" },
  { key: "sameer", name: "Sameer Khan", email: "sameer.khan@bits-pilani.ac.in", college: "BITS Pilani", branch: "Software Systems", phone: "+91 98765 43214" },
];

// Creates the "HackSphere 2026" showcase event for the signed-in organizer,
// together with a small roster (two teams and a solo entrant, one of them
// already checked in) and an announcement, so the organizer tools have
// something realistic to show. The sample people are placeholder accounts with
// no password — they exist only as rows in this event's roster.
organizerRouter.post("/organizer/sample-event", requireOrganizer, async (req, res) => {
  const user = req.user;
  const now = Date.now();
  const eventId = newId("evt");
  const clubName = user.name ? `${user.name}'s Tech Club` : "ShowUp Innovation Lab";
  const college = user.college || "VIT Vellore";

  await tx(async (conn) => {
    await query(
      `INSERT INTO events (id, club_id, club_name, title, tagline, description, rules, category, scope,
                           state, city, college, venue, start_at, end_at, registration_deadline,
                           capacity, fee, team_min, team_max, banner_hue, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Hackathon', 'both', ?, ?, ?, ?, ?, ?, ?, 100, 0, 2, 4, 220, 'published', ?)`,
      [
        eventId,
        user.id,
        clubName,
        "HackSphere 2026: National Hackathon",
        "36-Hour National AI & Systems Hackathon",
        "A premier 36-hour hackathon bringing together students across India to build innovative solutions in AI, Climate Tech, and FinTech. Features 1-on-1 industry mentorship, cloud credits, and cash prizes.",
        JSON.stringify([
          "Teams of 2 to 4 members. Inter-college teams are welcome.",
          "All code and prototypes must be developed during the hackathon period.",
          "Projects require a public GitHub repository and a 3-minute pitch presentation.",
          "Organizers reserve the right to disqualify entries violating the code of conduct.",
        ]),
        user.state || "Tamil Nadu",
        user.city || "Vellore",
        college,
        "Dr. APJ Abdul Kalam Innovation Auditorium, Tech Tower",
        new Date(now + 7 * DAY),
        new Date(now + 9 * DAY),
        new Date(now + 5 * DAY),
        user.id,
      ],
      conn,
    );

    // Find-or-create the sample people by email.
    const ids = {};
    for (const p of SAMPLE_PEOPLE) {
      const [existing] = await query("SELECT id FROM profiles WHERE email = ?", [p.email], conn);
      if (existing) {
        ids[p.key] = existing.id;
        continue;
      }
      ids[p.key] = newId();
      await query(
        `INSERT INTO profiles (id, email, password_hash, name, role, college, branch, phone)
         VALUES (?, ?, NULL, ?, 'student', ?, ?, ?)`,
        [ids[p.key], p.email, p.name, p.college ?? college, p.branch, p.phone],
        conn,
      );
    }

    const teams = [
      { id: `team_neuralcraft_${eventId}`, name: "NeuralCraft", code: "NC8821", leader: "ananya", members: ["ananya", "rohan"],
        idea: "Autonomous drone pipeline inspection with edge AI and real-time thermal anomaly detection." },
      { id: `team_codeforge_${eventId}`, name: "CodeForge", code: "CF4910", leader: "vikram", members: ["vikram", "priya"],
        idea: "Decentralized carbon credit ledger and green energy certificate trading platform for universities." },
    ];
    for (const t of teams) {
      await query(
        "INSERT INTO teams (id, event_id, name, join_code, project_idea, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [t.id, eventId, t.name, t.code, t.idea, ids[t.leader]],
        conn,
      );
      for (const m of t.members) {
        await query("INSERT INTO team_members (team_id, user_id) VALUES (?, ?)", [t.id, ids[m]], conn);
      }
    }

    // [person, team, minutes-since-check-in | null, hours-since-registered]
    const roster = [
      ["ananya", teams[0].id, 15, 48],
      ["rohan", teams[0].id, 10, 48],
      ["vikram", teams[1].id, null, 24],
      ["priya", teams[1].id, null, 24],
      ["sameer", null, null, 12],
    ];
    for (const [i, [who, teamId, checkedInMinsAgo, registeredHoursAgo]] of roster.entries()) {
      // One second apart so registration order (and so roster order) is stable.
      await query(
        `INSERT INTO registrations (id, event_id, user_id, team_id, status, checked_in_at, created_at)
         VALUES (?, ?, ?, ?, 'confirmed', ?, ?)`,
        [
          newId("reg"),
          eventId,
          ids[who],
          teamId,
          checkedInMinsAgo === null ? null : new Date(now - checkedInMinsAgo * 60 * 1000),
          new Date(now - registeredHoursAgo * 60 * 60 * 1000 + i * 1000),
        ],
        conn,
      );
    }

    await query(
      "INSERT INTO announcements (id, event_id, title, content, author_name, is_urgent) VALUES (?, ?, ?, ?, ?, 1)",
      [
        newId(),
        eventId,
        "Hackathon Briefing & Mentor Allocation Schedule",
        "Welcome teams! Mentor check-ins are now live in Block C Labs. Please have your GitHub repo created and project pitch ready.",
        clubName,
      ],
      conn,
    );
  });

  const [row] = await query("SELECT * FROM events WHERE id = ?", [eventId]);
  res.status(201).json(mapEvent(row));
});
