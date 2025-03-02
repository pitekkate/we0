import useThemeStore from "@/stores/themeSlice";
import { useState, useEffect } from "react";

import i18n from "@/utils/i18";
import { useTranslation } from "react-i18next";

export function GeneralSettings() {
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(JSON.parse(localStorage.getItem('settingsConfig') || '{}'));

  useEffect(() => {
     localStorage.setItem('settingsConfig', JSON.stringify(formData));
  }, [formData]);

  const [languageOpen, setLanguageOpen] = useState(false);

  // Load theme settings from local storage when component mounts
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme) {
      setTheme(savedTheme === 'dark');
    } else {
      // If no saved theme setting, use system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark);
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Handle theme toggle
  const handleThemeToggle = () => {
    toggleTheme();
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  return (
    <div className="h-full flex flex-col text-foreground">
      <div className="flex-1">
        <div className="border-b border-border">
          <button
            className={`px-3 py-1.5 text-sm ${
              activeTab === 'general'
                ? 'text-foreground border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-foreground'
            }`}
            onClick={() => setActiveTab('general')}
          >
            {t("settings.General")}
          </button>
        </div>

        <form  className="space-y-4 mt-4">
          {/* Theme Mode Toggle */}
          <div>
            <label className="block text-gray-500 dark:text-gray-300 mb-1.5 text-sm">
            {t("settings.themeMode")}
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleThemeToggle}
                className="px-2.5 py-1.5 bg-white dark:bg-[#18181a] border border-border rounded-md text-foreground hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-sm transition-colors"
              >
                {isDarkMode ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
                      />
                    </svg>
                    <span>{t('settings.themeModeDark')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" 
                      />
                    </svg>
                    <span>{t("settings.themeModeLight")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Language Select */}
          <div className="relative">
            <label className="block text-gray-300 mb-1.5 text-sm">{t("settings.Language")}</label>
            <div className="relative">
              <button
                type="button"
                className="w-28 px-2.5 py-1.5 bg-white dark:bg-[#18181a] border border-border rounded-md text-foreground text-left flex justify-between items-center text-sm"
                onClick={() => setLanguageOpen(!languageOpen)}
              >
                
                {formData.language === 'en' ? 'English' : '中文'}
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${
                    languageOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {languageOpen && (
                <div className="absolute w-28 mt-1 bg-white dark:bg-[#18181a] border border-border rounded-md shadow-lg">
                  <button
                    type="button"
                    className="w-full px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-foreground"
                    onClick={() => {
                      setFormData({ ...formData, language: 'en' });
                      setLanguageOpen(false);
                      i18n.changeLanguage('en');
                      localStorage.setItem('language', 'en');
                    }}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className="w-full px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-foreground"
                    onClick={() => {
                      setFormData({ ...formData, language: 'zh' });
                      setLanguageOpen(false);
                      i18n.changeLanguage('zh');
                      localStorage.setItem('language', 'zh');
                    }}
                  >
                    中文
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-4 pt-3 border-t border-border">
        <button
          type="submit"
          className={`px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center text-sm transition-colors`}
        >
          {t("settings.save")}
        </button>
      </div>
    </div>
  );
}
