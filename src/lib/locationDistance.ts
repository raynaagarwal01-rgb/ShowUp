import type { EventRecord } from "../types";

export interface GeoCoordinates {
  lat: number;
  lng: number;
  name?: string;
}

// Known coordinates for top Indian universities and campus landmarks
export const KNOWN_CAMPUSES: Record<string, GeoCoordinates> = {
  "vellore institute of technology": { lat: 12.9692, lng: 79.1559, name: "VIT Vellore Main Campus" },
  "vit vellore": { lat: 12.9692, lng: 79.1559, name: "VIT Vellore Main Campus" },
  "vit": { lat: 12.9692, lng: 79.1559, name: "VIT Vellore Main Campus" },
  "vit chennai": { lat: 12.8406, lng: 80.1534, name: "VIT Chennai Campus, Vandalur" },
  "iit madras": { lat: 12.9915, lng: 80.2337, name: "IIT Madras, Adyar, Chennai" },
  "iit bombay": { lat: 19.1334, lng: 72.9133, name: "IIT Bombay, Powai, Mumbai" },
  "iit delhi": { lat: 28.545, lng: 77.1926, name: "IIT Delhi, Hauz Khas, New Delhi" },
  "bits pilani": { lat: 28.3639, lng: 75.5875, name: "BITS Pilani, Vidya Vihar, Rajasthan" },
  "anna university": { lat: 13.0102, lng: 80.2354, name: "Anna University, Guindy, Chennai" },
  "srm institute of science and technology": { lat: 12.823, lng: 80.0444, name: "SRM University, Kattankulathur" },
  "srm university": { lat: 12.823, lng: 80.0444, name: "SRM University, Kattankulathur" },
  "manipal academy of higher education": { lat: 13.3525, lng: 74.7865, name: "MAHE Manipal, Karnataka" },
  "mit manipal": { lat: 13.3525, lng: 74.7865, name: "Manipal Institute of Technology, Manipal" },
  "psg college of technology": { lat: 11.0247, lng: 77.0028, name: "PSG Tech, Peelamedu, Coimbatore" },
  "nit trichy": { lat: 10.7589, lng: 78.8132, name: "NIT Tiruchirappalli, Tamil Nadu" },
  "nit surathkal": { lat: 13.0108, lng: 74.7943, name: "NITK Surathkal, Mangalore" },
  "iiit hyderabad": { lat: 17.4451, lng: 78.3489, name: "IIIT Hyderabad, Gachibowli" },
  "dtu": { lat: 28.7501, lng: 77.1177, name: "Delhi Technological University, Rohini" },
  "nsut": { lat: 28.6083, lng: 77.0363, name: "Netaji Subhas University of Technology, Delhi" },
  "coep": { lat: 18.5283, lng: 73.8567, name: "College of Engineering Pune (COEP)" },
  "rvce": { lat: 12.9237, lng: 77.4987, name: "RV College of Engineering, Bengaluru" },
  "bmsce": { lat: 12.9416, lng: 77.5655, name: "BMS College of Engineering, Bengaluru" },
  "msrit": { lat: 13.0308, lng: 77.5649, name: "Ramaiah Institute of Technology, Bengaluru" },
};

// Known coordinates for major Indian cities
export const KNOWN_CITIES: Record<string, GeoCoordinates> = {
  vellore: { lat: 12.9165, lng: 79.1325, name: "Vellore, Tamil Nadu" },
  chennai: { lat: 13.0827, lng: 80.2707, name: "Chennai, Tamil Nadu" },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka" },
  bangalore: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka" },
  hyderabad: { lat: 17.385, lng: 78.4867, name: "Hyderabad, Telangana" },
  mumbai: { lat: 19.076, lng: 72.8777, name: "Mumbai, Maharashtra" },
  pune: { lat: 18.5204, lng: 73.8567, name: "Pune, Maharashtra" },
  delhi: { lat: 28.6139, lng: 77.209, name: "New Delhi, Delhi" },
  "new delhi": { lat: 28.6139, lng: 77.209, name: "New Delhi, Delhi" },
  kolkata: { lat: 22.5726, lng: 88.3639, name: "Kolkata, West Bengal" },
  coimbatore: { lat: 11.0168, lng: 76.9558, name: "Coimbatore, Tamil Nadu" },
  madurai: { lat: 9.9252, lng: 78.1198, name: "Madurai, Tamil Nadu" },
  tirupati: { lat: 13.6288, lng: 79.4192, name: "Tirupati, Andhra Pradesh" },
  kochi: { lat: 9.9312, lng: 76.2673, name: "Kochi, Kerala" },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366, name: "Thiruvananthapuram, Kerala" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: "Ahmedabad, Gujarat" },
  jaipur: { lat: 26.9124, lng: 75.7873, name: "Jaipur, Rajasthan" },
  lucknow: { lat: 26.8467, lng: 80.9462, name: "Lucknow, Uttar Pradesh" },
  kanpur: { lat: 26.4499, lng: 80.3319, name: "Kanpur, Uttar Pradesh" },
  chandigarh: { lat: 30.7333, lng: 76.7794, name: "Chandigarh" },
  bhopal: { lat: 23.2599, lng: 77.4126, name: "Bhopal, Madhya Pradesh" },
  indore: { lat: 22.7196, lng: 75.8577, name: "Indore, Madhya Pradesh" },
  patna: { lat: 25.5941, lng: 85.1376, name: "Patna, Bihar" },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, name: "Bhubaneswar, Odisha" },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, name: "Visakhapatnam, Andhra Pradesh" },
  vijayawada: { lat: 16.5062, lng: 80.648, name: "Vijayawada, Andhra Pradesh" },
  guwahati: { lat: 26.1445, lng: 91.7362, name: "Guwahati, Assam" },
  dehradun: { lat: 30.3165, lng: 78.0322, name: "Dehradun, Uttarakhand" },
  nagpur: { lat: 21.1458, lng: 79.0882, name: "Nagpur, Maharashtra" },
  mysuru: { lat: 12.2958, lng: 76.6394, name: "Mysuru, Karnataka" },
  goa: { lat: 15.2993, lng: 74.124, name: "Panaji, Goa" },
};

