export const INITIAL_SERVICES = [
  {
    id: "svc_coconut",
    name: "Coconut Plucking",
    icon: "🥥",
    unit: "per tree",
    base_rate: 90.0,
    requires_height_category: false,
    risk: "high",
    desc: "Plucking mature coconuts and cleaning the tree top.",
    status: "active"
  },
  {
    id: "svc_areca",
    name: "Supari Plucking",
    icon: "🌰",
    unit: "per tree",
    base_rate: 70.0,
    requires_height_category: false,
    risk: "high",
    desc: "Climbing slender trees to cut ripe supari bunches.",
    status: "active"
  },
  {
    id: "svc_mango",
    name: "Mango Plucking",
    icon: "🥭",
    unit: "per tree",
    base_rate: 120.0,
    requires_height_category: false,
    risk: "high",
    desc: "Gentle mango picking from branches without damaging fruits.",
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
    desc: "Cutting and lowering heavy jackfruits safely using ropes.",
    status: "active"
  },
  {
    id: "svc_palm",
    name: "Palm Leaf Cutting & Cleaning",
    icon: "🌿",
    unit: "per tree",
    base_rate: 150.0,
    requires_height_category: false,
    risk: "high",
    desc: "Cutting dry palm leaves and cleaning the crown.",
    status: "active"
  },
  {
    id: "svc_trim",
    name: "Tree Branch Cutting",
    icon: "✂️",
    unit: "per tree",
    base_rate: 350.0,
    requires_height_category: true, // Only Tree Branch Cutting requires Height Category / Chainsaw Work
    risk: "high",
    desc: "Cutting big branches near roofs, walls, and electric wires with chainsaw.",
    status: "active"
  }
];

export const INITIAL_CUSTOMERS = [];

export const INITIAL_PROFESSIONALS = [];

export const INITIAL_BOOKINGS = [];

export const INITIAL_INCIDENTS = [];
