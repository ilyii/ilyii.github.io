/**
 * Subjects work like school exercise books: one cover colour each, a short code,
 * and every post is an entry in exactly one book. Add, rename or recolour freely.
 * The key is used in front matter (`subject: systems`) and in the URL.
 */
export const SUBJECTS = {
  systems: { name: 'Systems', code: 'Sys', blurb: 'How things run underneath: processes, networks, storage, infrastructure.', light: '#2f6db5', dark: '#6b9be0' },
  ai: { name: 'AI', code: 'AI', blurb: 'Models, agents and the plumbing around them.', light: '#c0453f', dark: '#e07a72' },
  dev: { name: 'Dev Tools', code: 'Dev', blurb: 'Editors, CLIs, build systems and the daily workflow.', light: '#2f8a57', dark: '#5fb383' },
  web: { name: 'Web', code: 'Web', blurb: 'Browsers, front ends and the protocols in between.', light: '#c8920f', dark: '#d9b04a' },
  data: { name: 'Data', code: 'Dat', blurb: 'Modelling, moving and querying data.', light: '#7a4fa8', dark: '#a585cf' },
  maths: { name: 'Maths', code: 'Ma', blurb: 'The maths behind the code, worked through by hand.', light: '#d9692b', dark: '#e3905a' },
} as const;

export type SubjectKey = keyof typeof SUBJECTS;
export const SUBJECT_KEYS = Object.keys(SUBJECTS) as [SubjectKey, ...SubjectKey[]];

/** Inline style that gives an element (with class `subj`) its subject colour in both themes. */
export const subjectStyle = (key: SubjectKey) =>
  `--c-light:${SUBJECTS[key].light};--c-dark:${SUBJECTS[key].dark}`;
