export interface Carrier {
  id: string;
  name: string;
  colorHex: string;
  notes: string;
}

// All major Australian carriers use the same GSM "Call Forward When
// Unanswered" MMI code (**61*number#), so the code itself doesn't vary by
// carrier — only whether/how an app-based alternative is available.
export const CARRIERS: Carrier[] = [
  {
    id: "telstra",
    name: "Telstra",
    colorHex: "#0f6fff",
    notes:
      "You can also manage this in the My Telstra app under Services > Call Forwarding, if the dial code doesn't stick.",
  },
  {
    id: "optus",
    name: "Optus",
    colorHex: "#00b0eb",
    notes:
      "You can also manage this in the My Optus app under Account > Manage Services > Call Forwarding.",
  },
  {
    id: "vodafone",
    name: "Vodafone / TPG",
    colorHex: "#e60000",
    notes:
      "You can also manage this in the My Vodafone app under Account > Call Settings > Call Forwarding.",
  },
  {
    id: "other",
    name: "Other / not sure",
    colorHex: "#6b7280",
    notes:
      "Most other Australian carriers support the same code. If it doesn't work, check your phone's Settings > Phone > Call Forwarding (iPhone) or your carrier's app (Android), and forward \"when unanswered\" to the number above.",
  },
];
