import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';

export const appTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7C6BF0',
    secondary: '#4CC9F0',
    background: '#121218',
    surface: '#1C1C26',
    surfaceVariant: '#2A2A38',
    error: '#FF6B6B',
  },
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <PaperProvider theme={appTheme}>{children}</PaperProvider>;
}
