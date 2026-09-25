export const INITIAL_SERVICES = [
  {
    id: "svc_coconut",
    name: "Coconut Plucking",
    icon: "🥥",
    unit: "per tree",
    base_rate: 90.0,
    requires_height_category: false,
    risk: "high",
    desc: "Full-height climb and harvest of mature coconuts by safety-certified pluckers with ground spotting.",
    status: "active"
  },
  {
    id: "svc_areca",
    name: "Supari (Areca Nut) Plucking",
    icon: "🌰",
    unit: "per tree",
    base_rate: 70.0,
    requires_height_category: false,
    risk: "high",
    desc: "Agile slender-trunk climbing for ripe areca nut bunches with gentle handling.",
    status: "active"
  },
  {
    id: "svc_mango",
    name: "Mango Harvesting",
    icon: "🥭",
    unit: "per tree",
    base_rate: 120.0,
    requires_height_category: false,
    risk: "high",
    desc: "Seasonal canopy work with specialized picking poles and catch-nets to eliminate fruit bruising.",
    status: "active"
  },
  {
    id: "svc_palm",
    name: "Palm Leaf Cutting & Crown Care",
    icon: "🌿",
    unit: "per tree",
    base_rate: 150.0,
    requires_height_category: false,
    risk: "high",
    desc: "Removal of hazardous dry fronds, seed pods, and crown debris to maintain tree health.",
    status: "active"
  },
  {
    id: "svc_trim",
    name: "Canopy / Tree Trimming",
    icon: "✂️",
    unit: "per tree",
    base_rate: 350.0,
    requires_height_category: true, // Only Canopy / Tree Trimming requires Height Category per spec A.1
    risk: "high",
    desc: "Chainsaw-assisted branch clearance and canopy reduction near roofs, overhead wires, and compound walls.",
    status: "active"
  },
  {
    id: "svc_orchard",
    name: "Orchard Bulk Harvesting",
    icon: "🌾",
    unit: "per tree",
    base_rate: 80.0,
    requires_height_category: false,
    risk: "high",
    desc: "High-volume harvest operations for large plantations with multi-climber coordination.",
    status: "active"
  },
  {
    id: "svc_waste",
    name: "Husk & Frond Waste Disposal",
    icon: "🗑️",
    unit: "per visit",
    base_rate: 600.0,
    requires_height_category: false,
    risk: "low",
    desc: "Full ground cleanup, husk stacking, and organic garden waste clearance after plucking.",
    status: "active"
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: "cus_001",
    username: "ashwin",
    password: "123",
    full_name: "Ashwin Kamat",
    phone: "9822011234",
    address: "H.No 12, Coastal Road",
    taluka: "North Goa",
    role: "customer"
  },
  {
    id: "cus_002",
    username: "fernandes",
    password: "123",
    full_name: "Fernandes Plantation Estate",
    phone: "9765098123",
    address: "Plot 44, Plantation Road",
    taluka: "South Goa",
    role: "customer"
  },
  {
    id: "cus_003",
    username: "coop",
    password: "123",
    full_name: "Farmers Cooperative",
    phone: "9822345678",
    address: "Main Market Road",
    taluka: "Kushavati",
    role: "customer"
  }
];

