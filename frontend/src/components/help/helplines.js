/*
 * Mental-health helplines across India.
 *
 * VERIFY BEFORE RELYING ON THIS LIST. These are well-established public
 * numbers, but helplines change numbers, hours and funding. A crisis line that
 * rings out is worse than no number at all, so re-check each entry before any
 * deployment where someone might actually dial it.
 *
 * Ordered so the always-on national services come first — under distress,
 * nobody should have to scan a directory to find one that is open now.
 */

export const EMERGENCY = {
  label: "Immediate danger",
  numbers: [
    { name: "National emergency", number: "112" },
    { name: "Ambulance", number: "108" },
  ],
  note: "If someone's life is at risk right now, call these first.",
};

export const HELPLINES = [
  // ---- National, round the clock -----------------------------------------
  {
    name: "Tele-MANAS",
    number: "14416",
    alt: "1-800-891-4416",
    hours: "24×7",
    languages: "20+ Indian languages",
    org: "Ministry of Health & Family Welfare",
    scope: "national",
    note: "The government's flagship national mental-health line. Free, and the broadest language coverage available.",
  },
  {
    name: "KIRAN",
    number: "1800-599-0019",
    hours: "24×7",
    languages: "13 languages",
    org: "Ministry of Social Justice & Empowerment",
    scope: "national",
    note: "Free national helpline for distress, anxiety, depression and suicidal thoughts.",
  },
  {
    name: "Vandrevala Foundation",
    number: "9999666555",
    hours: "24×7",
    languages: "English, Hindi and regional",
    org: "Vandrevala Foundation",
    scope: "national",
    note: "Free counselling by phone and WhatsApp, plus referrals to local practitioners.",
  },
  {
    name: "AASRA",
    number: "9820466726",
    hours: "24×7",
    languages: "English, Hindi",
    org: "AASRA, Mumbai",
    scope: "national",
    note: "Long-running suicide-prevention and emotional-support line.",
  },
  {
    name: "iCall",
    number: "9152987821",
    hours: "Mon–Sat, 10am–8pm",
    languages: "English, Hindi and several regional",
    org: "TISS",
    scope: "national",
    note: "Counselling from trained mental-health professionals, by phone and email.",
  },
  {
    name: "Jeevan Aastha",
    number: "1800-233-3330",
    hours: "24×7",
    languages: "Gujarati, Hindi, English",
    org: "Gandhinagar Police",
    scope: "national",
    note: "Free suicide-prevention helpline, open to callers from anywhere in India.",
  },

  // ---- Regional -----------------------------------------------------------
  {
    name: "SNEHA",
    number: "044-24640050",
    hours: "24×7",
    languages: "Tamil, English",
    org: "SNEHA, Chennai",
    scope: "regional",
    region: "Chennai / Tamil Nadu",
    note: "Suicide prevention centre offering confidential emotional support.",
  },
  {
    name: "Sumaitri",
    number: "011-23389090",
    hours: "Mon–Fri 2–6.30pm, Sat–Sun 10am–6.30pm",
    languages: "Hindi, English",
    org: "Sumaitri, Delhi",
    scope: "regional",
    region: "Delhi NCR",
    note: "Befriending service for people in emotional distress or despair.",
  },
  {
    name: "Connecting Trust",
    number: "9922001122",
    hours: "Daily, 12pm–8pm",
    languages: "Marathi, Hindi, English",
    org: "Connecting Trust, Pune",
    scope: "regional",
    region: "Pune / Maharashtra",
    note: "Anonymous, non-judgemental listening. Also runs a distress helpline.",
  },
  {
    name: "Roshni Trust",
    number: "040-66202000",
    hours: "Daily, 11am–9pm",
    languages: "Telugu, Hindi, English",
    org: "Roshni, Hyderabad",
    scope: "regional",
    region: "Hyderabad / Telangana",
    note: "Emotional support for the distressed and suicidal.",
  },
  {
    name: "Sahai",
    number: "080-25497777",
    hours: "Mon–Sat, 10am–8pm",
    languages: "Kannada, English",
    org: "Sahai, Bengaluru",
    scope: "regional",
    region: "Bengaluru / Karnataka",
    note: "Counselling and suicide-prevention support.",
  },
  {
    name: "Maithri",
    number: "0484-2540530",
    hours: "Daily, 10am–7pm",
    languages: "Malayalam, English",
    org: "Maithri, Kochi",
    scope: "regional",
    region: "Kochi / Kerala",
    note: "Volunteer-run emotional support and befriending.",
  },
  {
    name: "Lifeline Foundation",
    number: "033-24637401",
    hours: "Daily, 10am–6pm",
    languages: "Bengali, Hindi, English",
    org: "Lifeline, Kolkata",
    scope: "regional",
    region: "Kolkata / West Bengal",
    note: "Emotional support for people in crisis.",
  },

  // ---- Specialised --------------------------------------------------------
  {
    name: "CHILDLINE",
    number: "1098",
    hours: "24×7",
    languages: "Multiple",
    org: "Ministry of Women & Child Development",
    scope: "specialised",
    audience: "Under 18",
    note: "National helpline for children in distress or needing protection.",
  },
  {
    name: "Women's Helpline",
    number: "181",
    hours: "24×7",
    languages: "Multiple",
    org: "Ministry of Women & Child Development",
    scope: "specialised",
    audience: "Women",
    note: "Support for women facing violence, harassment or distress.",
  },
  {
    name: "NIMHANS",
    number: "080-46110007",
    hours: "24×7",
    languages: "Multiple",
    org: "NIMHANS, Bengaluru",
    scope: "specialised",
    audience: "Psychosocial support",
    note: "India's central mental-health institute; can also direct you to accredited local services.",
  },
];

export const GROUPS = [
  { id: "national", label: "National · always open", hint: "Free, available anywhere in India" },
  { id: "regional", label: "Regional", hint: "City and state services, often in your own language" },
  { id: "specialised", label: "Specialised", hint: "For children, women, and clinical referral" },
];
