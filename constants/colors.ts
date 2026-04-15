// export const Colors = {
//   // Primary brand colors
//   primary: '#FF6B6B', 
//   primaryLight: '#FF9999',
//   primaryDark: '#FF5252',
//   primaryGradient: ['#FF6B6B', '#FF8E53'],
  
//   // Secondary/Accent colors
//   secondary: '#4ECDC4', 
//   secondaryLight: '#7BD9D2',
//   secondaryDark: '#3DB8AF',
//   secondaryGradient: ['#4ECDC4', '#44A08D'],
  
//   // Neutral palette
//   background: '#F8FAFC', 
//   surface: '#FFFFFF',
//   card: '#FFFFFF',
  
//   // Text colors
//   text: '#1A202C', 
//   textSecondary: '#718096',
//   textTertiary: '#A0AEC0',
//   textLight: '#FFFFFF',
  
//   // Status colors
//   success: '#48BB78', 
//   successLight: '#C6F6D5',
//   error: '#F56565', 
//   errorLight: '#FED7D7',
//   warning: '#ECC94B', 
//   warningLight: '#FEFCBF',
//   info: '#4299E1',
//   infoLight: '#BEE3F8',
  
//   // UI Elements
//   border: '#E2E8F0', 
//   divider: '#EDF2F7',
//   shadow: 'rgba(0, 0, 0, 0.08)',
//   overlay: 'rgba(0, 0, 0, 0.5)',
  
//   // Grayscale
//   gray50: '#F7FAFC',
//   gray100: '#EDF2F7',
//   gray200: '#E2E8F0',
//   gray300: '#CBD5E0',
//   gray400: '#A0AEC0',
//   gray500: '#718096',
//   gray600: '#4A5568',
//   gray700: '#2D3748',
//   gray800: '#1A202C',
//   gray900: '#171923',
  
//   // Legacy colors
//   white: '#FFFFFF',
//   black: '#000000',
//   gray: '#CBD5E0',
// };

export const Colors = {
  // Primary brand colors - Premium deep tones
  primary: '#2D3E50',      // Sophisticated navy/charcoal - elegant and timeless
  primaryLight: '#4A627A', // Lighter version for gradients
  primaryDark: '#1A2C3C',  // Darker for depth
  primaryGradient: ['#2D3E50', '#1A2C3C'],
  // primaryLight: '#e8eaf6', 
  
  // Secondary/Accent colors - Luxurious gold/bronze tones
  secondary: '#C6A43B',    // Warm gold - adds premium feel
  secondaryLight: '#D4B86A',
  secondaryDark: '#B38F2C',
  secondaryGradient: ['#C6A43B', '#B38F2C'],
  
  // Neutral palette - Clean and sophisticated
  background: '#FFFFFF',    // Pure white for clean backdrop
  surface: '#F8F9FA',      // Soft off-white for cards
  card: '#FFFFFF',
  
  // Text colors - Rich and readable
  text: '#1A2C3C',         // Deep navy for primary text
  textSecondary: '#5A6E7E', // Soft gray-blue
  textTertiary: '#8A9AAC',  // Lighter gray-blue
  textLight: '#FFFFFF',
  
  // Status colors - Refined and muted
  success: '#2E7D64',      // Deep teal
  successLight: '#E6F4F0',
  error: '#B54747',        // Muted red
  errorLight: '#FDEDED',
  warning: '#C6A43B',      // Same as secondary for consistency
  warningLight: '#FDF5E6',
  info: '#5A6E7E',         // Muted blue-gray
  infoLight: '#EFF2F5',
  
  // UI Elements - Subtle and elegant
  border: '#E8EDF2',       // Soft border color
  divider: '#F0F3F7',
  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  
  // Grayscale - Sophisticated neutral tones
  gray50: '#F8F9FA',
  gray100: '#F0F3F7',
  gray200: '#E8EDF2',
  gray300: '#DCE3E9',
  gray400: '#B7C3CD',
  gray500: '#8A9AAC',
  gray600: '#5A6E7E',
  gray700: '#3A4C5E',
  gray800: '#2D3E50',
  gray900: '#1A2C3C',
  
  // Legacy colors
  white: '#FFFFFF',
  black: '#1A2C3C',
  gray: '#E8EDF2',

  // card: '#FFFFFF',
  icon: '#8E8E93',
  placeholder: '#C6C6C8',
  disabled: '#E5E5EA',
};


// export const Colors = {
//   // ─────────────────────────────────────────
//   // Primary brand colors — Premium deep navy
//   // ─────────────────────────────────────────
//   primary: '#2D3E50',         // Sophisticated navy — elegant and timeless
//   primaryLight: '#4A627A',    // Lighter navy for hover / gradient starts
//   primaryDark: '#1A2C3C',     // Deep navy for hero backgrounds & headers
//   primaryGradient: ['#2D3E50', '#1A2C3C'] as const,

//   // ─────────────────────────────────────────
//   // Secondary / Accent — Luxurious gold
//   // ─────────────────────────────────────────
//   secondary: '#C6A43B',       // Warm gold — premium accent (use sparingly, 10–15% of screen)
//   secondaryLight: '#D4B86A',  // Soft gold for backgrounds / tags
//   secondaryDark: '#B38F2C',   // Deep gold for pressed states / borders
//   secondaryGradient: ['#C6A43B', '#B38F2C'] as const,

