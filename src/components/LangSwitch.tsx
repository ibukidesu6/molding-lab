import { LOCALES, useI18n, type LocaleId } from '../i18n';

export default function LangSwitch() {
  const { locale, setLocale, d } = useI18n();
  return (
    <div className="lang" role="group" aria-label={d.ui.locale}>
      {(Object.keys(LOCALES) as LocaleId[]).map((id) => (
        <button
          key={id}
          className={id === locale ? 'on' : ''}
          aria-pressed={id === locale}
          onClick={() => setLocale(id)}
          title={LOCALES[id].meta.label}
        >
          <span className="lang-short">{LOCALES[id].meta.short}</span>
          <span className="lang-label">{LOCALES[id].meta.label}</span>
        </button>
      ))}
    </div>
  );
}
