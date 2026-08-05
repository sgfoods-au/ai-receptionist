export interface Carrier {
  id: string;
  name: string;
  mark: string;
  colorHex: string;
  gradient: string;
  notes: string;
}

// All major Australian carriers use the same GSM "Call Forward When
// Unanswered" MMI code (**61*number#), so the code itself doesn't vary by
// carrier — only whether/how an app-based alternative is available.
//
// `mark` is a short custom wordmark shown in a styled chip, not a copy of
// the carrier's actual trademarked logo artwork (we don't hold rights to
// reproduce those).
export const CARRIERS: Carrier[] = [
  {
    id: "telstra",
    name: "Telstra",
    mark: "T",
    colorHex: "#0f6fff",
    gradient: "linear-gradient(135deg, #2563eb, #0f6fff)",
    notes:
      "You can also manage this in the My Telstra app under Services > Call Forwarding, if the dial code doesn't stick.",
  },
  {
    id: "optus",
    name: "Optus",
    mark: "O",
    colorHex: "#00b0eb",
    gradient: "linear-gradient(135deg, #0891b2, #00b0eb)",
    notes:
      "You can also manage this in the My Optus app under Account > Manage Services > Call Forwarding.",
  },
  {
    id: "vodafone",
    name: "Vodafone / TPG",
    mark: "V",
    colorHex: "#e60000",
    gradient: "linear-gradient(135deg, #b91c1c, #e60000)",
    notes:
      "You can also manage this in the My Vodafone app under Account > Call Settings > Call Forwarding.",
  },
  {
    id: "other",
    name: "Other / not sure",
    mark: "?",
    colorHex: "#8b5cf6",
    gradient: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
    notes:
      "Most other Australian carriers support the same code. If it doesn't work, check your phone's Settings > Phone > Call Forwarding (iPhone) or your carrier's app (Android), and forward \"when unanswered\" to the number above.",
  },
];
