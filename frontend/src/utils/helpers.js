const NAME_TRANSLATIONS = {
  // Full names
  'savio fernandes': { hi: 'सावियो फर्नांडीस', mr: 'सावियो फर्नांडिस' },
  'savio fernandez': { hi: 'सावियो फर्नांडीस', mr: 'सावियो फर्नांडिस' },
  'rohan dessai': { hi: 'रोहन देसाई', mr: 'रोहन देसाई' },
  'rohan desai': { hi: 'रोहन देसाई', mr: 'रोहन देसाई' },
  'anand gaonkar': { hi: 'आनंद गावकर', mr: 'आनंद गावकर' },
  'prakash naik': { hi: 'प्रकाश नाईक', mr: 'प्रकाश नाईक' },
  'santosh kerkar': { hi: 'संतोष केरकर', mr: 'संतोष केरकर' },
  'damodar gaonkar': { hi: 'दामोदर गावकर', mr: 'दामोदर गावकर' },
  'rohidas naik': { hi: 'रोहिदास नाईक', mr: 'रोहिदास नाईक' },
  'suresh gaonkar': { hi: 'सुरेश गावकर', mr: 'सुरेश गावकर' },
  'admin operations': { hi: 'एडमिन ऑपरेशन्स', mr: 'अ‍ॅडमिन ऑपरेशन्स' },
  'platform admin': { hi: 'प्लेटफ़ॉर्म एडमिन', mr: 'प्लॅटफॉर्म अ‍ॅडमिन' },
  'super admin': { hi: 'सुपर एडमिन', mr: 'सुपर अ‍ॅडमिन' },
  'security admin': { hi: 'सुरक्षा एडमिन', mr: 'सुरक्षा अ‍ॅडमिन' },
  'customer': { hi: 'ग्राहक', mr: 'ग्राहक' },
  'professional': { hi: 'पेशेवर क्लाइंबर', mr: 'व्यावसायिक क्लाइंबर' },
  'user': { hi: 'उपयोगकर्ता', mr: 'वापरकर्ता' },

  // Single words (First and Last names)
  'savio': { hi: 'सावियो', mr: 'सावियो' },
  'fernandes': { hi: 'फर्नांडीस', mr: 'फर्नांडिस' },
  'fernandez': { hi: 'फर्नांडीस', mr: 'फर्नांडिस' },
  'rohan': { hi: 'रोहन', mr: 'रोहन' },
  'dessai': { hi: 'देसाई', mr: 'देसाई' },
  'desai': { hi: 'देसाई', mr: 'देसाई' },
  'anand': { hi: 'आनंद', mr: 'आनंद' },
  'gaonkar': { hi: 'गावकर', mr: 'गावकर' },
  'prakash': { hi: 'प्रकाश', mr: 'प्रकाश' },
  'naik': { hi: 'नाईक', mr: 'नाईक' },
  'santosh': { hi: 'संतोष', mr: 'संतोष' },
  'kerkar': { hi: 'केरकर', mr: 'केरकर' },
  'damodar': { hi: 'दामोदर', mr: 'दामोदर' },
  'rohidas': { hi: 'रोहिदास', mr: 'रोहिदास' },
  'suresh': { hi: 'सुरेश', mr: 'सुरेश' },
  'ramesh': { hi: 'रमेश', mr: 'रमेश' },
  'ganesh': { hi: 'गणेश', mr: 'गणेश' },
  'mahesh': { hi: 'महेश', mr: 'महेश' },
  'rajesh': { hi: 'राजेश', mr: 'राजेश' },
  'vijay': { hi: 'विजय', mr: 'विजय' },
  'vinod': { hi: 'विनोद', mr: 'विनोद' },
  'prashant': { hi: 'प्रशांत', mr: 'प्रशांत' },
  'sunil': { hi: 'सुनील', mr: 'सुनील' },
  'anil': { hi: 'अनिल', mr: 'अनिल' },
  'amit': { hi: 'अमित', mr: 'अमित' },
  'sumit': { hi: 'सुमित', mr: 'सुमित' },
  'dsouza': { hi: 'डिसूझा', mr: 'डिसूझा' },
  "d'souza": { hi: 'डिसूझा', mr: 'डिसूझा' },
  'souza': { hi: 'सोझा', mr: 'सोझा' },
  'rodrigues': { hi: 'रॉड्रिग्स', mr: 'रॉड्रिग्स' },
  'pereira': { hi: 'परेरा', mr: 'परेरा' },
  'silva': { hi: 'सिल्वा', mr: 'सिल्वा' },
  'braganza': { hi: 'ब्रागांझा', mr: 'ब्रागांझा' },
  'coutinho': { hi: 'कुटिन्हो', mr: 'कुटिन्हो' },
  'kamath': { hi: 'कामत', mr: 'कामत' },
  'prabhu': { hi: 'प्रभू', mr: 'प्रभू' },
  'shenoy': { hi: 'शेनॉय', mr: 'शेनॉय' },
  'bhat': { hi: 'भट', mr: 'भट' },
  'rane': { hi: 'राणे', mr: 'राणे' },
  'sawardekar': { hi: 'सावर्डेकर', mr: 'सावर्डेकर' },
  'shirodkar': { hi: 'शिरोडकर', mr: 'शिरोडकर' },
  'bandodkar': { hi: 'बांदोडकर', mr: 'बांदोडकर' },
  'sequeira': { hi: 'सिक्वेरा', mr: 'सिक्वेरा' },
  'cardozo': { hi: 'कार्डोजो', mr: 'कार्डोजो' },
  'gomes': { hi: 'गोम्स', mr: 'गोम्स' },
  'costa': { hi: 'कोस्टा', mr: 'कोस्टा' },
  'alvares': { hi: 'अल्वारिस', mr: 'अल्वारिस' },
  'admin': { hi: 'एडमिन', mr: 'अ‍ॅडमिन' },
  'operations': { hi: 'ऑपरेशन्स', mr: 'ऑपरेशन्स' },
  'super': { hi: 'सुपर', mr: 'सुपर' },
  'manager': { hi: 'प्रबंधक', mr: 'व्यवस्थापक' }
};

