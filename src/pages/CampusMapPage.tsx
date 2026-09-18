import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Calendar,
  Compass,
  Footprints,
  Info,
  Layers,
  Navigation,
  Search,
} from "lucide-react";
import { listEvents } from "../lib/db";
import type { EventRecord } from "../types";

interface CampusBuilding {
  id: string;
  name: string;
  shortName: string;
  code: string;
  color: string;
  accent: string;
  x: number; // percentage in map
  y: number; // percentage in map
  width: number;
  height: number;
  floorsCount: number;
  venueKey: string;
  description: string;
  walkingTime: string;
  directions: string;
  floorDirectory: { floor: string; highlights: string }[];
}

const BUILDINGS: CampusBuilding[] = [
  {
    id: "tt",
    name: "Technology Tower (TT)",
    shortName: "Technology Tower",
    code: "TT",
    color: "#ff6b47",
    accent: "rgba(255, 107, 71, 0.15)",
    x: 48,
    y: 32,
    width: 22,
    height: 18,
    floorsCount: 7,
    venueKey: "technology tower",
    description:
      "The flagship technological nerve centre of VIT Vellore. Houses advanced computer science labs, high-performance computing clusters, and coding marathon halls.",
    walkingTime: "4 mins from Main Gate",
    directions:
      "Enter through Main Gate -> Walk straight past Central Library -> Technology Tower is the 7-storey brick structure on your right.",
    floorDirectory: [
      { floor: "Ground Floor", highlights: "Registration Helpdesk, Exhibition Foyer, Dean's Office" },
      { floor: "Floors 1 - 3", highlights: "Smart Lecture Theatres (TT 101 - 308)" },
      { floor: "Floors 4 - 5", highlights: "Robotics Arena, Embedded Systems & IoT Laboratories" },
      { floor: "Floors 6 - 7", highlights: "24-Hour Hackathon Labs (TT 601 - 620), High-Speed Fiber Desks" },
    ],
  },
  {
    id: "anna",
    name: "Anna Auditorium",
    shortName: "Anna Audi",
    code: "AA",
    color: "#0ea5e9",
    accent: "rgba(14, 165, 233, 0.15)",
    x: 22,
    y: 34,
    width: 20,
    height: 16,
    floorsCount: 2,
    venueKey: "anna auditorium",
    description:
      "Central air-conditioned university auditorium with 1,800 seating capacity. Serves as the primary venue for graVITas mega inaugurations, keynote sessions, and prize distributions.",
    walkingTime: "3 mins from Main Gate",
    directions:
      "Enter through Main Gate -> Head left at the main quadrangle -> Anna Auditorium is directly adjacent to the Technology Tower.",
    floorDirectory: [
      { floor: "Main Hall", highlights: "Grand Stage, 1800 Tiered Seating, Sound & Lighting Booth" },
      { floor: "Front Foyer", highlights: "graVITas '26 Offline Pass QR Scanner Check-in Desks" },
      { floor: "VIP Green Rooms", highlights: "Guest of Honour Lounge & Jury Briefing Suite" },
    ],
  },
  {
    id: "sjt",
    name: "Silver Jubilee Tower (SJT)",
    shortName: "SJT Tower",
    code: "SJT",
    color: "#8b5cf6",
    accent: "rgba(139, 92, 246, 0.15)",
    x: 74,
    y: 28,
    width: 20,
    height: 22,
    floorsCount: 8,
    venueKey: "silver jubilee",
    description:
      "Modern 8-storey academic tower featuring state-of-the-art gallery classrooms, project pitch rooms, and specialised developer spaces.",
    walkingTime: "7 mins from Main Gate",
    directions:
      "Walk past Technology Tower -> Cross the central avenue towards Hexagon -> SJT is the towering glass-accented complex.",
    floorDirectory: [
      { floor: "Ground Floor", highlights: "Central Gallery Room, Project Pitch Arena" },
      { floor: "Floors 2 - 4", highlights: "SCOPE Software Engineering Suites (SJT 201 - 415)" },
      { floor: "Floors 5 - 8", highlights: "AI/ML Research Suites & Workshop Conference Halls" },
    ],
  },
  {
    id: "mgb",
    name: "Mahatma Gandhi Block (MGB)",
    shortName: "MG Block",
    code: "MGB",
    color: "#10b981",
    accent: "rgba(16, 185, 129, 0.15)",
    x: 20,
    y: 62,
    width: 24,
    height: 18,
    floorsCount: 4,
    venueKey: "mgb",
    description:
      "Engineering block housing hardware fabrication workshops, drone obstacle arenas, and rapid prototyping labs.",
    walkingTime: "6 mins from Main Gate",
    directions:
      "From Anna Auditorium -> Walk South past the Mechanical Quadrangle -> MGB is on the left.",
    floorDirectory: [
      { floor: "Ground Floor", highlights: "Heavy Machinery & Rapid Prototyping Workshop" },
      { floor: "Floor 1", highlights: "CAD / CAM Simulation Lab & 3D Printing Station" },
      { floor: "Floors 2 - 4", highlights: "Robotics Combat Pitches & Seminar Rooms" },
    ],
  },
  {
    id: "cdmm",
    name: "CDMM & Balaji Hall",
    shortName: "Balaji Hall",
    code: "CDMM",
    color: "#f59e0b",
    accent: "rgba(245, 158, 11, 0.15)",
    x: 50,
    y: 60,
    width: 20,
    height: 16,
    floorsCount: 3,
    venueKey: "balaji",
    description:
      "Host to technical paper presentations, hackathon pitch rounds, and club executive meetings.",
    walkingTime: "5 mins from Main Gate",
    directions:
      "Located directly behind Technology Tower along the Central Lawn walk.",
    floorDirectory: [
      { floor: "Ground Floor", highlights: "Balaji Hall (400 capacity presentation theatre)" },
      { floor: "Floors 1 - 2", highlights: "Disaster Simulation Lab, Conference Suite" },
    ],
  },
  {
    id: "library",
    name: "Central Library & Green Court",
    shortName: "Central Library",
    code: "LIB",
    color: "#ec4899",
    accent: "rgba(236, 72, 153, 0.15)",
    x: 48,
    y: 10,
    width: 22,
    height: 14,
    floorsCount: 4,
    venueKey: "library",
    description:
      "The central crossroads of VIT Vellore campus. Features outdoor exhibition lawns, registration helpdesks, and student lounge zones.",
    walkingTime: "2 mins from Main Gate",
    directions:
      "Enter through Main Gate -> Straight 150 metres -> Central Library is straight ahead.",
    floorDirectory: [
      { floor: "Outdoor Lawn", highlights: "graVITas '26 Sponsor Stalls & Open Exhibition" },
      { floor: "Floor 1", highlights: "Quiet Study Hub & Hackathon Research Access" },
    ],
  },
];

