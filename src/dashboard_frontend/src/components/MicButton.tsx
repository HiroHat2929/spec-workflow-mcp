import { useTranslation } from 'react-i18next';
import { useSpeechRecognition } from '../lib/useSpeechRecognition';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function MicButton({ onTranscript, className = '' }: MicButtonProps) {
  const { t, i18n } = useTranslation();

  const { isSupported, isListening, toggle } = useSpeechRecognition({
    lang: i18n.language,
    onFinalTranscript: (text) => onTranscript(text),
  });

  if (!isSupported) return null;

  const label = isListening ? t('mic.stop') : t('mic.start');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isListening}
      className={
        'inline-flex items-center justify-center w-9 h-9 rounded-md border transition-colors ' +
        (isListening
          ? 'bg-[var(--status-error-muted)] text-[var(--status-error)] border-[var(--status-error)] animate-pulse'
          : 'bg-[var(--surface-panel)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--surface-hover)]') +
        ' ' +
        className
      }
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19v4M8 23h8" />
      </svg>
    </button>
  );
}
