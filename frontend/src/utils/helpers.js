export const getDisplayName = (user) => {
  if (!user) return 'User';
  let name = user.full_name || user.name || user.username || '';
  if (typeof name === 'string' && name.includes('@')) {
    const prefix = name.split('@')[0];
    name = prefix
      .replace(/[._]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  } else if (typeof name === 'string' && name.trim()) {
    name = name
      .trim()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return name || 'User';
};

export const normalizeTaluka = (taluka) => {
  if (!taluka || typeof taluka !== 'string') return 'North Goa';
  const clean = taluka.trim();
  const VALID_TALUKAS = ['North Goa', 'South Goa', 'Kushavati'];
  if (VALID_TALUKAS.includes(clean)) return clean;
  const lower = clean.toLowerCase();
  if (lower.includes('south') || ['salcete', 'mormugao', 'quepem', 'sanguem', 'canacona'].some((x) => lower.includes(x))) {
    return 'South Goa';
  }
  if (lower.includes('central') || lower.includes('kushavati') || ['tiswadi', 'ponda'].some((x) => lower.includes(x))) {
    return 'Kushavati';
  }
  return 'North Goa';
};

const DAY_NAME_TO_INDEX = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

export const getTalukaDayConfig = (talukaName, bookingType = 'standard', customScheduling = null) => {
  if (bookingType === 'urgent') {
    return {
      allowedIndices: [1, 2, 3, 4, 5, 6], // Mon, Tue, Wed, Thu, Fri, Sat (All days except Sunday 0)
      dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      description: 'Monday to Saturday (All days except Sunday)'
    };
  }

  let sched = customScheduling;
  if (!sched) {
    try {
      const saved = localStorage.getItem('coconut_plucker_state_v6_scheduling');
      if (saved) sched = JSON.parse(saved);
    } catch {}
  }

  const clean = (talukaName || '').toLowerCase();
  let days = [];

  if (clean.includes('north')) {
    days = sched?.northDays || ['Monday', 'Tuesday', 'Wednesday'];
  } else if (clean.includes('kushavati')) {
    days = sched?.kushavatiDays || ['Saturday'];
  } else {
    // South Goa
    days = sched?.southDays || ['Thursday', 'Friday'];
  }

  const allowedIndices = days
    .map((d) => DAY_NAME_TO_INDEX[d])
    .filter((idx) => typeof idx === 'number');

  return {
    allowedIndices: allowedIndices.length > 0 ? allowedIndices : [4, 5],
    dayNames: days,
    description: days.join(', ')
  };
};

export const formatScheduledDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
  const formatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatted} (${dayName})`;
};
