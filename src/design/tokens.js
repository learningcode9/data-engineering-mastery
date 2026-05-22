export const colors = {
  brand: {
    primary: '#245a55',
    primaryHover: '#1f4d49',
    accent: '#6f8556',
  },
  surface: {
    page: '#eef3f0',
    card: '#ffffffeb',
    solid: '#ffffff',
    soft: '#f7faf8',
  },
  text: {
    heading: '#172421',
    body: '#31413e',
    muted: '#687a76',
    inverse: '#ffffff',
  },
  border: {
    default: '#dfe8e3',
    card: '#dbe6e0e0',
  },
  semantic: {
    success: '#2f756e',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
    accent: '#6b7cdb',
    muted: '#687a76',
  },
};

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '40px',
  8: '48px',
};

export const typography = {
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  heading: {
    page: 'clamp(24px, 3vw, 32px)',
    section: '22px',
    card: '16px',
  },
  body: {
    md: '14px',
    sm: '12.5px',
    xs: '11px',
  },
  weight: {
    regular: 400,
    medium: 600,
    bold: 800,
    black: 900,
  },
};

export const radius = {
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  pill: '999px',
};

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  lg: '0 12px 32px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
};

export const motion = {
  duration: {
    fast: '140ms',
    base: '220ms',
    slow: '380ms',
  },
  easing: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const zIndex = {
  base: 1,
  sticky: 20,
  dropdown: 80,
  overlay: 400,
  modal: 1000,
  fab: 1100,
};

export const breakpoints = {
  mobile: 640,
  tablet: 900,
  desktop: 1200,
  wide: 1440,
};

export const gridPresets = {
  cards: 'repeat(auto-fit, minmax(240px, 1fr))',
  metrics: 'repeat(auto-fit, minmax(160px, 1fr))',
  twoColumn: 'minmax(0, 1fr) minmax(280px, 360px)',
};

export const semanticVariants = {
  success: { color: colors.semantic.success },
  warning: { color: colors.semantic.warning },
  danger: { color: colors.semantic.danger },
  info: { color: colors.semantic.info },
  accent: { color: colors.semantic.accent },
  muted: { color: colors.semantic.muted },
};

export const designTokens = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  motion,
  zIndex,
  breakpoints,
  gridPresets,
  semanticVariants,
};

export default designTokens;
