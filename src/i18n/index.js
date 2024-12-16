// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言文件
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

i18n
  .use(initReactI18next) // 绑定到 react-i18next
  .init({
    resources,
    lng: 'en', // 默认语言
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS，所以不需要转义
    },
  });

export default i18n;
