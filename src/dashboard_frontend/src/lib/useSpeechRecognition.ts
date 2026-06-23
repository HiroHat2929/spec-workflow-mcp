import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  getSpeechRecognitionCtor,
} from './speech-recognition.types';

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
  es: 'es-ES',
  pt: 'pt-BR',
  de: 'de-DE',
  fr: 'fr-FR',
  ru: 'ru-RU',
  it: 'it-IT',
  ko: 'ko-KR',
  ar: 'ar-SA',
};

function resolveLang(uiLang: string | undefined): string {
  if (!uiLang) return 'en-US';
  const base = uiLang.toLowerCase().split('-')[0];
  return LANG_MAP[base] ?? uiLang;
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onFinalTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const { lang, onFinalTranscript, onInterimTranscript, onError } = options;
  const ctorRef = useRef(getSpeechRecognitionCtor());
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);

  const onFinalRef = useRef(onFinalTranscript);
  const onInterimRef = useRef(onInterimTranscript);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);
  useEffect(() => {
    onInterimRef.current = onInterimTranscript;
  }, [onInterimTranscript]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const isSupported = ctorRef.current !== null;

  const ensureRecognition = useCallback((): SpeechRecognition | null => {
    if (!ctorRef.current) return null;
    if (recognitionRef.current) return recognitionRef.current;

    const recognition = new ctorRef.current();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalChunk += text;
        } else {
          interimChunk += text;
        }
      }
      if (finalChunk) onFinalRef.current(finalChunk);
      if (interimChunk && onInterimRef.current) onInterimRef.current(interimChunk);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onErrorRef.current?.(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const start = useCallback(() => {
    const recognition = ensureRecognition();
    if (!recognition) return;
    recognition.lang = resolveLang(lang);
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // start() while already started can throw InvalidStateError; ignore.
    }
  }, [ensureRecognition, lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { isSupported, isListening, start, stop, toggle };
}
