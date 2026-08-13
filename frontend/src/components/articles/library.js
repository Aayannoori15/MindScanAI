/*
 * Curated reading, linking out to the original publishers.
 *
 * Deliberately links rather than reproducing article text: the content belongs
 * to WHO, NIMH, Mind, the NHS and others, and a screening tool has no business
 * republishing clinical guidance under its own banner. The summaries here are
 * ours; the substance stays at the source, where it is kept up to date.
 *
 * Every URL below was checked and returned HTTP 200. If one rots, remove it
 * rather than guessing a replacement — a dead link in a mental-health resource
 * list is worse than a shorter list.
 */

export const TOPICS = [
  { id: "all", label: "Everything" },
  { id: "stress", label: "Stress" },
  { id: "anxiety", label: "Anxiety" },
  { id: "low-mood", label: "Low mood" },
  { id: "sleep", label: "Sleep" },
  { id: "habits", label: "Daily habits" },
  { id: "getting-help", label: "Getting help" },
];

export const ARTICLES = [
  {
    title: "When is it time to ask for help?",
    source: "NIMH",
    minutes: 6,
    topics: ["getting-help"],
    url: "https://www.nimh.nih.gov/health/publications/my-mental-health-do-i-need-help",
    blurb:
      "The question most people sit on for too long. A plain checklist for telling an ordinary bad patch from something worth getting looked at.",
  },
  {
    title: "Caring for your mental health",
    source: "NIMH",
    minutes: 8,
    topics: ["habits", "getting-help"],
    url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
    blurb:
      "The foundations — sleep, movement, connection, and knowing what a warning sign looks like for you specifically.",
  },
  {
    title: "How to manage and reduce stress",
    source: "Mental Health Foundation",
    minutes: 10,
    topics: ["stress"],
    url: "https://www.mentalhealth.org.uk/explore-mental-health/publications/how-manage-and-reduce-stress",
    blurb:
      "Separates the stress you can act on from the stress you can only carry differently, then gives practical handling for both.",
  },
  {
    title: "Understanding stress",
    source: "Mind",
    minutes: 9,
    topics: ["stress"],
    url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/stress/",
    blurb:
      "What stress actually does to the body and why it lingers after the pressure lifts. Useful if yours shows up physically first.",
  },
  {
    title: "Relaxation exercises you can do anywhere",
    source: "Mind",
    minutes: 5,
    topics: ["stress", "anxiety", "habits"],
    url: "https://www.mind.org.uk/information-support/tips-for-everyday-living/relaxation/relaxation-exercises/",
    blurb:
      "Short, concrete exercises that need no equipment and no privacy. Pairs well with the breathing block in the Relax Hub.",
  },
  {
    title: "Dealing with anxiety",
    source: "NHS Every Mind Matters",
    minutes: 7,
    topics: ["anxiety"],
    url: "https://www.nhs.uk/every-mind-matters/mental-health-issues/anxiety/",
    blurb:
      "Why avoidance makes anxiety stronger, and what to do instead. Written for people mid-spiral, not for clinicians.",
  },
  {
    title: "Depression: what it is and what helps",
    source: "NIMH",
    minutes: 11,
    topics: ["low-mood", "getting-help"],
    url: "https://www.nimh.nih.gov/health/topics/depression",
    blurb:
      "Signs, treatment options and what actually happens when you seek help — including how long approaches usually take to work.",
  },
  {
    title: "Living with depression",
    source: "Mind",
    minutes: 9,
    topics: ["low-mood"],
    url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/depression/",
    blurb:
      "Written largely from lived experience. Good if clinical descriptions have never quite matched how it feels.",
  },
  {
    title: "Sleep and mental health",
    source: "NHS Every Mind Matters",
    minutes: 6,
    topics: ["sleep", "habits"],
    url: "https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/",
    blurb:
      "Sleep and mood run in both directions. Practical fixes for the loop where each keeps making the other worse.",
  },
  {
    title: "How sleep affects mental health",
    source: "Sleep Foundation",
    minutes: 12,
    topics: ["sleep"],
    url: "https://www.sleepfoundation.org/mental-health",
    blurb:
      "The deeper evidence on why poor sleep amplifies anxiety and low mood, if you want the mechanism rather than the tips.",
  },
  {
    title: "Mindfulness, without the mysticism",
    source: "NHS",
    minutes: 6,
    topics: ["habits", "anxiety"],
    url: "https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/",
    blurb:
      "What mindfulness is actually asking you to do, what it helps with, and honestly where it does not.",
  },
  {
    title: "Physical activity and mental health",
    source: "Mental Health Foundation",
    minutes: 8,
    topics: ["habits", "low-mood"],
    url: "https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/physical-activity-and-mental-health",
    blurb:
      "How little movement it actually takes to shift mood, and how to start when motivation is the thing that's missing.",
  },
  {
    title: "Managing social media use",
    source: "American Psychological Association",
    minutes: 7,
    topics: ["habits", "stress"],
    url: "https://www.apa.org/topics/stress/manage-social-media-use",
    blurb:
      "Evidence-based limits rather than a blanket digital detox. Relevant if your screen-time inputs came back high.",
  },
  {
    title: "Mental health: strengthening our response",
    source: "World Health Organization",
    minutes: 10,
    topics: ["getting-help"],
    url: "https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response",
    blurb:
      "The global picture — how common these conditions are, and how ordinary it is to need support for them.",
  },
  {
    title: "iCall — free counselling, India",
    source: "TISS",
    minutes: 2,
    topics: ["getting-help"],
    url: "https://icallhelpline.org/",
    blurb:
      "Free phone and email counselling from trained professionals, in English and several Indian languages.",
  },
  {
    title: "NIMHANS",
    source: "Govt. of India",
    minutes: 3,
    topics: ["getting-help"],
    url: "https://www.nimhans.ac.in/",
    blurb:
      "India's central mental-health institute. Useful for finding accredited services near you.",
  },
];
