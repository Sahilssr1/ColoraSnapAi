export interface ThemeColors {
  background: string;
  card: string;
  cardElevated: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  separator: string;
  pillBackground: string;
  pillActive: string;
  pillActiveText: string;
  headerGlow: [string, string, string];
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  glassCard: string;
  glassBorder: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  buttonPrimaryText: string;
  primary: string;
  secondary: string;
}

export const AppleHealthThemes: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: '#F9FAFB', // ⚪ Light Theme (#F9FAFB)
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardBorder: 'rgba(17, 24, 39, 0.06)',
    textPrimary: '#111827', // ⚫ Dark Text (#111827)
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    separator: '#E5E7EB',
    pillBackground: '#E5E7EB',
    pillActive: '#22C55E', // 🟢 Primary Green
    pillActiveText: '#FFFFFF',
    headerGlow: ['rgba(34, 197, 94, 0.25)', 'rgba(249, 115, 22, 0.15)', 'rgba(249, 250, 251, 0)'],
    tabBarBackground: 'rgba(255, 255, 255, 0.94)',
    tabBarBorder: 'rgba(17, 24, 39, 0.08)',
    tabBarActive: '#22C55E', // 🟢 Primary
    tabBarInactive: '#9CA3AF',
    glassCard: 'rgba(255, 255, 255, 0.92)',
    glassBorder: 'rgba(17, 24, 39, 0.06)',
    inputBackground: '#F3F4F6',
    inputBorder: 'rgba(17, 24, 39, 0.10)',
    inputText: '#111827',
    buttonPrimaryText: '#FFFFFF',
    primary: '#22C55E', // 🟢 Primary
    secondary: '#F97316', // 🟠 Secondary
  },
  dark: {
    background: '#111827', // ⚫ Dark Theme (#111827)
    card: '#1F2937', // Slate-800 Card on Dark
    cardElevated: '#374151',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F9FAFB', // ⚪ Light Text (#F9FAFB)
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    separator: '#374151',
    pillBackground: '#1F2937',
    pillActive: '#22C55E', // 🟢 Primary Green
    pillActiveText: '#FFFFFF',
    headerGlow: ['rgba(34, 197, 94, 0.22)', 'rgba(249, 115, 22, 0.14)', 'rgba(17, 24, 39, 0)'],
    tabBarBackground: 'rgba(17, 24, 39, 0.95)',
    tabBarBorder: 'rgba(255, 255, 255, 0.10)',
    tabBarActive: '#22C55E', // 🟢 Primary
    tabBarInactive: '#6B7280',
    glassCard: 'rgba(31, 41, 55, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    inputBackground: '#1F2937',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputText: '#F9FAFB',
    buttonPrimaryText: '#FFFFFF',
    primary: '#22C55E', // 🟢 Primary
    secondary: '#F97316', // 🟠 Secondary
  },
};

export const Colors = {
  ...AppleHealthThemes,
  brand: {
    primary: '#22C55E', // 🟢 Green
    primaryGradient: ['#22C55E', '#16A34A'],
    secondary: '#F97316', // 🟠 Orange
    secondaryGradient: ['#F97316', '#EA580C'],
    dark: '#111827', // ⚫ Dark
    light: '#F9FAFB', // ⚪ Light
    accent: '#22C55E',
    gold: '#FBBF24',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F97316',
  },
  macros: {
    calories: '#F97316', // 🟠 Secondary Orange for calories
    caloriesGradient: ['#F97316', '#EA580C'],
    protein: '#22C55E', // 🟢 Primary Green for protein
    proteinGradient: ['#22C55E', '#16A34A'],
    carbs: '#EAB308', // Amber/Yellow for carbs
    carbsGradient: ['#EAB308', '#CA8A04'],
    fat: '#A855F7', // Purple for fats
    fatGradient: ['#A855F7', '#9333EA'],
    water: '#06B6D4', // Cyan/Blue for hydration
    waterGradient: ['#06B6D4', '#0891B2'],
  },
  categories: {
    activity: '#F97316',
    body: '#22C55E',
    hearing: '#A855F7',
    heart: '#EF4444',
    medications: '#06B6D4',
    mental: '#8B5CF6',
    mobility: '#F97316',
    nutrition: '#22C55E',
    respiratory: '#06B6D4',
    sleep: '#6366F1',
  },
};
