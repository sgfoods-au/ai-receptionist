/**
 * Languages the transcriber (Deepgram nova-3, "multi" mode) can reliably
 * code-switch between without explicit per-call language selection.
 * Sticking to this list rather than free text keeps the multilingual
 * detection actually working, since nova-3's multi mode supports a
 * specific fixed set of languages, not arbitrary ones.
 */
export interface LanguageOption {
  code: string;
  label: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ru", label: "Russian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
];
