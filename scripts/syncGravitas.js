// Script to fetch official graVITas '26 events from Unstop and sync to the ShowUp MySQL database
import fs from "node:fs";

// The organizer profile that will own the synced events, looked up by email in
// the database. Defaults to the placeholder organizer that `npm run db:seed`
// creates; set SYNC_CREATOR_EMAIL to use a real organizer account instead.
const CREATOR_EMAIL = process.env.SYNC_CREATOR_EMAIL || "organizer@showup.local";

function cleanHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getCategory(opp) {
  const type = (opp.type || "").toLowerCase();
  const subtype = (opp.subtype || "").toLowerCase();
  const title = (opp.title || "").toLowerCase();

  if (type.includes("hackathon") || subtype.includes("hackathon") || title.includes("hackathon") || title.includes("ctf") || title.includes("code") || title.includes("devjam")) {
    return "Hackathon";
  }
  if (type.includes("workshop") || subtype.includes("workshop") || title.includes("workshop") || title.includes("hands-on") || title.includes("masterclass")) {
    return "Workshop";
  }
  if (type.includes("cultural") || title.includes("dance") || title.includes("music") || title.includes("drama") || title.includes("tune") || title.includes("scribe") || title.includes("verdict")) {
    return "Cultural";
  }
  return "Competition";
}

function getBannerHue(category) {
  switch (category) {
    case "Hackathon":
      return 18;
    case "Workshop":
      return 265;
    case "Competition":
      return 200;
    case "Cultural":
      return 30;
    case "Talk":
      return 155;
    default:
      return 210;
  }
}

function escapeSql(str) {
  if (!str) return "''";
  return "'" + String(str).replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";
}

// DATETIME literal in UTC, e.g. '2026-10-02 09:00:00.000'
function sqlDate(iso) {
  return "'" + iso.replace("T", " ").replace("Z", "") + "'";
}

