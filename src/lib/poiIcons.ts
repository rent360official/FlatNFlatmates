export type PoiCategory =
  | 'work'
  | 'education'
  | 'gym'
  | 'shopping'
  | 'hospital'
  | 'transit'
  | 'airport'
  | 'food'
  | 'park'
  | 'landmark';

export interface PoiVisualConfig {
  category: PoiCategory;
  categoryLabel: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  iconSvg: string;
}

/**
 * Detects the category of a POI from its label, Google Places types, or existing type field.
 */
export function detectPoiCategory(
  label: string = '',
  types: string[] = [],
  type: string = ''
): PoiCategory {
  const l = label.toLowerCase();
  const t = (type || '').toLowerCase();
  const allTypes = (types || []).map((x) => x.toLowerCase());

  // 1. Gym / Fitness
  if (
    allTypes.some((x) => x.includes('gym') || x.includes('fitness') || x.includes('sports_complex')) ||
    l.includes('gym') ||
    l.includes('fitness') ||
    l.includes('cult') ||
    l.includes("gold's") ||
    l.includes('crossfit') ||
    l.includes('badminton') ||
    l.includes('swimming') ||
    l.includes('workout') ||
    t.includes('gym') ||
    t.includes('fitness')
  ) {
    return 'gym';
  }

  // 2. College / University / Education
  if (
    allTypes.some(
      (x) =>
        x.includes('university') ||
        x.includes('school') ||
        x.includes('college') ||
        x.includes('secondary_school')
    ) ||
    l.includes('college') ||
    l.includes('university') ||
    l.includes('institute') ||
    l.includes('campus') ||
    l.includes('symbiosis') ||
    l.includes('mit ') ||
    l.includes('coep') ||
    l.includes('school') ||
    l.includes('iit') ||
    l.includes('iim') ||
    t.includes('college') ||
    t.includes('university') ||
    t.includes('education')
  ) {
    return 'education';
  }

  // 3. Hospital / Medical / Clinic
  if (
    allTypes.some(
      (x) =>
        x.includes('hospital') ||
        x.includes('doctor') ||
        x.includes('pharmacy') ||
        x.includes('health')
    ) ||
    l.includes('hospital') ||
    l.includes('clinic') ||
    l.includes('care') ||
    l.includes('health') ||
    l.includes('ruby hall') ||
    l.includes('jehangir') ||
    l.includes('manipal') ||
    l.includes('apollo') ||
    t.includes('hospital') ||
    t.includes('medical')
  ) {
    return 'hospital';
  }

  // 4. Mall / Shopping
  if (
    allTypes.some(
      (x) =>
        x.includes('shopping_mall') ||
        x.includes('department_store') ||
        x.includes('supermarket')
    ) ||
    l.includes('mall') ||
    l.includes('phoenix') ||
    l.includes('seasons') ||
    l.includes('amanora') ||
    l.includes('market') ||
    l.includes('bazaar') ||
    l.includes('mart') ||
    l.includes('shopping') ||
    t.includes('mall') ||
    t.includes('shopping')
  ) {
    return 'shopping';
  }

  // 5. Airport
  if (
    allTypes.some((x) => x.includes('airport')) ||
    l.includes('airport') ||
    l.includes('aerodrome') ||
    l.includes('air force') ||
    t.includes('airport')
  ) {
    return 'airport';
  }

  // 6. Transit / Metro / Train / Railway / Bus
  if (
    allTypes.some(
      (x) =>
        x.includes('transit_station') ||
        x.includes('subway_station') ||
        x.includes('train_station') ||
        x.includes('bus_station')
    ) ||
    l.includes('metro') ||
    l.includes('station') ||
    l.includes('railway') ||
    l.includes('bus stop') ||
    l.includes('bus stand') ||
    l.includes('junction') ||
    t.includes('metro') ||
    t.includes('transit') ||
    t.includes('station')
  ) {
    return 'transit';
  }

  // 7. Park / Garden / Lake
  if (
    allTypes.some(
      (x) =>
        x.includes('park') ||
        x.includes('campground') ||
        x.includes('tourist_attraction')
    ) ||
    (l.includes('park') && !l.includes('tech') && !l.includes('it park')) ||
    l.includes('garden') ||
    l.includes('lake') ||
    l.includes('hill') ||
    l.includes('tekdi') ||
    t.includes('park') ||
    t.includes('nature')
  ) {
    return 'park';
  }

  // 8. Food / Cafe / Restaurant
  if (
    allTypes.some(
      (x) =>
        x.includes('cafe') ||
        x.includes('restaurant') ||
        x.includes('bar') ||
        x.includes('food')
    ) ||
    l.includes('cafe') ||
    l.includes('coffee') ||
    l.includes('restaurant') ||
    l.includes('starbucks') ||
    l.includes('bistro') ||
    l.includes('kitchen') ||
    t.includes('cafe') ||
    t.includes('restaurant')
  ) {
    return 'food';
  }

  // 9. Work / IT Park / Tech Park / Office / Company (Default for Tech hubs & corporate)
  if (
    l.includes('tech') ||
    l.includes('it park') ||
    l.includes('park') ||
    l.includes('cyber') ||
    l.includes('eon') ||
    l.includes('magarpatta') ||
    l.includes('hinjewadi') ||
    l.includes('infosys') ||
    l.includes('tcs') ||
    l.includes('wipro') ||
    l.includes('accenture') ||
    l.includes('cognizant') ||
    l.includes('office') ||
    l.includes('hub') ||
    l.includes('plaza') ||
    l.includes('tower') ||
    l.includes('towers') ||
    l.includes('business') ||
    l.includes('world trade center') ||
    l.includes('wtc') ||
    l.includes('quadron') ||
    l.includes('blueridge') ||
    l.includes('embassy') ||
    l.includes('sez') ||
    t.includes('work') ||
    t.includes('office') ||
    t.includes('it')
  ) {
    return 'work';
  }

  return 'work';
}

