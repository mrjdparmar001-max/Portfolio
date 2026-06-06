import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

const themes = {
  dark: {
    name: 'dark',
    bg: '#0a0a0f',
    bgSecondary: '#12121a',
    bgCard: '#1a1a2e',
    primary: '#6c63ff',
    secondary: '#ff6584',
    accent: '#43e97b',
    text: '#ffffff',
    textMuted: '#a0a0b0',
    border: '#2a2a3e',
    gradient: 'linear-gradient(135deg, #6c63ff, #ff6584)',
  },
  light: {
    name: 'light',
    bg: '#f0f2ff',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    primary: '#6c63ff',
    secondary: '#ff6584',
    accent: '#43e97b',
    text: '#1a1a2e',
    textMuted: '#666680',
    border: '#e0e0f0',
    gradient: 'linear-gradient(135deg, #6c63ff, #ff6584)',
  },
  ocean: {
    name: 'ocean',
    bg: '#0a1628',
    bgSecondary: '#0d1f3c',
    bgCard: '#112240',
    primary: '#64ffda',
    secondary: '#ccd6f6',
    accent: '#f6c90e',
    text: '#ccd6f6',
    textMuted: '#8892b0',
    border: '#1d3557',
    gradient: 'linear-gradient(135deg, #64ffda, #0070f3)',
  },
  sunset: {
    name: 'sunset',
    bg: '#1a0a0a',
    bgSecondary: '#2a1010',
    bgCard: '#1f1515',
    primary: '#ff6b35',
    secondary: '#f7c59f',
    accent: '#efefd0',
    text: '#efefd0',
    textMuted: '#c0a080',
    border: '#3a2020',
    gradient: 'linear-gradient(135deg, #ff6b35, #f7c59f)',
  },
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(
    () => localStorage.getItem('portfolio-theme') || 'dark'
  );

  const theme = useMemo(() => themes[themeName], [themeName]);

  useEffect(() => {
    localStorage.setItem('portfolio-theme', themeName);
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--bg-secondary', theme.bgSecondary);
    root.style.setProperty('--bg-card', theme.bgCard);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--border', theme.border);

    // Update favicon: bg = theme background, text = theme primary — unique per theme
    const buildFavicon = () => {
      const bg   = theme.bgCard;    // card colour — distinct for every theme
      const fg   = theme.primary;   // primary colour for JD text
      const border = theme.primary; // subtle ring
      const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`,
        `<rect width="64" height="64" rx="14" fill="${bg}" stroke="${border}" stroke-width="3"/>`,
        `<text x="32" y="44" font-family="Georgia,serif" font-size="28" font-weight="900"`,
        `  text-anchor="middle" fill="${fg}" letter-spacing="1">JD</text>`,
        `</svg>`,
      ].join('');
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      // Remove all existing icon links then add fresh one
      document.head.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove());
      const link  = document.createElement('link');
      link.rel    = 'icon';
      link.type   = 'image/svg+xml';
      link.href   = url;
      document.head.appendChild(link);
    };
    buildFavicon();
  }, [theme]);

  const value = useMemo(
    () => ({ theme, themeName, setThemeName, themes: Object.keys(themes) }),
    [theme, themeName]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
