// Shared FemVents Theme Configuration
// This file contains the canonical brand colors and theme settings
// used across all KUZA projects

export const FEMVENTS_THEME = {
  // Brand Colors - DO NOT CHANGE without updating all projects
  colors: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#6B5B9A', // Main brand purple
      700: '#5B4B8A', // Dark purple
      800: '#4c3d7a',
      900: '#3d2f5f',
      DEFAULT: '#6B5B9A'
    },
    secondary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#C9507B', // Main brand rose/magenta
      600: '#B4406C', // Dark rose
      700: '#9d3459',
      800: '#7e2948',
      900: '#65203a',
      DEFAULT: '#C9507B'
    },
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#F08070', // Main brand coral
      600: '#E87461', // Dark coral
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      DEFAULT: '#F08070'
    }
  },
  
  // CSS Variables for use in globals.css
  cssVariables: {
    '--primary-purple': '#6B5B9A',
    '--primary-purple-dark': '#5B4B8A',
    '--secondary-rose': '#C9507B',
    '--secondary-rose-dark': '#B4406C',
    '--accent-coral': '#F08070',
    '--accent-coral-dark': '#E87461'
  },
  
  // Tailwind CSS v3 config format
  tailwindV3Config: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#6B5B9A',
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
      500: '#C9507B',
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
      500: '#F08070',
      600: '#E87461',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
  }
};

export default FEMVENTS_THEME;