import { useAppSelector } from '../store/hooks';
import translations from '../translations/translations.json';

type TranslationPath = string;

const getNestedTranslation = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the path if translation notd
    }
  }

  return typeof result === 'string' ? result : path;
};

export const useTranslation = () => {
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const t = (path: TranslationPath): string => {
    const translation = translations[currentLanguage as keyof typeof translations];
    return getNestedTranslation(translation, path);
  };

  return { t, currentLanguage };
};