export const CampusMapPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("tt");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await listEvents();
        setEvents(all);
      } catch (e) {
        console.error("Failed to load events for map", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedBuilding = useMemo(() => {
    return BUILDINGS.find((b) => b.id === selectedId) || BUILDINGS[0];
  }, [selectedId]);

  // Filter events located in the selected venue
  const venueEvents = useMemo(() => {
    const key = selectedBuilding.venueKey.toLowerCase();
    return events.filter(
      (e) =>
        e.venue.toLowerCase().includes(key) ||
        (selectedBuilding.id === "tt" && e.venue.toLowerCase().includes("technology")) ||
        (selectedBuilding.id === "anna" && e.venue.toLowerCase().includes("anna")) ||
        (selectedBuilding.id === "sjt" && e.venue.toLowerCase().includes("sjt"))
    );
  }, [events, selectedBuilding]);

  // Filtered buildings by search query
  const matchingBuildings = useMemo(() => {
    if (!search.trim()) return BUILDINGS;
    const q = search.toLowerCase();
    return BUILDINGS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.floorDirectory.some((f) => f.highlights.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-coral/40 bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-coral mb-2">
            <Compass className="h-3.5 w-3.5" />
            VIT Vellore Campus Guide
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-cream">
            Interactive Campus &amp; Venue Map
          </h1>
          <p className="mt-1 text-sm text-cream/75 max-w-2xl">
            Locate auditoriums, technology towers, computing labs, and floor-by-floor hackathon venues for graVITas '26 and campus festivals.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue, lab, or building..."
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-xs text-cream placeholder-muted focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      {/* Building Quick-Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">
          Venues:
        </span>
        {BUILDINGS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedId(b.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedId === b.id
                ? "bg-coral text-ink shadow-md shadow-coral/15"
                : "border border-border bg-surface text-cream/80 hover:text-cream"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: b.color }}
            />
            {b.shortName}
          </button>
        ))}
      </div>

      {/* Main Grid: Interactive Map Visual + Details Pane */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Interactive Vector 2D Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="relative h-[480px] sm:h-[520px] w-full rounded-3xl border border-border bg-[#0a0f1d] p-4 shadow-2xl overflow-hidden select-none">
            {/* Map Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#6366f1 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 12px 12px",
              }}
            />

            {/* Campus Pathways & Roads (SVG) */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
              {/* Main Entrance Road */}
              <line x1="59%" y1="100%" x2="59%" y2="8%" stroke="#1e293b" strokeWidth="24" />
              <line x1="59%" y1="100%" x2="59%" y2="8%" stroke="#334155" strokeWidth="2" strokeDasharray="6 6" />

              {/* Cross Avenues */}
              <line x1="8%" y1="42%" x2="92%" y2="42%" stroke="#1e293b" strokeWidth="18" />
              <line x1="8%" y1="70%" x2="92%" y2="70%" stroke="#1e293b" strokeWidth="14" />
            </svg>

            {/* Main Gate Landmark Marker */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-3 py-1 text-[11px] font-bold text-emerald-400 backdrop-blur shadow">
              <Navigation className="h-3 w-3 animate-pulse" />
              MAIN CAMPUS GATE (KATPADI ROAD)
            </div>

            {/* Building Nodes on Map */}
            {BUILDINGS.map((b) => {
              const isSelected = selectedId === b.id;
              const matchesSearch = matchingBuildings.some((m) => m.id === b.id);

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedId(b.id)}
                  className={`absolute rounded-2xl border transition-all duration-300 p-2.5 flex flex-col justify-between text-left cursor-pointer group ${
                    isSelected
                      ? "scale-105 z-20 shadow-2xl border-2"
                      : matchesSearch
                      ? "hover:scale-102 z-10 opacity-95"
                      : "opacity-40 hover:opacity-80"
                  }`}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.width}%`,
                    height: `${b.height}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: isSelected ? "#161b2e" : "#0f1424",
                    borderColor: isSelected ? b.color : "rgba(255,255,255,0.12)",
                    boxShadow: isSelected ? `0 0 25px ${b.color}40` : "none",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase text-white"
                      style={{ backgroundColor: b.color }}
                    >
                      {b.code}
                    </span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-coral animate-ping" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-display text-xs font-bold text-cream line-clamp-1 group-hover:text-coral transition-colors">
                      {b.shortName}
                    </h4>
                    <span className="text-[10px] text-muted block">
                      {b.floorsCount} Floors
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-muted px-2">
            <span className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-coral" /> Click any building to view floor directories and scheduled events.
            </span>
            <span>VIT Vellore Main Campus</span>
          </div>
        </div>

        {/* Right Column: Building Details, Walking Directions & Events (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Selected Building Overview Card */}
          <div className="rounded-3xl border border-border bg-surface p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-lg px-2 py-0.5 text-xs font-black text-white uppercase"
                    style={{ backgroundColor: selectedBuilding.color }}
                  >
                    {selectedBuilding.code}
                  </span>
                  <h2 className="font-display text-xl font-bold text-cream">
                    {selectedBuilding.name}
                  </h2>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <Layers className="h-3.5 w-3.5 text-coral" />
                  {selectedBuilding.floorsCount} Storeys / Floor Levels
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-cream/80 leading-relaxed">
              {selectedBuilding.description}
            </p>

            {/* Walking Directions Box */}
            <div className="rounded-2xl border border-border/80 bg-surface-2 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cream flex items-center gap-1.5">
                  <Footprints className="h-4 w-4 text-coral" /> Walking Directions
                </span>
                <span className="text-coral font-semibold text-[11px]">
                  {selectedBuilding.walkingTime}
                </span>
              </div>
              <p className="text-xs text-cream/70 leading-normal">
                {selectedBuilding.directions}
              </p>
            </div>

            {/* Floor Breakdown Guide */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-coral" /> Floor Directory
              </h3>
              <div className="rounded-2xl border border-border/60 bg-surface-2 divide-y divide-border/60 text-xs">
                {selectedBuilding.floorDirectory.map((f, i) => (
                  <div key={i} className="p-2.5 flex items-start gap-3">
                    <span className="font-mono font-bold text-coral shrink-0 w-24">
                      {f.floor}
                    </span>
                    <span className="text-cream/80">{f.highlights}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Events Hosted at this Venue */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" /> Events at this Venue ({venueEvents.length})
                </span>
              </h3>

              {loading ? (
                <div className="py-4 text-center text-xs text-muted">Searching scheduled events...</div>
              ) : venueEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted">
                  No current events mapped specifically to this venue.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {venueEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      to={`/events/${ev.id}`}
                      className="group flex items-center justify-between rounded-xl border border-border bg-surface-2/80 p-3 hover:border-coral/40 transition-colors text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-cream group-hover:text-coral transition-colors line-clamp-1">
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-muted">
                          {ev.category} · {ev.club_name}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted group-hover:text-coral transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