export const getDisplayName = (user, lang = null) => {
  if (!user) return 'User';

  let activeLang = lang;
  if (!activeLang && typeof window !== 'undefined') {
    try {
      activeLang = localStorage.getItem('cp_language') || 'en';
    } catch {
      activeLang = 'en';
    }
  }

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

  if (!name && !user.full_name_local && !user.name_local) {
    return activeLang === 'hi' ? 'उपयोगकर्ता' : activeLang === 'mr' ? 'वापरकर्ता' : 'User';
  }

  if (activeLang === 'hi' || activeLang === 'mr') {
    // 1. Explicit native script name stored in database
    if (user.full_name_local && typeof user.full_name_local === 'string' && user.full_name_local.trim()) {
      return user.full_name_local.trim();
    }
    if (user.name_local && typeof user.name_local === 'string' && user.name_local.trim()) {
      return user.name_local.trim();
    }

    // 2. Transliteration / Dictionary lookup
    const cleanKey = name.toLowerCase().trim();
    if (NAME_TRANSLATIONS[cleanKey]?.[activeLang]) {
      return NAME_TRANSLATIONS[cleanKey][activeLang];
    }
    const words = cleanKey.split(/\s+/);
    const translatedWords = words.map((w) => NAME_TRANSLATIONS[w]?.[activeLang] || w);
    const hasAnyTranslation = translatedWords.some((w, idx) => w !== words[idx]);
    if (hasAnyTranslation) {
      return translatedWords.join(' ');
    }
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

// Global Service Real Photographic Images
import coconutImg from '../assets/services/coconut.png';
import arecaImg from '../assets/services/areca.png';
import mangoImg from '../assets/services/mango.png';
import jackfruitImg from '../assets/services/jackfruit.jpg';
import palmImg from '../assets/services/palm.jpg';
import trimImg from '../assets/services/trim.jpg';

export const SERVICE_IMAGES = {
  svc_coconut: coconutImg,
  svc_areca: arecaImg,
  svc_mango: mangoImg,
  svc_jackfruit: jackfruitImg,
  svc_palm: palmImg,
  svc_trim: trimImg,
};

export const getServiceImage = (svc) => {
  if (!svc) return coconutImg;
  if (typeof svc === 'string') {
    if (svc.startsWith('data:image') || svc.startsWith('http')) return svc;
    if (SERVICE_IMAGES[svc]) return SERVICE_IMAGES[svc];
    const s = svc.toLowerCase();
    if (s.includes('coconut')) return coconutImg;
    if (s.includes('areca') || s.includes('supari')) return arecaImg;
    if (s.includes('mango')) return mangoImg;
    if (s.includes('jackfruit')) return jackfruitImg;
    if (s.includes('palm')) return palmImg;
    if (s.includes('trim') || s.includes('branch') || s.includes('chainsaw')) return trimImg;
    return coconutImg;
  }
  if (svc.image && typeof svc.image === 'string') return svc.image;
  if (svc.image_url && typeof svc.image_url === 'string') return svc.image_url;
  if (svc.icon && (svc.icon.startsWith('data:image') || svc.icon.startsWith('http'))) return svc.icon;
  const id = svc.id || svc.serviceId || svc.service_id || '';
  if (SERVICE_IMAGES[id]) return SERVICE_IMAGES[id];
  const name = (svc.name || svc.serviceName || svc.service_name || svc.title || '').toLowerCase();
  if (name.includes('coconut')) return coconutImg;
  if (name.includes('areca') || name.includes('supari')) return arecaImg;
  if (name.includes('mango')) return mangoImg;
  if (name.includes('jackfruit')) return jackfruitImg;
  if (name.includes('palm')) return palmImg;
  if (name.includes('trim') || name.includes('branch') || name.includes('chainsaw')) return trimImg;
  return coconutImg;
};

/**
 * Compresses an image file to a lightweight data URL (<50KB) to prevent localStorage quota overflow.
 */
export const compressImageFile = (file, maxWidth = 500, maxHeight = 500, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

