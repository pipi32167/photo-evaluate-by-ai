// src/i18nClient.tsx
"use client";
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector'; // Optional: For automatic language detection

// import '@/i18n/index'
import zh from '@/locales/zh.json';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

const resources = {
  zh: {
    translation: zh,
  },
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
};

const defaultLang = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en'
i18n
  .use(initReactI18next)
  // .use(LanguageDetector) // Optional: Use language detector
  .init({
    resources,
    lng: defaultLang, // default language
    fallbackLng: defaultLang, // fallback language
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