//   // ─────────────────────────────────────────
//   // Neutral surfaces
//   // ─────────────────────────────────────────
//   background: '#FFFFFF',      // Pure white — primary screen background
//   surface: '#F8F9FA',         // Soft off-white — page / list backgrounds
//   card: '#FFFFFF',            // Card surface (white over surface creates subtle depth)

//   // ─────────────────────────────────────────
//   // Text colors
//   // ─────────────────────────────────────────
//   text: '#1A2C3C',            // Deep navy — primary text
//   textSecondary: '#5A6E7E',   // Soft gray-blue — subtitles, meta
//   textTertiary: '#8A9AAC',    // Lighter gray-blue — hints, placeholders
//   textLight: '#FFFFFF',       // White — text on dark backgrounds

//   // ─────────────────────────────────────────
//   // Status colors — Refined & muted
//   // ─────────────────────────────────────────
//   success: '#2E7D64',         // Deep teal green
//   successLight: '#E6F4F0',    // Teal tint for success backgrounds
//   error: '#B54747',           // Muted red
//   errorLight: '#FDEDED',      // Red tint for error backgrounds
//   warning: '#C6A43B',         // Matches gold secondary for consistency
//   warningLight: '#FDF5E6',    // Gold tint for warning backgrounds
//   info: '#5A6E7E',            // Muted blue-gray
//   infoLight: '#EFF2F5',       // Light blue-gray tint

//   // ─────────────────────────────────────────
//   // UI element colors
//   // ─────────────────────────────────────────
//   border: '#E8EDF2',          // Subtle border — default strokes
//   divider: '#F0F3F7',         // Ultra-light divider between list items
//   shadow: 'rgba(0, 0, 0, 0.06)',    // Soft shadow for cards
//   shadowMd: 'rgba(0, 0, 0, 0.10)', // Medium shadow for elevated cards
//   overlay: 'rgba(0, 0, 0, 0.40)',  // Modal / bottom-sheet scrim

//   // ─────────────────────────────────────────
//   // Grayscale — Sophisticated neutral scale
//   // ─────────────────────────────────────────
//   gray50: '#F8F9FA',
//   gray100: '#F0F3F7',
//   gray200: '#E8EDF2',
//   gray300: '#DCE3E9',
//   gray400: '#B7C3CD',
//   gray500: '#8A9AAC',
//   gray600: '#5A6E7E',
//   gray700: '#3A4C5E',
//   gray800: '#2D3E50',
//   gray900: '#1A2C3C',

//   // ─────────────────────────────────────────
//   // Legacy / utility aliases
//   // ─────────────────────────────────────────
//   white: '#FFFFFF',
//   black: '#1A2C3C',           // Soft black — mapped to deep navy, not pure #000
//   gray: '#E8EDF2',            // Default gray alias → border tone
// } as const;

// export type ColorKey = keyof typeof Colors;
// export type ColorValue = (typeof Colors)[ColorKey];

// // ─────────────────────────────────────────────────────────────────────────────
// // Semantic tokens — map intent to palette
// // Use these in components instead of raw Colors values for easy theming.
// // ─────────────────────────────────────────────────────────────────────────────
// export const Tokens = {
//   // Backgrounds
//   screenBg: Colors.background,
//   pageBg: Colors.surface,
//   cardBg: Colors.card,
//   heroBg: Colors.primaryDark,        // Dark navy — premium headers & card screens

//   // Text
//   textPrimary: Colors.text,
//   textMuted: Colors.textSecondary,
//   textHint: Colors.textTertiary,
//   textOnDark: Colors.textLight,
//   textOnGold: Colors.primaryDark,    // Dark text on gold buttons/badges

//   // Interactive
//   ctaPrimary: Colors.secondary,      // Gold CTA button background
//   ctaSecondary: Colors.primary,      // Navy secondary button background
//   ctaDestructive: Colors.error,

//   // Accents
//   accentGold: Colors.secondary,
//   accentNavy: Colors.primary,

//   // Borders & dividers
//   borderDefault: Colors.border,
//   borderSubtle: Colors.divider,
//   borderFocus: Colors.primaryLight,

//   // Status
//   statusSuccess: Colors.success,
//   statusSuccessBg: Colors.successLight,
//   statusError: Colors.error,
//   statusErrorBg: Colors.errorLight,
//   statusWarning: Colors.warning,
//   statusWarningBg: Colors.warningLight,
//   statusInfo: Colors.info,
//   statusInfoBg: Colors.infoLight,

//   // Shadows (use with StyleSheet shadow props or boxShadow)
//   shadowSm: Colors.shadow,
//   shadowMd: Colors.shadowMd,
// } as const;

// // ─────────────────────────────────────────────────────────────────────────────
// // Gradient helpers
// // Pass these directly to <LinearGradient colors={...} />
// // ─────────────────────────────────────────────────────────────────────────────
// export const Gradients = {
//   navyDeep: ['#2D3E50', '#1A2C3C'] as const,   // Hero headers, card backs
//   goldWarm: ['#C6A43B', '#B38F2C'] as const,   // Gold CTAs, reward badges
//   navyToSlate: ['#1A2C3C', '#2D3E50', '#4A627A'] as const, // Full-screen dark bg
//   subtleCard: ['#FFFFFF', '#F8F9FA'] as const, // White card fade for depth
// } as const;