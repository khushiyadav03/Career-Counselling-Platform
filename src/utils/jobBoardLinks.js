/**
 * Builds deep links to job boards from user criteria (no API keys).
 * Boards may change URL formats over time; these patterns are widely used.
 */

const INDEED_HOST = {
  us: 'https://www.indeed.com',
  in: 'https://in.indeed.com',
  uk: 'https://uk.indeed.com',
};

const indeedExplvl = {
  entry: 'entry_level',
  mid: 'mid_level',
  senior: 'senior_level',
  any: '',
};

const indeedJt = {
  'full-time': 'fulltime',
  'part-time': 'parttime',
  contract: 'contract',
  internship: 'internship',
  any: '',
};

const linkedInWt = {
  remote: '2',
  hybrid: '3',
  onsite: '1',
  any: '',
};

function joinKeywords(keywords, skillsExtra) {
  const k = (keywords || '').trim();
  const s = (skillsExtra || '').trim();
  if (!s) return k;
  if (!k) return s;
  return `${k} ${s}`;
}

export function buildJobBoardUrls({
  keywords,
  skillsExtra = '',
  location = '',
  workType = 'any',
  experience = 'any',
  jobType = 'any',
  country = 'us',
}) {
  const q = joinKeywords(keywords, skillsExtra);
  const loc = (location || '').trim() || (workType === 'remote' ? 'Remote' : '');

  const baseIndeed = INDEED_HOST[country] || INDEED_HOST.us;
  const iq = new URLSearchParams();
  iq.set('q', q);
  if (loc) iq.set('l', loc);
  const ex = indeedExplvl[experience];
  if (ex) iq.set('explvl', ex);
  const jt = indeedJt[jobType];
  if (jt) iq.set('jt', jt);
  if (workType === 'remote' && !loc) iq.set('l', 'Remote');

  const indeedUrl = `${baseIndeed}/jobs?${iq.toString()}`;

  const li = new URLSearchParams();
  li.set('keywords', q);
  if (loc) li.set('location', loc);
  const wt = linkedInWt[workType];
  if (wt) li.set('f_WT', wt);
  const linkedInUrl = `https://www.linkedin.com/jobs/search/?${li.toString()}`;

  const googleQuery = [q, 'jobs', loc].filter(Boolean).join(' ');
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&udm=8`;

  const glassdoorUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(q)}${loc ? `&locT=N&locKeyword=${encodeURIComponent(loc)}` : ''}`;

  const naukriSimple = `https://www.naukri.com/jobs-in-india?k=${encodeURIComponent(q)}`;

  return [
    {
      id: 'indeed',
      name: 'Indeed',
      description: 'Search listings and apply on employer or Indeed pages.',
      url: indeedUrl,
      icon: 'fa-solid fa-magnifying-glass',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Jobs',
      description: 'Filter by network, Easy Apply where available.',
      url: linkedInUrl,
      icon: 'fa-brands fa-linkedin',
    },
    {
      id: 'google',
      name: 'Google Jobs',
      description: 'Aggregated openings; opens Google’s job view when available.',
      url: googleUrl,
      icon: 'fa-brands fa-google',
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      description: 'Roles, reviews, and salary context.',
      url: glassdoorUrl,
      icon: 'fa-solid fa-door-open',
    },
    ...(country === 'in'
      ? [
          {
            id: 'naukri',
            name: 'Naukri',
            description: 'Popular in India for full-time and contract roles.',
            url: naukriSimple,
            icon: 'fa-solid fa-briefcase',
          },
        ]
      : []),
  ];
}
