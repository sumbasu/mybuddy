import { FONTS } from './theme';

// Type scale from the Sweatbud font review — one definition per role, reused
// across screens so headings/titles/captions stay consistent app-wide.
// Spread into a Text style alongside a color, e.g.
// { ...TYPE_SCALE.sectionHeading, color: C.heading }
export const TYPE_SCALE = {
  largeTitle:     { fontFamily: FONTS.bold,     fontSize: 30 },
  screenHeading:  { fontFamily: FONTS.bold,     fontSize: 22 },
  sectionHeading: { fontFamily: FONTS.semiBold, fontSize: 20 },
  cardTitle:      { fontFamily: FONTS.semiBold, fontSize: 17 },
  body:           { fontFamily: FONTS.regular,  fontSize: 15 },
  secondary:      { fontFamily: FONTS.regular,  fontSize: 13 },
  caption:        { fontFamily: FONTS.regular,  fontSize: 12 },
};

// Caps how far chip/tab-bar labels scale under iOS/Android "Larger Text"
// accessibility settings, so a user's system font size can't break a
// fixed-width pill or tab bar layout.
export const MAX_FONT_SCALE_TIGHT = 1.4;
