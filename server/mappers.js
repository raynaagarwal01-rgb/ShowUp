// Row -> JSON shapes. These match the TypeScript types in src/types/index.ts so
// the React app receives exactly what it used to get from Supabase.

const iso = (value) => (value ? new Date(value).toISOString() : null);

export function mapProfile(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    state: row.state,
    city: row.city,
    college: row.college,
    branch: row.branch,
    year: row.year,
    phone: row.phone,
    reg_no: row.reg_no,
    bio: row.bio,
    github: row.github,
    linkedin: row.linkedin,
  };
}

export function mapEvent(row) {
  let rules = row.rules;
  if (typeof rules === "string") {
    try {
      rules = JSON.parse(rules);
    } catch {
      rules = [];
    }
  }
  return {
    id: row.id,
    club_id: row.club_id,
    club_name: row.club_name,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    rules: Array.isArray(rules) ? rules : [],
    category: row.category,
    scope: row.scope,
    state: row.state,
    city: row.city,
    college: row.college,
    venue: row.venue,
    start_at: iso(row.start_at),
    end_at: iso(row.end_at),
    registration_deadline: iso(row.registration_deadline),
    capacity: row.capacity,
    fee: row.fee,
    team_min: row.team_min,
    team_max: row.team_max,
    banner_hue: row.banner_hue,
    status: row.status,
    created_by: row.created_by,
  };
}

export function mapRegistration(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    user_id: row.user_id,
    team_id: row.team_id ?? null,
    status: row.status,
    checked_in_at: iso(row.checked_in_at),
    created_at: iso(row.created_at),
  };
}

/** `memberIds` comes from the team_members join table (leader first). */
export function mapTeam(row, memberIds) {
  return {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    join_code: row.join_code,
    created_by: row.created_by,
    leader_id: row.created_by,
    member_ids: memberIds,
    project_idea: row.project_idea ?? undefined,
  };
}

export function mapAnnouncement(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    title: row.title,
    content: row.content,
    author_name: row.author_name,
    is_urgent: Boolean(row.is_urgent),
    created_at: iso(row.created_at),
  };
}

export function mapQuestion(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    user_id: row.user_id ?? null,
    user_name: row.user_name,
    question: row.question,
    answer: row.answer ?? null,
    answered_by: row.answered_by ?? null,
    answered_at: iso(row.answered_at),
    created_at: iso(row.created_at),
  };
}

export function mapWinner(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    position: row.position,
    winner_title: row.winner_title,
    team_or_participant_name: row.team_or_participant_name,
    college: row.college,
    prize_amount: row.prize_amount,
    project_title: row.project_title,
    project_link: row.project_link,
    announced_by: row.announced_by,
    created_at: iso(row.created_at),
  };
}

export function mapListing(row) {
  return {
    id: row.id,
    event_id: row.event_id,
    user_id: row.user_id,
    user_name: row.user_name,
    user_college: row.user_college,
    looking_for: row.looking_for,
    message: row.message,
    contact: row.contact,
    created_at: iso(row.created_at),
  };
}