export const INITIAL_PROFESSIONALS = [
  {
    id: "wrk_001",
    username: "prakash",
    password: "123",
    full_name: "Prakash Naik",
    phone: "9822099876",
    experience_years: 11,
    safety_cert: "Certified Master Climber",
    rating_avg: 4.9,
    taluka: "North Goa",
    skills: ["svc_coconut", "svc_areca", "svc_palm"],
    status: "approved",
    role: "professional"
  },
  {
    id: "wrk_002",
    username: "vishal",
    password: "123",
    full_name: "Vishal Kerkar",
    phone: "9765011223",
    experience_years: 8,
    safety_cert: "Advanced Rigging & Tree Safety",
    rating_avg: 4.7,
    taluka: "South Goa",
    skills: ["svc_coconut", "svc_mango", "svc_trim"],
    status: "approved",
    role: "professional"
  },
  {
    id: "wrk_003",
    username: "ganesh",
    password: "123",
    full_name: "Ganesh Volvoikar",
    phone: "9922556677",
    experience_years: 6,
    safety_cert: "Height Safety & Rope Access",
    rating_avg: 4.5,
    taluka: "Central Goa",
    skills: ["svc_areca", "svc_coconut"],
    status: "approved",
    role: "professional"
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: "bkg_001",
    booking_number: "CP-1001",
    customer_id: "cus_001",
    professional_id: "wrk_001",
    service_id: "svc_coconut",
    tree_count: 6,
    height_category: null,
    taluka: "North Goa",
    address: "H.No 12, Coastal Road",
    scheduled_at: "2026-09-20T10:00:00Z",
    booking_type: "standard",
    call_confirmed: true,
    status: "completed",
    base_amount: 540.0,
    surcharge_amount: 0,
    quote_amount: 540.0,
    actual_amount: 540.0,
    payment_status: "paid",
    rating: 5,
    comment: "Prakash was on time, used double harness, and cleared the coconuts neatly into bundles.",
    created_at: "2026-09-18T08:30:00Z"
  },
  {
    id: "bkg_002",
    booking_number: "CP-1002",
    customer_id: "cus_002",
    professional_id: "wrk_002",
    service_id: "svc_trim",
    tree_count: 3,
    height_category: "medium",
    taluka: "South Goa",
    address: "Plot 44, Plantation Road",
    scheduled_at: "2026-09-21T14:00:00Z",
    booking_type: "standard",
    call_confirmed: true,
    status: "completed",
    base_amount: 1050.0,
    surcharge_amount: 0,
    quote_amount: 1050.0,
    actual_amount: 1050.0,
    payment_status: "paid",
    rating: 5,
    comment: "Trimmed heavy branches safely away from the high-voltage lines without incident.",
    created_at: "2026-09-19T11:00:00Z"
  },
  {
    id: "bkg_003",
    booking_number: "CP-1003",
    customer_id: "cus_001",
    professional_id: "wrk_001",
    service_id: "svc_coconut",
    tree_count: 8,
    height_category: null,
    taluka: "North Goa",
    address: "H.No 12, Coastal Road",
    scheduled_at: "2026-09-28T09:00:00Z",
    booking_type: "standard",
    call_confirmed: true,
    status: "assigned",
    base_amount: 720.0,
    surcharge_amount: 0,
    quote_amount: 720.0,
    actual_amount: null,
    payment_status: "pending",
    rating: null,
    comment: null,
    created_at: "2026-09-22T09:15:00Z"
  },
  {
    id: "bkg_004",
    booking_number: "CP-1004",
    customer_id: "cus_001",
    professional_id: null,
    service_id: "svc_trim",
    tree_count: 2,
    height_category: "high",
    taluka: "North Goa",
    address: "H.No 12, Coastal Road",
    scheduled_at: "2026-09-28T09:00:00Z",
    booking_type: "urgent",
    call_confirmed: false,
    status: "requested",
    base_amount: 700.0,
    surcharge_amount: 140.0,
    quote_amount: 840.0,
    actual_amount: null,
    payment_status: "pending",
    rating: null,
    comment: null,
    created_at: "2026-09-24T08:00:00Z"
  }
];

export const INITIAL_INCIDENTS = [
  {
    id: "inc_001",
    booking_id: "bkg_001",
    reported_by_id: "wrk_001",
    reported_by_name: "Prakash Naik",
    type: "Near-miss",
    severity: "low",
    description: "Noticed loose electrical wire near the palm top. Maintained safety buffer.",
    photo_url: null,
    status: "resolved",
    created_at: "2026-09-20T11:30:00Z"
  }
];
