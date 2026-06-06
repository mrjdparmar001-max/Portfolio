import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiDroplet } from 'react-icons/fi';

const icons = { dark: <FiMoon />, light: <FiSun />, ocean: <FiDroplet />, sunset: '🌅' };

export default function ThemeSwitcher() {
  const { theme, themeName, setThemeName, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        style={{
          background: theme.gradient,
          border: 'none',
          borderRadius: '50%',
          width: 40,
          height: 40,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
        }}
      >
        {icons[themeName]}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            style={{
              position: 'absolute',
              top: 50,
              right: 0,
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              zIndex: 1000,
              minWidth: 120,
            }}
          >
            {themes.map(t => (
              <motion.button
                key={t}
                whileHover={{ x: 4 }}
                onClick={() => { setThemeName(t); setOpen(false); }}
                style={{
                  background: themeName === t ? theme.primary + '30' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: theme.text,
                  textAlign: 'left',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  fontWeight: themeName === t ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textTransform: 'capitalize',
                  width: '100%',
                }}
              >
                <span>{icons[t]}</span> {t}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
