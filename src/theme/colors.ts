// theme/colors.ts
export const colors = {
  // Raw palette (only this file may reference these directly)
  porcelain: '#FAF9F6',
  skyBlueLight: '#95C8D8',
  pacificCyan: '#5097A4',
  blueSpruce: '#097969',
  dustyGrape: '#4D516D',
  black: '#000000',

  // Semantic tokens — everything else in the app uses these
  background: {
    base: '#FAF9F6',        // porcelain — page background
    surface: '#FFFFFF',      // cards/panels sitting on base (keep near-white for contrast against porcelain)
    subtle: '#95C8D8',       // tinted section backgrounds, soft highlight blocks — use at low opacity (10-20%) rather than full strength for large areas
  },
  brand: {
    primary: '#097969',      // blue spruce — primary CTA, links, key accents
    primaryHover: '#0B8A78', // slightly lighter shade for hover/active
    secondary: '#4D516D',    // dusty grape — secondary CTA, contrast accents
    secondaryHover: '#5C6180',
    tertiary: '#5097A4',     // pacific cyan — tertiary accents, badges, icons
  },
  text: {
    primary: '#000000',      // headings, body copy
    secondary: '#4D516D',    // muted/secondary text — dusty grape reads as a soft charcoal-navy, good for de-emphasized text
    onDark: '#FAF9F6',       // text placed on primary/secondary/black backgrounds
  },
  status: {
    success: '#097969',      // reuse blue spruce for "match %", positive states — it already reads as green/positive
    successBg: '#95C8D8',    // background for success badges/pills, at reduced opacity
  },
  border: {
    default: 'rgba(0,0,0,0.1)',
    subtle: 'rgba(77,81,109,0.2)', // dusty grape at low opacity, for hairlines
  },
} as const;
