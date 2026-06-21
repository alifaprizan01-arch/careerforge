'use client';
import { createContext, useContext } from 'react';

// =====================================================================
// FITUR GANTI BAHASA DINONAKTIFKAN.
// Aplikasi selalu memakai Bahasa Indonesia.
// Fungsi t() mengembalikan teks aslinya, jadi semua halaman yang
// memakai t('...') tetap berjalan normal tanpa perlu diubah.
// =====================================================================

const LangContext = createContext({ lang: 'id', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  return children;
}

export const useLang = () => useContext(LangContext);