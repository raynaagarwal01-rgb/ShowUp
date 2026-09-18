import type { EventRecord } from "../types";
import { newId } from "./id";

const SYSTEM_ORGANIZER = "system-demo-organizer";

function iso(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function seedEvents(): EventRecord[] {
  const events: Array<Omit<EventRecord, "id">> = [
    {
      club_id: "club-codecell",
      club_name: "Code Cell",
      title: "CodeSprint 24",
      tagline: "A 24-hour build-anything hackathon",
      description:
        "Form a team of up to 4 and build a working prototype in 24 hours straight. Mentors drop by every few hours, and there's a demo showcase with judges from local startups at the end. Bring a laptop, a charger, and an idea worth staying up for.",
      rules: [
        "Teams of 2-4. Solo entries are allowed but compete in the same pool.",
        "All code must be written during the 24-hour window.",
        "Pre-built design assets and open-source libraries are allowed.",
        "Final submission is a GitHub repo link plus a 3-minute demo video.",
      ],
      category: "Hackathon",
      scope: "both",
      state: "Tamil Nadu",
      city: "Chennai",
      venue: "Innovation Lab, Block C",
      start_at: iso(6, 9),
      end_at: iso(7, 9),
      registration_deadline: iso(5, 23, 59),
      capacity: 40,
      fee: 0,
      team_min: 1,
      team_max: 4,
      banner_hue: 18,
      status: "published",
      created_by: SYSTEM_ORGANIZER,
    },
    {
      club_id: "club-design",
      club_name: "Design Guild",
      title: "Figma to Front-End",
      tagline: "Hands-on workshop: design systems that survive contact with code",
      description:
        "A practical, laptop-required workshop on building a component library in Figma and shipping it as a real design system in a React codebase. Ends with everyone walking away with a working starter kit.",
      rules: [
        "Bring a laptop with Figma (free tier is fine) and Node.js installed.",
        "Basic HTML/CSS familiarity assumed; no React experience required.",
      ],
      category: "Workshop",
      scope: "internal",
      state: "Karnataka",
      city: "Bengaluru",
      venue: "Seminar Hall 2",
      start_at: iso(3, 14),
      end_at: iso(3, 17),
      registration_deadline: iso(2, 23, 59),
      capacity: 60,
      fee: 0,
      team_min: 1,
      team_max: 1,
      banner_hue: 265,
      status: "published",
      created_by: SYSTEM_ORGANIZER,
    },
    {
      club_id: "club-esports",
      club_name: "Esports Club",
      title: "Valorant 5v5 Showdown",
      tagline: "Campus bracket, single elimination, bragging rights included",
      description:
        "Register your 5-person squad for a single-elimination LAN bracket. Top 3 teams split the prize pool. Spectator seating and live commentary on the big screen in the atrium.",
      rules: [
        "Squads must have exactly 5 starters and up to 2 substitutes.",
        "Standard competitive ruleset, map veto before each match.",
        "Check-in closes 30 minutes before your scheduled match slot.",
      ],
      category: "Competition",
      scope: "internal",
      state: "Maharashtra",
      city: "Pune",
      venue: "Student Activity Center",
      start_at: iso(10, 10),
      end_at: iso(10, 20),
      registration_deadline: iso(8, 23, 59),
      capacity: 16,
      fee: 100,
      team_min: 5,
      team_max: 7,
      banner_hue: 340,
      status: "published",
      created_by: SYSTEM_ORGANIZER,
    },
    {
      club_id: "club-music",
      club_name: "Music Society",
      title: "Battle of the Bands",
      tagline: "Six bands, one stage, one winner",
      description:
        "The Music Society's annual live-performance showdown. Each band gets a 15-minute set judged on composition, stage presence, and crowd response. Open to the public — bring your friends to cheer.",
      rules: [
        "Bands of 3-8 members. Original compositions score higher but covers are allowed.",
        "Sound check slots are assigned in registration order.",
      ],
      category: "Cultural",
      scope: "both",
      state: "Delhi (NCT)",
      city: "New Delhi",
      venue: "Open Air Theatre",
      start_at: iso(14, 18),
      end_at: iso(14, 22),
      registration_deadline: iso(11, 23, 59),
      capacity: 6,
      fee: 0,
      team_min: 3,
      team_max: 8,
      banner_hue: 30,
      status: "published",
      created_by: SYSTEM_ORGANIZER,
    },
    {
      club_id: "club-entrepreneur",
      club_name: "E-Cell",
      title: "Founders' Fireside",
      tagline: "An evening with two alumni founders who raised their first round",
      description:
        "An informal, seated fireside chat with two alumni who went on to found and fund early-stage startups. Q&A open floor for the last 20 minutes. Seating is limited — register to reserve a spot.",
      rules: [
        "Valid college ID required at entry.",
        "Seats are first-come within your confirmed registration.",
      ],
      category: "Talk",
      scope: "internal",
      state: "Maharashtra",
      city: "Mumbai",
      venue: "Auditorium",
      start_at: iso(9, 17),
      end_at: iso(9, 19),
      registration_deadline: iso(9, 12),
      capacity: 120,
      fee: 0,
      team_min: 1,
      team_max: 1,
      banner_hue: 200,
      status: "published",
      created_by: SYSTEM_ORGANIZER,
    },
    {
      club_id: "club-robotics",
      club_name: "Robotics Club",
      title: "Line Follower Championship",
      tagline: "Build it, race it, watch it fall off the track",
      description:
        "Design and build an autonomous line-following bot from scratch or bring your own. Timed runs across an obstacle-laced track, fastest clean run wins. Parts stall on-site for last-minute fixes.",
      rules: [
        "Bots must be fully autonomous — no remote control during the run.",
        "Max chassis size 20cm x 20cm.",
        "Teams of up to 3.",
      ],
      category: "Competition",
      scope: "both",
      state: "Telangana",
      city: "Hyderabad",
      venue: "Robotics Lab",
      start_at: iso(20, 10),
      end_at: iso(20, 18),
      registration_deadline: iso(17, 23, 59),
      capacity: 25,
      fee: 150,
      team_min: 1,
      team_max: 3,
      banner_hue: 155,
      status: "published",
      created_by: SYSTEM_ORGANIZER,
    },
  ];

  return events.map((e) => ({ ...e, id: newId("evt") }));
}

export const SYSTEM_ORGANIZER_ID = SYSTEM_ORGANIZER;
