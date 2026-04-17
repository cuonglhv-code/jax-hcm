import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import viCommon from './locales/vi/common.json'
import viAuth from './locales/vi/auth.json'
import viDashboard from './locales/vi/dashboard.json'
import viEmployees from './locales/vi/employees.json'
import viPayroll from './locales/vi/payroll.json'
import viLeave from './locales/vi/leave.json'
import viRecruitment from './locales/vi/recruitment.json'
import viPerformance from './locales/vi/performance.json'
import viLearning from './locales/vi/learning.json'
import viNotifications from './locales/vi/notifications.json'
import viAdmin from './locales/vi/admin.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enDashboard from './locales/en/dashboard.json'
import enEmployees from './locales/en/employees.json'
import enPayroll from './locales/en/payroll.json'
import enLeave from './locales/en/leave.json'
import enRecruitment from './locales/en/recruitment.json'
import enPerformance from './locales/en/performance.json'
import enLearning from './locales/en/learning.json'
import enNotifications from './locales/en/notifications.json'
import enAdmin from './locales/en/admin.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        common: viCommon,
        auth: viAuth,
        dashboard: viDashboard,
        employees: viEmployees,
        payroll: viPayroll,
        leave: viLeave,
        recruitment: viRecruitment,
        performance: viPerformance,
        learning: viLearning,
        notifications: viNotifications,
        admin: viAdmin,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        employees: enEmployees,
        payroll: enPayroll,
        leave: enLeave,
        recruitment: enRecruitment,
        performance: enPerformance,
        learning: enLearning,
        notifications: enNotifications,
        admin: enAdmin,
      },
    },
    lng: 'vi',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'dashboard',
      'employees',
      'payroll',
      'leave',
      'recruitment',
      'performance',
      'learning',
      'notifications',
      'admin',
    ],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'hcm_language',
    },
  })

export default i18n
