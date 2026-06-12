/* NAGIMU — zodiac data, element physics, constellation layouts */

export const ZODIACS = {
  aries: {
    glyph: '♈',
    name: 'Aries',
    element: 'fire',
    color: '#D85A30',
    bg: 'rgba(216,90,48,0.14)',
    constellation: [
      [0.38, 0.42], [0.52, 0.35], [0.64, 0.48], [0.58, 0.62], [0.44, 0.58],
    ],
  },
  taurus: {
    glyph: '♉',
    name: 'Taurus',
    element: 'earth',
    color: '#1D9E75',
    bg: 'rgba(29,158,117,0.14)',
    constellation: [
      [0.32, 0.44], [0.48, 0.38], [0.68, 0.44], [0.62, 0.58], [0.48, 0.64], [0.36, 0.56],
    ],
  },
  gemini: {
    glyph: '♊',
    name: 'Gemini',
    element: 'air',
    color: '#378ADD',
    bg: 'rgba(55,138,221,0.14)',
    constellation: [
      [0.36, 0.34], [0.36, 0.66], [0.64, 0.34], [0.64, 0.66], [0.50, 0.50],
    ],
  },
  cancer: {
    glyph: '♋',
    name: 'Cancer',
    element: 'water',
    color: '#7F77DD',
    bg: 'rgba(127,119,221,0.14)',
    constellation: [
      [0.30, 0.50], [0.42, 0.38], [0.58, 0.38], [0.70, 0.50], [0.58, 0.62], [0.42, 0.62],
    ],
  },
  leo: {
    glyph: '♌',
    name: 'Leo',
    element: 'fire',
    color: '#D85A30',
    bg: 'rgba(216,90,48,0.14)',
    constellation: [
      [0.34, 0.52], [0.44, 0.36], [0.56, 0.34], [0.66, 0.44], [0.62, 0.58], [0.48, 0.66], [0.38, 0.60],
    ],
  },
  virgo: {
    glyph: '♍',
    name: 'Virgo',
    element: 'earth',
    color: '#1D9E75',
    bg: 'rgba(29,158,117,0.14)',
    constellation: [
      [0.40, 0.32], [0.52, 0.40], [0.64, 0.36], [0.58, 0.52], [0.46, 0.64], [0.36, 0.54],
    ],
  },
  libra: {
    glyph: '♎',
    name: 'Libra',
    element: 'air',
    color: '#378ADD',
    bg: 'rgba(55,138,221,0.14)',
    constellation: [
      [0.28, 0.48], [0.72, 0.48], [0.50, 0.48], [0.38, 0.62], [0.62, 0.62],
    ],
  },
  scorpio: {
    glyph: '♏',
    name: 'Scorpio',
    element: 'water',
    color: '#7F77DD',
    bg: 'rgba(127,119,221,0.14)',
    constellation: [
      [0.28, 0.54], [0.38, 0.44], [0.50, 0.40], [0.60, 0.46], [0.68, 0.56], [0.74, 0.66], [0.66, 0.72],
    ],
  },
  sagittarius: {
    glyph: '♐',
    name: 'Sagittarius',
    element: 'fire',
    color: '#D85A30',
    bg: 'rgba(216,90,48,0.14)',
    constellation: [
      [0.34, 0.66], [0.44, 0.54], [0.54, 0.44], [0.64, 0.36], [0.72, 0.30],
    ],
  },
  capricorn: {
    glyph: '♑',
    name: 'Capricorn',
    element: 'earth',
    color: '#1D9E75',
    bg: 'rgba(29,158,117,0.14)',
    constellation: [
      [0.30, 0.58], [0.42, 0.48], [0.54, 0.42], [0.64, 0.48], [0.70, 0.60], [0.58, 0.66],
    ],
  },
  aquarius: {
    glyph: '♒',
    name: 'Aquarius',
    element: 'air',
    color: '#378ADD',
    bg: 'rgba(55,138,221,0.14)',
    constellation: [
      [0.30, 0.40], [0.42, 0.36], [0.54, 0.42], [0.66, 0.38], [0.70, 0.52], [0.58, 0.58], [0.42, 0.54],
    ],
  },
  pisces: {
    glyph: '♓',
    name: 'Pisces',
    element: 'water',
    color: '#7F77DD',
    bg: 'rgba(127,119,221,0.14)',
    constellation: [
      [0.32, 0.44], [0.40, 0.56], [0.50, 0.50], [0.60, 0.56], [0.68, 0.44], [0.50, 0.38],
    ],
  },
};

export const ELEMENT_PHYSICS = {
  fire: {
    speed: { min: 0.6, max: 1.1 },
    wobble: 0.06,
    pullStrength: 0.0,
    color: '#D85A30',
    description: 'Orbs burst and chase — reactive, intense',
  },
  earth: {
    speed: { min: 0.15, max: 0.35 },
    wobble: 0.01,
    pullStrength: 0.012,
    color: '#1D9E75',
    description: 'Orbs drift slowly and hold position',
  },
  air: {
    speed: { min: 0.4, max: 0.9 },
    wobble: 0.09,
    pullStrength: 0.0,
    color: '#378ADD',
    description: 'Orbs scatter and need coaxing',
  },
  water: {
    speed: { min: 0.2, max: 0.5 },
    wobble: 0.02,
    pullStrength: 0.018,
    color: '#7F77DD',
    description: 'Orbs drift in silence, pulling toward each other',
  },
};

export const ZODIAC_KEYS = Object.keys(ZODIACS);

export function getElementForSign(sign) {
  return ZODIACS[sign]?.element ?? 'water';
}

export function applyElementTheme(sign) {
  const zodiac = ZODIACS[sign];
  if (!zodiac) return;
  const root = document.documentElement;
  root.style.setProperty('--element-color', zodiac.color);
  root.style.setProperty('--element-bg', zodiac.bg);
}