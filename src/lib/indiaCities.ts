/**
 * Major cities/towns per state, for the state -> city dropdowns. This is a
 * curated list (state capitals, metros, and well-known college towns), not
 * an exhaustive gazetteer — every state/city select pairs this with an
 * "Other" option so a real place we didn't list is never unreachable.
 */
export const INDIA_CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry",
    "Kakinada", "Tirupati", "Kadapa", "Anantapur", "Eluru", "Ongole", "Chittoor",
    "Srikakulam", "Vizianagaram",
  ],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila"],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur", "Nagaon", "Tinsukia",
    "Sivasagar", "Diphu", "Karimganj",
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Ara",
    "Begusarai", "Chapra", "Katihar", "Munger", "Bihar Sharif", "Samastipur",
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur",
    "Raigarh", "Ambikapur",
  ],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar",
    "Gandhinagar", "Junagadh", "Anand", "Nadiad", "Mehsana", "Bharuch", "Valsad",
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak",
    "Sonipat", "Yamunanagar", "Panchkula", "Kurukshetra",
  ],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu", "Una", "Hamirpur", "Bilaspur"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih"],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Davanagere",
    "Ballari", "Shivamogga", "Tumakuru", "Udupi", "Manipal", "Kalaburagi", "Bidar", "Hassan",
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur",
    "Kottayam", "Palakkad", "Alappuzha", "Malappuram",
  ],
  "Madhya Pradesh": [
    "Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Rewa",
    "Satna", "Dewas", "Ratlam",
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur",
    "Amravati", "Thane", "Navi Mumbai", "Sangli", "Satara", "Akola", "Latur", "Jalgaon",
  ],
  "Manipur": ["Imphal", "Thoubal", "Churachandpur", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Baripada"],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali",
    "Hoshiarpur", "Pathankot", "Moga",
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar",
    "Bhilwara", "Sikar", "Pali",
  ],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing"],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli",
    "Vellore", "Erode", "Thoothukudi", "Thanjavur", "Dindigul", "Kanchipuram",
  ],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Secunderabad", "Mahbubnagar"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Meerut",
    "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur", "Mathura", "Jhansi",
  ],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Nainital", "Haldwani", "Rudrapur", "Rishikesh"],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kharagpur",
    "Bardhaman", "Malda",
  ],
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu"],
  "Delhi (NCT)": ["New Delhi", "Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadweep": ["Kavaratti"],
  "Puducherry": ["Puducherry", "Karaikal"],
};

export const OTHER_CITY = "__other__";

export function citiesForState(state: string): string[] {
  return INDIA_CITIES_BY_STATE[state] ?? [];
}
