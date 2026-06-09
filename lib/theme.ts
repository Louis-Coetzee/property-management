/**
 * Centralized Theme Configuration
 */

export const theme = {
  colors: {
    primary: {
      DEFAULT: '#0e9627',
      50: '#e6f7ea',
      100: '#c0eaca',
      200: '#99dca9',
      300: '#72ce88',
      400: '#4bc067',
      500: '#0e9627',
      600: '#0c8522',
      700: '#0a741e',
      800: '#086319',
      900: '#065214',
    },
    secondary: {
      DEFAULT: '#2563EB',
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2563EB',
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#1e3a8a',
    },
    accent: {
      DEFAULT: '#10b981',
      50: '#d1fae5',
      100: '#a7f3d0',
      200: '#6ee7b7',
      300: '#34d399',
      400: '#10b981',
      500: '#059669',
      600: '#047857',
      700: '#065f46',
      800: '#064e3b',
      900: '#064e3b',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  gradients: {
    primary: 'from-primary-500 to-primary-700',
    secondary: 'from-secondary-500 to-secondary-700',
    brand: 'from-primary-600 to-secondary-600',
    background: 'from-slate-50 via-blue-50 to-primary-50',
    header: 'from-primary-50 to-secondary-50',
    headerText: 'from-primary-600 to-secondary-600',
  },
  email: {
    primary: '#918f8e',
    primaryLight: '#e5e7eb',
    primaryDark: '#918f8e',
    secondary: '#918f8e',
    secondaryLight: '#f3f4f6',
    secondaryDark: '#918f8e',
    accent: '#059669',
    success: '#059669',
    warning: '#f59e0b',
    error: '#dc2626',
    background: '#ffffff',
    text: {
      primary: '#918f8e',
      secondary: '#6b7280',
      white: '#ffffff',
    },
    border: '#e5e7eb',
    boxBackground: '#f9fafb',
    boxBackgroundAlt: '#ffffff',
  },
};

export const colors = theme.colors;
export const gradients = theme.gradients;
export const emailColors = theme.email;

export function getColor(colorPath: string): string {
  const paths = colorPath.split('.');
  let value: any = theme.colors;
  for (const path of paths) {
    if (value && typeof value === 'object') {
      value = value[path];
    }
  }
  return typeof value === 'string' ? value : theme.colors.primary.DEFAULT;
}

export function getGradientClass(type: keyof typeof theme.gradients): string {
  return `bg-gradient-to-r ${theme.gradients[type]}`;
}

export function getEmailGradient(from: string, to: string): string {
  return `linear-gradient(to right, ${from}, ${to})`;
}

export default theme;
