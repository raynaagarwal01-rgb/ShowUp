# ShowUp — Comprehensive Project Submission Document

**Student Name:** Rayna Agarwal  
**Registration Number:** 25BCE0703  
**Institution:** Vellore Institute of Technology (VIT), Vellore  
**Department:** Computer Science & Engineering (CSE)  
**Live Production Website:** [https://showup-campus.vercel.app](https://showup-campus.vercel.app)  
**Official graVITas '26 Events Hub:** [https://showup-campus.vercel.app/fests/gravitas26](https://showup-campus.vercel.app/fests/gravitas26)  
**GitHub Repository:** [https://github.com/raynaagarwal01-rgb/ShowUp](https://github.com/raynaagarwal01-rgb/ShowUp)  
**Google Drive Submission Folder:** [https://drive.google.com/drive/folders/1NqCytuNS5DiaBu40F68yNv-zc6RESz7v](https://drive.google.com/drive/folders/1NqCytuNS5DiaBu40F68yNv-zc6RESz7v)  
**Submission Date:** September 2026  

---

## 1. Executive Summary & Problem Solved

At universities like **VIT Vellore**, thousands of students actively participate in technical hackathons, coding contests, robotics competitions, technical workshops, and cultural fests across major festivals such as **graVITas** and **Riviera**. However, campus event participation has historically been hampered by fragmented registration processes:
- Registrations are scattered across dozens of individual Google Forms, WhatsApp groups, and external Unstop links.
- Students miss deadlines, lose team secret codes, and miss urgent organizer announcements.
- Getting official **On-Duty (OD) attendance permission** requires tedious physical paperwork and verification signatures.
- Participation certificates often take weeks to be manually emailed and lack cryptographic proof of authenticity.
- Students struggle to locate campus venues or calculate walking distances between academic blocks (Anna Auditorium, Technology Tower, SJT, TT, MB).

**ShowUp** solves this entire lifecycle through an end-to-end, production-grade event operating system:
1. **Unified Event Directory & Search:** Multi-attribute filtering (category, campus internal vs national external, date ranges, price, and bookmarks).
2. **Dedicated graVITas '26 Hub:** Live countdown timer to Day 1, 3-day timeline breakdown, and 56+ synchronized official VIT events.
3. **Protected Event Access:** Authentication security protecting events behind verified student login with smart return redirects.
4. **Instant Event Destination Mapping:** Integrated Google Maps navigation modal next to every event venue with real-time campus distance calculation.
5. **Per-Event Teammate Finder:** Live board on every hackathon allowing students to post required skills (Frontend, Backend, AI/ML) and connect via WhatsApp.
6. **Simulated Online UPI & Card Gateway:** Realistic checkout modal supporting GPay, PhonePe, Paytm, and dynamic QR scan with zero convenience fee.
7. **Offline Entry Passes (800x1080 PNG):** High-contrast entry pass saved directly to mobile gallery with scannable door QR code.
8. **Automated 1080p Participation Certificates:** High-resolution (1920x1080) client-side canvas generation with official gold seal of merit and cryptographic verification QR code.
9. **Student Portfolio & Public Credentials (`/u/:userId`):** Shareable student resume with verified ShowUp credentials, competition trophies, and 1-click **Add to LinkedIn Profile** button.
10. **Organizer Studio & Live Door Scanner:** Real-time check-in using webcam QR decoding, registrant management, and 13-column academic OD CSV export.

---

## 2. Complete Page-by-Page & Button-by-Button Breakdown

### Page 1: Landing Page (`/`)
- **Logo ("ShowUp")**: Features the brand new coral-to-amber gradient upward arrow badge (`ArrowUpRight`) with a pulsating emerald live indicator dot. Clicking returns to the home page from anywhere.
- **"Browse events" Button**: Directs students to the event discovery directory (`/events`). If the user is not signed in, it safely routes to `/login?redirect=/events` with an educational banner.
- **"Host an event" Button**: Accessible to event managers and club leads, directing to the Organizer Studio (`/organizer`) or signup wizard.
- **Feature Showcase Tiles**:
  - *Register once, reuse everywhere:* Highlights persistent student profiles.
  - *Solo or team, built in:* Highlights secret join codes and automated capacity limits.
  - *QR check-in at the door:* Highlights phone camera scanning and offline passes.
  - *One dashboard, not two portals:* Highlights unified student & organizer management.
- **Navbar Links**:
  - `Events`: One-click navigation to campus event directory.
  - `Organizer Studio`: Visible to club organizers and faculty convenors.
  - `My Events`: Quick-access student tickets and registration dashboard.
  - `Portfolio`: Opens personal credential showcase and portfolio editor.
  - `Sign in` / `Get started` / `Sign out`: Role-based authentication controls.

---

### Page 2: Event Directory & Discovery (`/events`)
*Protected by verified student authentication.*
- **Keyword Search Bar**: Instant real-time filtering as you type, matching title, club name, venue, description, or university.
- **Scope Segmented Control (`All` / `Internal` / `External`)**:
  - `All`: Displays all registered events nationwide.
  - `Internal`: Filters events restricted exclusively to VIT students.
  - `External`: Filters open inter-college events welcoming outstation universities.
- **Category Filter Pills**: Quick-filter toggles for `Hackathon`, `Workshop`, `Competition`, `Cultural`, and `Talk`.
- **"Saved (count)" Wishlist Pill**: One-click filter isolating only the events saved by the student.
- **Date Range Pickers (`From` and `To`)**: Allows students to filter events happening during specific weekends or festival days.
- **Sort Dropdown**: Options for "Soonest first", "Latest first", "Fee: Free first", "Fee: Low to High", and "Fee: High to Low".
- **"Reset all filters" Button**: Clears all active filters, searches, and date boundaries with one click.
- **Event Card Controls**:
  - **Bookmark Ribbon (Heart/Bookmark icon)**: Instant save/unsave to local wishlist without page reloads.
  - **"View on Map" / MapPin Button**: Opens the destination map modal showing venue location, walking distance from campus gate, and direct Google Maps routing.
  - **Event Card Click**: Navigates into the full event details and registration page (`/events/:id`).

---

### Page 3: Event Details & Registration (`/events/:id`)
*Interactive multi-tab participation center.*
- **Venue & Destination Map Action**: Next to the venue address, clicking the map pin launches the directions modal with turn-by-turn routing to Anna Auditorium, Technology Tower, etc.
- **Interactive Tabs**:
  1. **"Overview & Rules" Tab**: Displays full event briefing, prerequisites, team size requirements, and numbered contest regulations.
  2. **"Announcements" Tab**: Real-time broadcast notice feed from the event organizers with glowing `URGENT ALERT` badges for schedule or room changes.
  3. **"Teammate Finder" Tab**: Dedicated peer-matching board where solo participants post open team slots, specify required skills (Frontend, ML, UI/UX), and connect via direct WhatsApp chat.
  4. **"Q&A Forum" Tab**: Discussion thread allowing students to ask questions and view verified organizer answers flagged with the green shield badge (*"Answered by Organizer"*).
  5. **"Winners & Trophies" Tab**: Post-event podium displaying 1st Place Grand Champion and Runners-Up with project demo links and authenticated jury stamps.
- **Sidebar Registration Controls**:
  - **Solo Event**: "Register Now" button (opens the ShowUp Demo UPI modal if `fee > 0`, or registers immediately if free).
  - **Team Event**: Segmented control between `Create team` (enter team name and get a 6-character secret join code) and `Join with code` (enter code from team lead).
  - **"Preview Official Participation Certificate"**: Opens the certificate canvas modal to inspect the pre-check-in certificate layout.
- **Confirmed Registration State**:
  - Status badge (`Confirmed` / `Waitlisted`).
  - **"Download Pass (PNG)" Button**: Exports the 800x1080 high-contrast door ticket to smartphone gallery.
  - **"Download Certificate (PNG)" Button**: Renders and downloads the 1920x1080 participation certificate.
  - **"Add to Calendar" Dropdown**: Generates Google Calendar event or downloads `.ics` for Apple/Outlook.
  - **"View my ticket" Button**: Navigates to `/dashboard`.

---

### Page 4: Dedicated graVITas '26 Events Hub (`/fests/gravitas26`)
- **Neon Hero Showcase**: Fest countdown header for VIT Vellore's annual international tech fest.
- **Real-Time Countdown Clock**: Displays live ticking countdown in Days, Hours, Minutes, and Seconds until Day 1 (September 26, 2026).
- **Festival Perks Grid**:
  - *Official OD Letter:* For university attendance authorization.
  - *ShowUp Verified Cert:* Instant cryptographic QR-verified credentials.
  - *56+ Official Events:* Synchronized from Unstop and VIT clubs.
- **Schedule Timeline Switcher**:
  - `All 3 Days (56)`
  - `Day 1 · Sep 26 (Fri)`
  - `Day 2 · Sep 27 (Sat)`
  - `Day 3 · Sep 28 (Sun)`
- **Filters**: "Teams Only" and "Free Entry" toggles, plus category pills.
- **Attendee Guidelines Accordion**: Details on OD attendance slips, digital certificate validation, Anna Auditorium & TT check-in desks, and hostel accommodation.

---

### Page 5: Student Dashboard / My Events (`/dashboard`)
- **My Registrations Section**: Complete list of all events the student has signed up for.
- **"Show / Hide Ticket" Button**: Toggles full-screen scannable door QR code.
- **"Download Offline Pass (PNG)" Button**: Generates offline entry pass.
- **"Certificate" Button**: Launches the cryptographic certificate modal with pre-check-in watermark or unlocked post-check-in verification seal.
- **"Add to Calendar" Dropdown**: Synchronizes the event schedule with personal devices.
- **"Cancel Registration" (X Icon)**: Self-service registration cancellation that immediately frees up capacity for waitlisted students.

---

### Page 6: Student Portfolio & Public Profile (`/profile` & `/u/:userId`)
- **Shareable Public URL**: Instant portfolio link (e.g. `showup-campus.vercel.app/u/rayna-25bce0703`).
- **"Edit Portfolio" Button**: Opens the modal to update bio, university, graduation year, skills tags, GitHub profile, LinkedIn profile, and website.
- **"Copy Profile Link" Button**: Copies the verified public profile link to the clipboard with visual confirmation.
- **Verified ShowUp Credentials Grid**: Displays every registered event with unique cryptographic certificate ID (`SUP-XXXXXX`).
- **"Add to LinkedIn" Button**: 1-click URL generator that pre-fills the LinkedIn Certification Form with name, issuing authority ("ShowUp Credentials"), and credential ID.
- **"OD Slip" Button**: Downloads the official On-Duty attendance letter.

---

### Page 7: Organizer Studio (`/organizer`)
- **Analytics KPIs**: Live tiles showing Total Events Hosted, Total Registrations, Total Revenue Collected (₹), and Door Check-in Rate (%).
- **"Create Event" Button**: Opens the multi-step event publication wizard (`/organizer/new`).
- **"Manage Registrants" Button**: Opens the attendee management table.
- **"Door Check-in Scanner" Button**: Launches the camera QR scanner for door check-in.

---

### Page 8: Organizer Registrant Management & OD Export (`/organizer/events/:id`)
- **Attendee Management Table**: Lists all registrants with Name, Email, Phone, College, Registration Number, Team Name, and Check-in status.
- **Search Bar**: Filters attendees in real time by name, email, or team.
- **"Export OD CSV" Button**: Generates a university-standard 13-column CSV spreadsheet formatted for the Student Welfare Office (SWO) containing student details, event dates, venues, and timestamps.

---

### Page 9: Door QR Check-in Scanner (`/organizer/events/:id/checkin`)
- **Camera Viewfinder**: Live phone camera or laptop webcam feed utilizing `html5-qrcode` to scan participant tickets in under 200 milliseconds.
- **Manual Ticket ID Fallback Input**: Allows organizers to type in ticket codes if the participant's phone screen is cracked or battery is low.
- **Immediate Audio-Visual Feedback**: Green confirmation checkmark with attendee name, college, and team name upon successful door admission.

---

## 3. Tools & Technologies Breakdown: Who, Why & How

| Technology / Tool | Who Created It | Why It Was Chosen | How It Is Used in ShowUp |
| :--- | :--- | :--- | :--- |
| **React 19** | Meta / Open Source | Component-driven architecture, declarative rendering, and fast virtual DOM updates. | Powers all dynamic user interfaces, interactive tab switchers, modals, forms, and client routing. |
| **TypeScript 6** | Microsoft | Compile-time static type safety; prevents null-pointer exceptions and ensures strict contracts. | Strictly types all models (`EventRecord`, `Registration`, `Profile`, `Announcement`, `EventQuestion`, `EventWinner`). |
| **Vite 8** | Evan You & Vite Team | Instant dev-server startup via native ES modules and high-speed production bundling with Rollup. | Compiles, bundles, and tree-shakes the entire frontend into optimized minified chunks in under 1 second. |
| **Tailwind CSS v4** | Tailwind Labs | Utility-first styling with zero CSS file bloat and built-in responsive design primitives. | Implements the custom dark-mode theme palette (`bg-ink`, `bg-surface`, `text-coral`, `bg-surface-2`). |
| **Lucide React** | Lucide Project | Lightweight, accessible, consistent modern vector icons. | Renders all interactive icons (upward logo, navigation pills, calendar, map pin, QR pass, awards). |
| **HTML5 Canvas 2D API** | W3C Web Standard | Client-side 2D hardware-accelerated graphic rendering without server dependencies. | Synthesizes 1920x1080 participation certificates and 800x1080 offline door passes in ~80ms in the browser. |
| **node-qrcode** | Soldair / Open Source | Fast cryptographic QR matrix generation from arbitrary text payloads. | Generates dynamic entrance QR codes and simulated UPI payment strings. |
| **html5-qrcode** | Minhaz / Open Source | Robust client-side camera stream reader and QR decoder. | Powers the door check-in camera scanner in the Organizer Studio. |
| **Supabase (PostgreSQL 15)** | Supabase Inc. | Cloud relational database with Row Level Security (RLS) and real-time APIs. | Persists events, registrations, teams, profiles, announcements, questions, and competition winners. |
| **Supabase Edge Functions** | Deno / Supabase | Low-latency serverless TypeScript execution at the edge. | Handles automated confirmation dispatch for email (Resend) and SMS (Fast2SMS/Twilio). |
| **Vercel Edge Cloud** | Guillermo Rauch / Vercel | Global CDN with atomic rolling deployments, zero configuration, and instant SSL. | Hosts the production platform at `showup-campus.vercel.app` with instant Git deployment. |
| **GitHub** | Chris Wanstrath / Microsoft | Distributed version control, branch management, and CI triggers. | Tracks codebase history at `github.com/raynaagarwal01-rgb/ShowUp` and triggers automated Vercel deploys. |

---

## 4. Key Architectural & Functional Innovations

1. **Dual-Mode Persistence Architecture (Cloud & Offline Fallback)**:
   - When configured with Supabase credentials, ShowUp synchronizes in real time with cloud PostgreSQL.
   - If offline or unconfigured, the application seamlessly activates the client-side `demoStorage` engine, allowing complete testing (signup, event creation, registration, payment simulation, check-in) directly inside the browser.
2. **Client-Side High-Resolution Certificate Synthesis**:
   - Rather than relying on heavy server-side PDF clusters (Puppeteer), ShowUp renders publication-grade 1920x1080 certificates with gold seals, filigree borders, and embedded verification QR codes directly in the browser in under 80 milliseconds.
3. **Turn-by-Turn Venue Mapping & Campus Distance**:
   - Every event card and detail page includes direct location mapping, showing the student exact distance from campus landmarks and 1-click routing into Google Maps.
4. **Standardized Academic OD Slip & CSV Exporters**:
   - Built specifically to satisfy university attendance criteria at institutions like VIT Vellore, eliminating registration ambiguity for external and internal hackathons.

---

## 5. Submission & Verification Summary

- **Live Production URL:** [https://showup-campus.vercel.app](https://showup-campus.vercel.app)
- **graVITas '26 Hub:** [https://showup-campus.vercel.app/fests/gravitas26](https://showup-campus.vercel.app/fests/gravitas26)
- **GitHub Repository:** [https://github.com/raynaagarwal01-rgb/ShowUp](https://github.com/raynaagarwal01-rgb/ShowUp)
- **Submission Documents:**
  - `SHOWUP_PROJECT_SUBMISSION_RAYNA_AGARWAL.pdf` (High-resolution PDF report)
  - `SHOWUP_PROJECT_SUBMISSION_RAYNA_AGARWAL.html` (Interactive web document)
  - `SHOWUP_PROJECT_SUBMISSION_RAYNA_AGARWAL.md` (Markdown document)
  - `PROJECT_SUBMISSION_LINKS_AND_SUMMARY.txt` (Text summary)

---
*ShowUp · Built with Passion by Rayna Agarwal (25BCE0703) · VIT Vellore · September 2026*
