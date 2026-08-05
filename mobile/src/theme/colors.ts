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
}

export const AppleHealthThemes: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: '#F2F2F7', // Apple iOS system grouped background
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    cardBorder: 'rgba(0, 0, 0, 0.04)',
    textPrimary: '#000000',
    textSecondary: '#636366',
    textMuted: '#8E8E93',
    separator: '#E5E5EA',
    pillBackground: '#E5E5EA',
    pillActive: '#FFFFFF',
    pillActiveText: '#000000',
    headerGlow: ['rgba(255, 149, 128, 0.35)', 'rgba(255, 204, 153, 0.20)', 'rgba(242, 242, 247, 0)'],
    tabBarBackground: 'rgba(255, 255, 255, 0.88)',
    tabBarBorder: 'rgba(0, 0, 0, 0.08)',
    tabBarActive: '#FF3B30',
    tabBarInactive: '#8E8E93',
    glassCard: 'rgba(255, 255, 255, 0.92)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',
    inputBackground: '#E5E5EA',
    inputBorder: 'rgba(0, 0, 0, 0.08)',
    inputText: '#000000',
    buttonPrimaryText: '#FFFFFF',
  },
  dark: {
    background: '#000000', // Apple iOS pure black
    card: '#1C1C1E', // Apple iOS secondary grouped background
    cardElevated: '#2C2C2E',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#FFFFFF',
    textSecondary: '#AEAEB2',
    textMuted: '#636366',
    separator: '#38383A',
    pillBackground: '#2C2C2E',
    pillActive: '#636366',
    pillActiveText: '#FFFFFF',
    headerGlow: ['rgba(255, 59, 48, 0.28)', 'rgba(255, 149, 0, 0.15)', 'rgba(0, 0, 0, 0)'],
    tabBarBackground: 'rgba(28, 28, 30, 0.92)',
    tabBarBorder: 'rgba(255, 255, 255, 0.12)',
    tabBarActive: '#FF453A',
    tabBarInactive: '#8E8E93',
    glassCard: 'rgba(28, 28, 30, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.10)',
    inputBackground: '#1C1C1E',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputText: '#FFFFFF',
    buttonPrimaryText: '#FFFFFF',
  },
};

export const Colors = {
  ...AppleHealthThemes,
  macros: {
    calories: '#FF3B30', // Apple Activity Red
    caloriesGradient: ['#FF3B30', '#FF2D55'],
    protein: '#34C759', // Apple Activity Green
    proteinGradient: ['#34C759', '#30B0C7'],
    carbs: '#FF9500', // Apple Activity Orange
    carbsGradient: ['#FF9500', '#FFCC00'],
    fat: '#AF52DE', // Apple Activity Purple
    fatGradient: ['#AF52DE', '#5856D6'],
    water: '#007AFF', // Apple Activity Cyan/Blue
    waterGradient: ['#007AFF', '#5AC8FA'],
  },
  categories: {
    activity: '#FF3B30',
    body: '#FF9500',
    hearing: '#AF52DE',
    heart: '#FF2D55',
    medications: '#007AFF',
    mental: '#5856D6',
    mobility: '#FF9500',
    nutrition: '#34C759',
    respiratory: '#5AC8FA',
    sleep: '#5856D6',
  },
  brand: {
    primary: '#FF3B30',
    primaryGradient: ['#FF3B30', '#FF9500'],
    secondary: '#34C759',
    accent: '#007AFF',
    gold: '#FFD60A',
    danger: '#FF453A',
    success: '#30D158',
    warning: '#FFD60A',
  },
};
