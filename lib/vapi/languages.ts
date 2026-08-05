export interface LanguageOption {
  code: string;
  label: string;
  /** False if Deepgram's nova-3 "multi" code-switching mode doesn't confirm this
   * one — still transcribable as the sole/monolingual language for a call, just
   * not reliably mixed with other languages in the same conversation. */
  codeSwitchingConfirmed: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", codeSwitchingConfirmed: true },
  { code: "hi", label: "Hindi", codeSwitchingConfirmed: true },
  { code: "ta", label: "Tamil", codeSwitchingConfirmed: false },
  { code: "te", label: "Telugu", codeSwitchingConfirmed: false },
  // Not confirmed supported by Deepgram nova-3 at all as of research time —
  // included on request, but transcription accuracy is unverified.
  { code: "ml", label: "Malayalam", codeSwitchingConfirmed: false },
  { code: "es", label: "Spanish", codeSwitchingConfirmed: true },
  { code: "fr", label: "French", codeSwitchingConfirmed: true },
  { code: "de", label: "German", codeSwitchingConfirmed: true },
  { code: "ru", label: "Russian", codeSwitchingConfirmed: true },
  { code: "pt", label: "Portuguese", codeSwitchingConfirmed: true },
  { code: "ja", label: "Japanese", codeSwitchingConfirmed: true },
  { code: "it", label: "Italian", codeSwitchingConfirmed: true },
  { code: "nl", label: "Dutch", codeSwitchingConfirmed: true },
];