/**
 * Returns visual configuration including SVG paths and brand palette for POI circle markers.
 */
export function getPoiVisualConfig(
  poi: { label: string; types?: string[]; type?: string }
): PoiVisualConfig {
  const category = detectPoiCategory(poi.label, poi.types, poi.type);

  switch (category) {
    case 'gym':
      return {
        category: 'gym',
        categoryLabel: 'Gym / Fitness',
        bgColor: '#f43f5e', // Rose-500
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <path d="M6.5 6.5l11 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <path d="M21 21l-1-1a2 2 0 0 0-2.8 0l-.7.7a2 2 0 0 1-2.8 0l-2.2-2.2a2 2 0 0 1 0-2.8l.7-.7a2 2 0 0 0 0-2.8L12 8.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 3l1 1a2 2 0 0 0 2.8 0l.7-.7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8l-.7.7a2 2 0 0 0 0 2.8L12 15.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `,
      };

    case 'education':
      return {
        category: 'education',
        categoryLabel: 'College / Education',
        bgColor: '#f59e0b', // Amber-500
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `,
      };

    case 'shopping':
      return {
        category: 'shopping',
        categoryLabel: 'Mall / Shopping',
        bgColor: '#10b981', // Emerald-500
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 6h18" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <path d="M16 10a4 4 0 0 1-8 0" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        `,
      };

    case 'hospital':
      return {
        category: 'hospital',
        categoryLabel: 'Hospital / Medical',
        bgColor: '#ef4444', // Red-500
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <path d="M12 4v16M4 12h16" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        `,
      };

    case 'transit':
      return {
        category: 'transit',
        categoryLabel: 'Transit / Metro / Station',
        bgColor: '#0ea5e9', // Sky-500
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <rect width="16" height="15" x="4" y="3" rx="2" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 11h16M12 3v8m-4 7-2 3m10-3 2 3" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="8" cy="14" r="1" fill="#ffffff"/>
          <circle cx="16" cy="14" r="1" fill="#ffffff"/>
        `,
      };

    case 'airport':
      return {
        category: 'airport',
        categoryLabel: 'Airport',
        bgColor: '#3b82f6', // Blue-500
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" fill="#ffffff"/>
        `,
      };

    case 'food':
      return {
        category: 'food',
        categoryLabel: 'Cafe / Restaurant',
        bgColor: '#d97706', // Amber-600
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <path d="M10 2v2M14 2v2M6 2v2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <path d="M18 8a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8h15Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `,
      };

    case 'park':
      return {
        category: 'park',
        categoryLabel: 'Park / Nature',
        bgColor: '#16a34a', // Green-600
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <path d="M12 19v3" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 3a7 7 0 0 0-6 10.5 5 5 0 0 0 3.5 5.5h5a5 5 0 0 0 3.5-5.5A7 7 0 0 0 12 3z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `,
      };

    case 'work':
    default:
      return {
        category: 'work',
        categoryLabel: 'Work / Office',
        bgColor: '#6366f1', // Indigo-500
        borderColor: '#ffffff',
        iconColor: '#ffffff',
        iconSvg: `
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `,
      };
  }
}

/**
 * Builds a Google Maps Icon object rendering a crisp circular badge with a smaller themed icon
 * and an always-visible floating label displaying the first 25 characters of the POI name.
 */
export function createPoiMapMarkerIcon(poi: {
  label: string;
  types?: string[];
  type?: string;
}): any {
  if (typeof window === 'undefined' || !(window as any).google?.maps) return undefined;

  const config = getPoiVisualConfig(poi);

  // Truncate to initial 25 characters
  const rawLabel = (poi.label || '').trim();
  const displayLabel = rawLabel.length > 25 ? rawLabel.slice(0, 25) : rawLabel;
  const safeLabel = displayLabel
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const circleRadius = 15;
  const circleCenterY = 18;
  const iconScale = 0.58;
  const iconOffset = (24 * iconScale) / 2; // ~6.96px

  const pillHeight = 18;
  const pillWidth = Math.max(48, Math.min(190, displayLabel.length * 6.5 + 16));
  const pillY = circleCenterY + circleRadius + 4; // 37px

  const totalWidth = Math.max(pillWidth + 24, 76);
  const totalHeight = pillY + pillHeight + 8; // ~63px
  const centerX = totalWidth / 2;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <defs>
    <filter id="poiShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" flood-color="#0f172a" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- Always-visible Floating Name Label (Initial 25 chars) -->
  <g filter="url(#poiShadow)">
    <rect x="${centerX - pillWidth / 2}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="${centerX}" y="${pillY + 12.5}" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="9.5px" font-weight="700" fill="#1e293b" text-anchor="middle">
      ${safeLabel}
    </text>
  </g>

  <!-- Circular Badge with smaller icon -->
  <g filter="url(#poiShadow)">
    <circle cx="${centerX}" cy="${circleCenterY}" r="${circleRadius}" fill="${config.bgColor}" stroke="${config.borderColor}" stroke-width="2"/>
    <g transform="translate(${centerX - iconOffset}, ${circleCenterY - iconOffset}) scale(${iconScale})" fill="none">
      ${config.iconSvg}
    </g>
  </g>
</svg>`.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new (window as any).google.maps.Size(totalWidth, totalHeight),
    anchor: new (window as any).google.maps.Point(centerX, circleCenterY),
  };
}
