import { useEffect } from 'react';
import { useLearningData } from './DataProvider';

export function ThemeSync() {
  const { snapshot } = useLearningData();
  useEffect(() => {
    const root = document.documentElement;
    if (snapshot.settings.theme === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = snapshot.settings.theme;
  }, [snapshot.settings.theme]);
  return null;
}