async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
      if (res.ok) return await res.json();
    } catch (e) {
      if (attempt === 3) console.error("Error fetching", url, e.message);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

async function main() {
  console.log("Fetching official graVITas '26 events from Unstop...");

  // 1. Fetch from VIT Vellore organisation opportunities
  const orgUrl = "https://unstop.com/api/public/organisation/1397/opportunities?per_page=100&page=1";
  const orgData = await fetchWithRetry(orgUrl);
  const orgItems = orgData?.data?.data || [];
  console.log(`Pulled ${orgItems.length} items from VIT Vellore organization.`);

  // 2. Fetch search results to obtain full details and descriptions
  const searchMap = new Map();
  const searchQueries = ["VIT Vellore", "gravitas", "Vellore Institute of Technology"];
  for (const q of searchQueries) {
    for (let page = 1; page <= 3; page++) {
      const sUrl = `https://unstop.com/api/public/opportunity/search-result?searchTerm=${encodeURIComponent(q)}&per_page=100&page=${page}`;
      const sData = await fetchWithRetry(sUrl);
      const items = sData?.data?.data || [];
      if (items.length === 0) break;
      items.forEach((item) => searchMap.set(item.id, item));
    }
  }
  console.log(`Pulled ${searchMap.size} search result items with rich metadata.`);

  // 3. Filter for graVITas '26 events
  const gravitasMap = new Map();
  for (const item of orgItems) {
    const url = (item.public_url || "").toLowerCase();
    const festName = (item.festival?.name || "").toLowerCase();
    const title = (item.title || "").toLowerCase();
    if (url.includes("gravitas26") || festName.includes("gravitas'26") || festName.includes("gravitas26")) {
      const enriched = searchMap.get(item.id) || item;
      gravitasMap.set(item.id, enriched);
    }
  }

  // Also include any items from searchMap with gravitas26
  for (const [id, item] of searchMap.entries()) {
    const url = (item.public_url || "").toLowerCase();
    const festName = (item.festival?.name || "").toLowerCase();
    const orgName = (item.organisation?.name || "").toLowerCase();
    if ((url.includes("gravitas26") || festName.includes("gravitas'26") || festName.includes("gravitas26")) && (orgName.includes("vellore") || orgName.includes("vit"))) {
      gravitasMap.set(id, item);
    }
  }

  console.log(`Identified ${gravitasMap.size} official graVITas '26 events!`);

  const now = new Date();
  const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const startAt = new Date(deadline.getTime() + 1 * 24 * 60 * 60 * 1000); // 8 days from now
  const endAt = new Date(startAt.getTime() + 2 * 24 * 60 * 60 * 1000); // 10 days from now

  const feastifyEvents = [];

  for (const opp of gravitasMap.values()) {
    const category = getCategory(opp);
    let description = cleanHtml(opp.details);
    if (!description || description.length < 30) {
      description = `${opp.title} is an official event organized as part of graVITas '26 at VIT Vellore. Join students from across the country to showcase technical skills, innovate, and compete.`;
    }

    if (description.length > 800) {
      description = description.slice(0, 797) + "...";
    }

    const minTeam = opp.regnRequirements?.min_team_size || 1;
    const maxTeam = opp.regnRequirements?.max_team_size || 1;

    const rules = [
      "Open to all college and university students (VITians & external participants).",
      maxTeam > 1 ? `Team size: ${minTeam} - ${maxTeam} members per team.` : "Individual / Solo participation only.",
      "Valid Student ID card is mandatory for check-in at the venue.",
      "Strict adherence to graVITas '26 ethical guidelines and contest rules is required.",
    ];

    const tagline = (opp.subtype || opp.type || `${category} · graVITas '26`).replace(/_/g, " ").slice(0, 120);

    const eventRecord = {
      id: `evt_gravitas_${opp.id}`,
      club_id: "club_vit_gravitas",
      club_name: "graVITas '26 · VIT Vellore",
      title: opp.title.trim().slice(0, 100),
      tagline: tagline.charAt(0).toUpperCase() + tagline.slice(1),
      description,
      rules,
      category,
      scope: "both",
      state: "Tamil Nadu",
      city: "Vellore",
      college: "Vellore Institute of Technology (VIT), Vellore",
      venue: "Technology Tower / Anna Auditorium, VIT Vellore",
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      registration_deadline: deadline.toISOString(),
      capacity: 150,
      fee: opp.isPaid ? 100 : 0,
      team_min: minTeam,
      team_max: maxTeam,
      banner_hue: getBannerHue(category),
      status: "published",
      created_by: CREATOR_EMAIL,
    };

    feastifyEvents.push(eventRecord);
  }

  // Generate a MySQL batch upsert (re-running refreshes existing rows by id)
  const valuesSql = feastifyEvents
    .map((e) => {
      return `(
        ${escapeSql(e.id)},
        ${escapeSql(e.club_id)},
        ${escapeSql(e.club_name)},
        ${escapeSql(e.title)},
        ${escapeSql(e.tagline)},
        ${escapeSql(e.description)},
        ${escapeSql(JSON.stringify(e.rules))},
        ${escapeSql(e.category)},
        ${escapeSql(e.scope)},
        ${escapeSql(e.state)},
        ${escapeSql(e.city)},
        ${escapeSql(e.college)},
        ${escapeSql(e.venue)},
        ${sqlDate(e.start_at)},
        ${sqlDate(e.end_at)},
        ${sqlDate(e.registration_deadline)},
        ${e.capacity},
        ${e.fee},
        ${e.team_min},
        ${e.team_max},
        ${e.banner_hue},
        'published',
        @creator
      )`;
    })
    .join(",\n");

  const fullSql = `
    -- Load with:  mysql -u root -p showup < scripts/gravitas_events.sql
    SET @creator = (SELECT id FROM profiles WHERE email = ${escapeSql(CREATOR_EMAIL)} LIMIT 1);

    INSERT INTO events (
      id, club_id, club_name, title, tagline, description, rules, category, scope,
      state, city, college, venue, start_at, end_at, registration_deadline,
      capacity, fee, team_min, team_max, banner_hue, status, created_by
    ) VALUES
    ${valuesSql}
    AS incoming
    ON DUPLICATE KEY UPDATE
      title = incoming.title,
      tagline = incoming.tagline,
      description = incoming.description,
      rules = incoming.rules,
      category = incoming.category,
      registration_deadline = incoming.registration_deadline,
      start_at = incoming.start_at,
      end_at = incoming.end_at;
  `;

  fs.writeFileSync("scripts/gravitas_events.sql", fullSql, "utf8");
  console.log(`✓ Generated scripts/gravitas_events.sql with ${feastifyEvents.length} graVITas '26 events!`);
}

main().catch(console.error);
