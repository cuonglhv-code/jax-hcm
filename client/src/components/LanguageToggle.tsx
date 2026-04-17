import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
  const { i18n, t } = useTranslation('common')
  const isVi = i18n.language === 'vi'

  const toggle = () => {
    i18n.changeLanguage(isVi ? 'en' : 'vi')
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-offset)] transition-colors duration-150"
      title={t('language.current')}
      aria-label="Switch language"
    >
      <span className="text-base leading-none">{isVi ? '🇻🇳' : '🇬🇧'}</span>
      <span className="font-semibold tracking-wide">{t('language.toggle')}</span>
    </button>
  )
}
