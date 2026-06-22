/**
 * Design Tokens - Consistent spacing, colors, and typography
 * Used across the entire admin dashboard
 */

export const designTokens = {
  // Spacing Scale (8px base)
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },

  // Typography
  typography: {
    h1: {
      fontSize: '2.25rem', // 36px
      fontWeight: '700',
      lineHeight: '2.5rem',
    },
    h2: {
      fontSize: '1.875rem', // 30px
      fontWeight: '700',
      lineHeight: '2.25rem',
    },
    h3: {
      fontSize: '1.5rem', // 24px
      fontWeight: '600',
      lineHeight: '2rem',
    },
    h4: {
      fontSize: '1.25rem', // 20px
      fontWeight: '600',
      lineHeight: '1.75rem',
    },
    body: {
      fontSize: '1rem', // 16px
      fontWeight: '400',
      lineHeight: '1.5rem',
    },
    caption: {
      fontSize: '0.875rem', // 14px
      fontWeight: '400',
      lineHeight: '1.25rem',
    },
    small: {
      fontSize: '0.75rem', // 12px
      fontWeight: '400',
      lineHeight: '1rem',
    },
  },

  // Colors - FemVents Brand
  colors: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#6B5B9A', // Brand purple
      700: '#5B4B8A',
      800: '#4c3d7a',
      900: '#3d2f5f',
    },
    secondary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#C9507B', // Brand rose/magenta
      600: '#B4406C',
      700: '#9d3459',
      800: '#7e2948',
      900: '#65203a',
    },
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#F08070', // Brand coral
      600: '#E87461',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Z-index layers
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },
};

export default designTokens;
