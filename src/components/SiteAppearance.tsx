import { useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

export function SiteAppearance() {
  const { theme } = useTheme();
  const { data } = useAppData();
  const { interface: design, seo, hotelName } = data.settings;
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--champagne', design.accentColor);
    for (const [name, value] of [['--page', design.pageColor], ['--surface', design.surfaceColor], ['--text', design.textColor]]) {
      if (theme === 'light' && value) root.style.setProperty(name!, value); else root.style.removeProperty(name!);
    }
    const hex = design.accentColor.replace('#', '');
    const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((channel) => channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4));
    const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    root.style.setProperty('--accent-on-color', luminance > .179 ? '#111b22' : '#ffffff');
    root.style.fontFamily = `${design.font}, ui-sans-serif, system-ui, sans-serif`;
    root.style.setProperty('--font-sans', `${design.font}, ui-sans-serif, system-ui, sans-serif`);
    root.style.setProperty('--font-display', design.font === 'Georgia' ? 'Georgia, serif' : '"Playfair Display", Georgia, serif');
    document.title = seo.title || hotelName;
    for (const [name, content] of [['description', seo.description], ['keywords', seo.keywords]]) {
      let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!element) { element = document.createElement('meta'); element.name = name; document.head.appendChild(element); }
      element.content = content;
    }
  }, [theme, design.pageColor, design.surfaceColor, design.textColor, design.accentColor, design.font, seo.title, seo.description, seo.keywords, hotelName]);
  return null;
}