/**
 * Resolves destination coordinates for an event based on college, venue, or city.
 */
export function getEventCoordinates(event: EventRecord): GeoCoordinates {
  const collegeKey = event.college.toLowerCase().trim();
  for (const [key, coords] of Object.entries(KNOWN_CAMPUSES)) {
    if (collegeKey.includes(key)) {
      return coords;
    }
  }

  // Check venue for known buildings at VIT Vellore
  const venueLower = event.venue.toLowerCase();
  if (
    venueLower.includes("technology tower") ||
    venueLower.includes("anna auditorium") ||
    venueLower.includes("sjt") ||
    venueLower.includes("silver jubilee") ||
    venueLower.includes("pearl research") ||
    venueLower.includes("smv") ||
    venueLower.includes("chancellor") ||
    venueLower.includes("mb ")
  ) {
    return { lat: 12.9692, lng: 79.1559, name: "VIT Vellore Campus" };
  }

  const cityKey = event.city.toLowerCase().trim();
  if (KNOWN_CITIES[cityKey]) {
    return KNOWN_CITIES[cityKey];
  }

  // Fallback default: Vellore / Central India
  return { lat: 12.9692, lng: 79.1559, name: `${event.venue}, ${event.city}` };
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

export interface TravelEstimate {
  distanceKm: number;
  drivingTimeText: string;
  walkingTimeText?: string;
  transitSummary: string;
  isOnCampus: boolean;
}

/**
 * Generates human-friendly travel time estimates
 */
export function getTravelEstimate(distanceKm: number): TravelEstimate {
  const isOnCampus = distanceKm <= 1.2;

  if (isOnCampus) {
    const walkMins = Math.max(2, Math.round(distanceKm * 12));
    return {
      distanceKm,
      drivingTimeText: `${Math.max(1, Math.round(distanceKm * 3))} mins`,
      walkingTimeText: `${walkMins} mins walk`,
      transitSummary: "Within campus grounds",
      isOnCampus: true,
    };
  }

  // Walking estimate up to 5 km
  const walkingTimeText =
    distanceKm <= 5 ? `${Math.round((distanceKm / 4.5) * 60)} mins walk` : undefined;

  // Driving estimate (avg 40-50 km/h in Indian traffic)
  const drivingMinutes = Math.round((distanceKm / 45) * 60);
  let drivingTimeText = "";
  if (drivingMinutes < 60) {
    drivingTimeText = `~${drivingMinutes} mins`;
  } else {
    const hours = Math.floor(drivingMinutes / 60);
    const mins = drivingMinutes % 60;
    drivingTimeText = `~${hours} hr${hours > 1 ? "s" : ""} ${mins > 0 ? `${mins} m` : ""}`;
  }

  let transitSummary = "";
  if (distanceKm < 15) {
    transitSummary = "Local auto/cab or city bus";
  } else if (distanceKm < 150) {
    transitSummary = "State express bus or local commuter train";
  } else {
    transitSummary = "Intercity express train or flight";
  }

  return {
    distanceKm,
    drivingTimeText,
    walkingTimeText,
    transitSummary,
    isOnCampus: false,
  };
}

/**
 * Builds standard Google Maps Directions URL
 */
export function getGoogleMapsDirectionsUrl(
  event: EventRecord,
  userCoords?: { lat: number; lng: number }
): string {
  const destinationQuery = encodeURIComponent(
    `${event.venue}, ${event.college}, ${event.city}, ${event.state}`
  );

  if (userCoords) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${destinationQuery}&travelmode=driving`;
  }

  // When no origin is specified, Google Maps uses current device location automatically!
  return `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&travelmode=driving`;
}

/**
 * Checks if the event is situated at VIT Vellore
 */
export function isVitVelloreEvent(event: EventRecord): boolean {
  const text = `${event.college} ${event.venue} ${event.city}`.toLowerCase();
  return (
    text.includes("vellore institute of technology") ||
    text.includes("vit vellore") ||
    text.includes("technology tower") ||
    text.includes("anna auditorium") ||
    text.includes("sjt") ||
    (event.city.toLowerCase() === "vellore" && text.includes("vit"))
  );
}
