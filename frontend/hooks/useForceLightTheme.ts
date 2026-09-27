import { useEffect } from 'react';

/**
 * Tanıtım ve giriş ekranlarını her zaman aydınlık (light) gösterir.
 * Panelin gece/gündüz tercihine dokunmaz: unmount olunca geri yükler.
 */
export function useForceLightTheme(): void {
  useEffect(() => {
    const el = document.documentElement;
    const hadDark = el.classList.contains('dark');
    el.classList.remove('dark');
    return () => {
      if (hadDark) el.classList.add('dark');
    };
  }, []);
}
