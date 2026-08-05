/**
 * Curated subset of Vapi's built-in ("vapi" provider) voices. All of these
 * support Vapi's multilingual "auto" language mode, so the same voice
 * works across whichever languages a business selects — no need to pick a
 * separate voice per language.
 */
export interface Voice {
  id: string;
  name: string;
}

export const VOICES: Voice[] = [
  { id: "Elliot", name: "Elliot" },
  { id: "Rohan", name: "Rohan" },
  { id: "Savannah", name: "Savannah" },
  { id: "Leo", name: "Leo" },
  { id: "Zoe", name: "Zoe" },
  { id: "Mia", name: "Mia" },
  { id: "Jess", name: "Jess" },
  { id: "Zac", name: "Zac" },
  { id: "Dan", name: "Dan" },
  { id: "Leah", name: "Leah" },
  { id: "Tara", name: "Tara" },
  { id: "Sagar", name: "Sagar" },
  { id: "Naina", name: "Naina" },
];

export const DEFAULT_VOICE_ID = "Elliot";
