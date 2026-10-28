import React, { createContext, useContext, useMemo, useState } from "react";
import { getTranslation } from "../i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("satthamma_language") || "en"
  );

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("satthamma_language", newLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage,
      t: (key) => getTranslation(language, key),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
