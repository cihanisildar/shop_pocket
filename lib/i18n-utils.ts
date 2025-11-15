import { locales, type Locale } from '@/i18n';

export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Don't add locale prefix if path already starts with a locale
  if (locales.some(loc => cleanPath.startsWith(`${loc}/`) || cleanPath === loc)) {
    return `/${cleanPath}`;
  }
  
  return `/${locale}/${cleanPath}`;
}

export function getLocaleFromPath(path: string): Locale | null {
  const match = path.match(/^\/([a-z]{2})(\/|$)/);
  if (match && locales.includes(match[1] as Locale)) {
    return match[1] as Locale;
  }
  return null;
}

