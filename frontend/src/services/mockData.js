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
    id: "svc_jackfruit",
    name: "Jackfruit Plucking",
    icon: "🍈",
    unit: "per tree",
    base_rate: 140.0,
    requires_height_category: false,
    risk: "high",
    desc: "Specialized climbing and gentle rope-lowering of heavy, mature jackfruits from tall canopy branches without fruit damage.",
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
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: "cus_001",
    username: "9822100001",
    password: "123",
    full_name: "Rohan Dessai",
    phone: "9822100001",
    address: "House 42, Beach Road, Calangute",
    taluka: "North Goa",
    role: "customer"
  },
  {
    id: "cus_002",
    username: "9822100002",
    password: "123",
    full_name: "Savio Fernandes",
    phone: "9822100002",
    address: "Villa 18, Colva Estate, Salcete",
    taluka: "South Goa",
    role: "customer"
  },
  {
    id: "cus_003",
    username: "9822100003",
    password: "123",
    full_name: "Anand Gaonkar",
    phone: "9822100003",
    address: "Plot 7, River Valley, Kushavati",
    taluka: "Kushavati",
    role: "customer"
  }
];

export const INITIAL_PROFESSIONALS = [
  {
    id: "wrk_001",
    username: "9822200001",
    password: "123",
    full_name: "Prakash Naik",
    phone: "9822200001",
    experience_years: 10,
    safety_cert: "Certified Master Climber (Govt. CPCRI)",
    rating_avg: 4.9,
    taluka: "North Goa",
    skills: ["svc_coconut", "svc_areca", "svc_palm"],
    status: "approved",
    role: "professional"
  },
  {
    id: "wrk_002",
    username: "9822200002",
    password: "123",
    full_name: "Santosh Kerkar",
    phone: "9822200002",
    experience_years: 8,
    safety_cert: "Advanced Rigging & Tree Safety",
    rating_avg: 4.8,
    taluka: "South Goa",
    skills: ["svc_coconut", "svc_mango", "svc_trim"],
    status: "approved",
    role: "professional"
  },
  {
    id: "wrk_003",
    username: "9822200003",
    password: "123",
    full_name: "Damodar Gaonkar",
    phone: "9822200003",
    experience_years: 6,
    safety_cert: "Rope Access & Slender Trunk Specialist",
    rating_avg: 4.7,
    taluka: "Kushavati",
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
    address: "House 42, Beach Road, Calangute",
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
    comment: "Prakash arrived on time with complete safety gear. Harvested and stacked coconuts neatly.",
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
    address: "Villa 18, Colva Estate, Salcete",
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
    comment: "Safely trimmed overhang branches away from power cables.",
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
    address: "House 42, Beach Road, Calangute",
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
    customer_id: "cus_003",
    professional_id: null,
    service_id: "svc_areca",
    tree_count: 15,
    height_category: null,
    taluka: "Kushavati",
    address: "Plot 7, River Valley, Kushavati",
    scheduled_at: "2026-10-03T09:00:00Z",
    booking_type: "standard",
    call_confirmed: false,
    status: "requested",
    base_amount: 1050.0,
    surcharge_amount: 0,
    quote_amount: 1239.0,
    actual_amount: null,
    payment_status: "paid",
    rating: null,
    comment: null,
    created_at: "2026-09-27T08:00:00Z"
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
    description: "Spotted loose electrical wire near the palm top. Kept required 3-meter safety clearance.",
    photo_url: null,
    status: "resolved",
    created_at: "2026-09-20T11:30:00Z"
  }
];
