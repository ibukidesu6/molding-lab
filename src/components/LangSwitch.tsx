import { LOCALES, useI18n, type LocaleId } from '../i18n';
import { IconCheck } from './Icons';

/** M3 outlined segmented button (single select). The check icon marks the selected segment. */
export default function LangSwitch() {
  const { locale, setLocale, d } = useI18n();
  return (
    <div className="segmented" role="group" aria-label={d.ui.locale}>
      {(Object.keys(LOCALES) as LocaleId[]).map((id) => {
        const on = id === locale;
        return (
          <button key={id} className={`segment${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setLocale(id)} title={LOCALES[id].meta.label}>
            {on && <IconCheck size={18} />}
            <span className="lang-label">{LOCALES[id].meta.label}</span>
            <span className="lang-short">{LOCALES[id].meta.short}</span>
          </button>
        );
      })}
    </div>
  );
}
