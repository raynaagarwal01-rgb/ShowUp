// Script to fetch live campus events from Unstop and sync to the ShowUp MySQL database
import fs from "node:fs";

// The organizer profile that will own the synced events, looked up by email in
// the database. Defaults to the placeholder organizer that `npm run db:seed`
// creates; set SYNC_CREATOR_EMAIL to use a real organizer account instead.
const CREATOR_EMAIL = process.env.SYNC_CREATOR_EMAIL || "organizer@showup.local";

const STATE_CITY_MAPPINGS = [
  { match: /bengaluru|bangalore/i, state: "Karnataka", city: "Bengaluru" },
  { match: /mumbai|navi mumbai/i, state: "Maharashtra", city: "Mumbai" },
  { match: /pune/i, state: "Maharashtra", city: "Pune" },
  { match: /delhi|new delhi/i, state: "Delhi (NCT)", city: "New Delhi" },
  { match: /gurgaon|gurugram/i, state: "Haryana", city: "Gurgaon" },
  { match: /noida|greater noida/i, state: "Uttar Pradesh", city: "Noida" },
  { match: /hyderabad/i, state: "Telangana", city: "Hyderabad" },
  { match: /chennai/i, state: "Tamil Nadu", city: "Chennai" },
  { match: /vellore/i, state: "Tamil Nadu", city: "Vellore" },
  { match: /pilani/i, state: "Rajasthan", city: "Pilani" },
  { match: /jaipur/i, state: "Rajasthan", city: "Jaipur" },
  { match: /roorkee/i, state: "Uttarakhand", city: "Roorkee" },
  { match: /kolkata/i, state: "West Bengal", city: "Kolkata" },
  { match: /ahmedabad/i, state: "Gujarat", city: "Ahmedabad" },
  { match: /chandigarh/i, state: "Chandigarh", city: "Chandigarh" },
];

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

function detectLocation(text) {
  for (const m of STATE_CITY_MAPPINGS) {
    if (m.match.test(text)) {
      return { state: m.state, city: m.city };
    }
  }
  // Default to Bengaluru or Delhi for national online events
  return { state: "Karnataka", city: "Bengaluru" };
}

function getCategory(opportunityType) {
  switch (opportunityType) {
    case "hackathons":
      return "Hackathon";
    case "workshops":
      return "Workshop";
    case "competitions":
    case "quizzes":
      return "Competition";
    case "cultural":
    case "festivals":
      return "Cultural";
    default:
      return "Competition";
  }
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

async function fetchCategory(category) {
  const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=${category}&per_page=12`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.data || [];
  } catch (e) {
    console.error(`Failed fetching ${category}:`, e.message);
    return [];
  }
}

async function main() {
  console.log("Fetching live events from Unstop...");
  const categories = ["hackathons", "competitions", "workshops", "quizzes"];
  const allOpportunities = [];

  for (const cat of categories) {
    const items = await fetchCategory(cat);
    console.log(`Fetched ${items.length} items from Unstop: ${cat}`);
    for (const item of items) {
      allOpportunities.push({ ...item, unstopCategory: cat });
    }
  }

  console.log(`Total opportunities pulled from Unstop: ${allOpportunities.length}`);

  const feastifyEvents = [];
  const now = new Date();

  for (const opp of allOpportunities) {
    const orgName = opp.organisation?.name || "Campus Community";
    const loc = detectLocation(`${orgName} ${opp.title} ${opp.region || ""}`);
    const category = getCategory(opp.unstopCategory);

    // Clean description
    let description = cleanHtml(opp.details);
    if (!description || description.length < 30) {
      description = `${opp.title} hosted by ${orgName}. Open for students and colleges across India. Join solo or with your team to compete and build exciting projects.`;
    }
    if (description.length > 700) {
      description = description.slice(0, 697) + "...";
    }

    // Rules
    const rules = [
      "Open to college and university students across India.",
      opp.regnRequirements?.max_team_size > 1
        ? `Team size: ${opp.regnRequirements.min_team_size || 1} - ${opp.regnRequirements.max_team_size} members.`
        : "Solo participation.",
      "Check-in at the venue or submission portal before the deadline.",
      "Original work and submissions only.",
    ];

    let deadline = opp.regnRequirements?.end_regn_dt ? new Date(opp.regnRequirements.end_regn_dt) : null;
    if (!deadline || isNaN(deadline.getTime()) || deadline.getTime() <= now.getTime()) {
      deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const startAt = new Date(deadline.getTime() + 1 * 24 * 60 * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 2 * 24 * 60 * 60 * 1000);

    const eventRecord = {
      id: `evt_unstop_${opp.id}`,
      club_id: `club_${opp.organisation?.id || "unstop"}`,
      club_name: orgName.split(",")[0].trim().slice(0, 80),
      title: opp.title.slice(0, 100),
      tagline: (opp.subtype || opp.type || `${category} on Unstop`).slice(0, 120),
      description,
      rules,
      category,
      scope: "both",
      state: loc.state,
      city: loc.city,
      college: orgName.slice(0, 80),
      venue: loc.city + " Campus / Hybrid",
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      registration_deadline: deadline.toISOString(),
      capacity: 100,
      fee: opp.isPaid ? 100 : 0,
      team_min: opp.regnRequirements?.min_team_size || 1,
      team_max: opp.regnRequirements?.max_team_size || 1,
      banner_hue: getBannerHue(category),
      status: "published",
      created_by: CREATOR_EMAIL,
    };

    feastifyEvents.push(eventRecord);
  }

  // Deduplicate by ID
  const uniqueEvents = Array.from(new Map(feastifyEvents.map((e) => [e.id, e])).values());
  console.log(`Prepared ${uniqueEvents.length} unique events.`);

  // Generate a MySQL batch upsert (re-running refreshes existing rows by id)
  const valuesSql = uniqueEvents
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
    -- Load with:  mysql -u root -p showup < scripts/unstop_events.sql
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
      description = incoming.description,
      registration_deadline = incoming.registration_deadline,
      start_at = incoming.start_at,
      end_at = incoming.end_at;
  `;

  fs.writeFileSync("scripts/unstop_events.sql", fullSql, "utf8");
  console.log("✓ Generated scripts/unstop_events.sql successfully!");
}

main().catch(console.error);