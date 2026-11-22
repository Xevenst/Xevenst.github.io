import { AboutPageContent, PortfolioPageContent } from '../models/portfolio.models';

export const LEGACY_DEFAULT_ABOUT_SKILLS = 'Flutter\nPython\nAngular\nTypeScript\nC++\nUnity / C#\nGit\nData science';
export const PREVIOUS_DEFAULT_ABOUT_SKILLS = 'Angular\nC#\nSSMS / SQL\nGit / GitHub\nUnity\nPython\nFlutter\nC++';

export const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  heroEyebrow: 'About me',
  heroTitle: 'Curious by default.',
  heroAccent: 'Practical by design.',
  heroBiography: "Hey, I'm Steven. I proudly hold a degree from National Dong Hwa University in the picturesque Hualien, Taiwan. My time at university was not just about books and lectures; it was about exploring ideas, collaborating with peers, and nurturing my curiosity. I am excited to bring that experience to real-world challenges while adding a dash of innovation.",
  heroRole: "I'm a Software Development Engineer in Taoyuan, Taiwan. I turn thoughtful ideas into interfaces, APIs, and products that feel clear to use.",
  heroImageUrl: '',
  highlightOneValue: '03',
  highlightOneLabel: 'Featured builds',
  highlightTwoValue: '2024',
  highlightTwoLabel: 'Started at Micron',
  highlightThreeValue: '04',
  highlightThreeLabel: 'Languages spoken',
  highlightNote: 'A small portfolio shaped by curiosity, collaboration, and care for the details.',
  highlightsLabel: 'Career highlights',
  onThisPageLabel: 'On this page',
  navIntroduction: 'Introduction',
  navWork: 'Selected work',
  navEducation: 'Education',
  navExperience: 'Work experience',
  navCommunity: 'Volunteering',
  navToolkit: 'Skills & courses',
  navHobbies: 'Hobbies',
  introductionHeading: 'Introduction',
  introductionCopy: 'I am eagerly seeking opportunities where I can combine my classroom knowledge with real-world challenges, collaborate with others, and make a meaningful impact as I continue my professional journey.',
  availability: 'Available for thoughtful collaborations · Taoyuan, Taiwan',
  selectedWorkEyebrow: 'Selected work',
  selectedWorkHeading: 'Ideas made',
  selectedWorkAccent: 'tangible.',
  viewAllLabel: 'View all',
  openGithubLabel: 'Open on GitHub',
  educationHeading: 'Educational background',
  educationDegree: 'Computer Science and Information Engineering',
  educationSchool: 'National Dong Hwa University · Hualien, Taiwan',
  educationDetails: 'GPA: 3.7 / 4.5 · Four years',
  educationLogoUrl: '',
  experienceHeading: 'Work experience',
  experienceEntries: 'May 2024 — Present|Micron Technology, Inc.|Software Development Engineer · Taoyuan, Taiwan|Develop and deliver high quality, maintainable programs across UI, API, and database areas.\nApr 2023 — Jun 2023|National Dong Hwa University · Taiwan|Introduction to Computer Programming II · Teaching Assistant|Assisted students with programming assignments by teaching the basics of coding and the logic behind the assignments.',
  communityHeading: 'Organisational & volunteer experience',
  communityEntries: 'PPI NDHU — Indonesian Students Association|Jun 2022 — Jun 2023 · External Human Resources|Assisted new Indonesian students arriving in Taiwan with registration and welcoming events, and handled public relations for NDHU International Culture Night 2022.\nPPI NDHU — Indonesian Students Association|Sep 2021 — Jun 2022 · Internal Human Resources|Maintained relationships between members, organised events and team activities, and established farewells for graduating students.\nNDHU Volunteer|Apr 2020 — Sep 2020 · International student support|Helped new international students with questions, registration forms, dormitory move-in, translations, and orientation.',
  toolkitHeading: 'Skills & courses',
  skills: 'Angular\nTypeScript\nFirebase / Firestore\nC#\nSSMS / SQL\nGit / GitHub\nUnity\nPython\nNumPy\npandas\nscikit-learn\nMatplotlib\nJupyter Notebook\nMachine Learning\nRecommender Systems\nK-means\nNaive Bayes\nKNN\nFlutter\nDart\nHive\nC++\nAudio Visualization',
  languagesHeading: 'Languages',
  languages: 'Indonesian|mother tongue\nEnglish|advanced\nChinese|early intermediate\nJapanese|beginner',
  coursesHeading: 'Courses',
  courses: 'Algorithm Design and Analysis · C++ Computer Programming · Data Science · Data Structures · Image Processing · Python Computer Programming · Recommender System · Smart Mobile Application Design · Wireless Internet',
  hobbiesHeading: 'Hobbies',
  hobbiesDescription: '',
  hobbiesImageUrl: '',
  hobbyEntries: '',
  contactEyebrow: 'Have a good problem?',
  contactTitle: "Let's make something",
  contactAccent: 'worth remembering.',
  contactButton: 'Start a conversation',
  contactEmail: 'steven.jonathan.dev@gmail.com',
};

export const DEFAULT_PORTFOLIO_CONTENT: PortfolioPageContent = {
  loadingLabel: 'Loading portfolio data…',
  signInRequiredMessage: 'Sign in to save projects to your personal collection.',
  saveProjectLabel: 'Save project',
  removeBookmarkLabel: 'Remove bookmark',
  openGithubLabel: 'Open on GitHub',
  resumeEyebrow: 'Resume & documents',
  resumeTitle: 'A few ways to get',
  resumeAccent: 'the full picture.',
  atsResumeTitle: 'ATS Resume',
  modernResumeTitle: 'Modern Resume',
  portfolioPdfTitle: 'Portfolio PDF',
  openPdfLabel: 'Open PDF',
};

export const ABOUT_CONTENT_SECTIONS = [
  {
    title: 'Hero',
    fields: [
      { key: 'heroEyebrow', label: 'Hero eyebrow' },
      { key: 'heroTitle', label: 'Hero title' },
      { key: 'heroAccent', label: 'Hero emphasized title' },
      { key: 'heroBiography', label: 'Biography', multiline: true },
      { key: 'heroRole', label: 'Current role introduction', multiline: true },
      { key: 'heroImageUrl', label: 'Hero photo URL' },
    ],
  },
  {
    title: 'Highlights',
    fields: [
      { key: 'highlightOneValue', label: 'Highlight 1 value' },
      { key: 'highlightOneLabel', label: 'Highlight 1 label' },
      { key: 'highlightTwoValue', label: 'Highlight 2 value' },
      { key: 'highlightTwoLabel', label: 'Highlight 2 label' },
      { key: 'highlightThreeValue', label: 'Highlight 3 value' },
      { key: 'highlightThreeLabel', label: 'Highlight 3 label' },
      { key: 'highlightNote', label: 'Highlights note', multiline: true },
      { key: 'highlightsLabel', label: 'Highlights accessible label' },
    ],
  },
  {
    title: 'Introduction',
    fields: [
      { key: 'introductionHeading', label: 'Introduction heading' },
      { key: 'introductionCopy', label: 'Introduction text', multiline: true },
      { key: 'availability', label: 'Availability line' },
    ],
  },
  {
    title: 'Work experience',
    fields: [
      { key: 'experienceHeading', label: 'Experience heading' },
      { key: 'experienceEntries', label: 'Entries (date|company|role|description|logo URL per line)', multiline: true },
    ],
  },
  {
    title: 'Selected work',
    fields: [
      { key: 'selectedWorkEyebrow', label: 'Selected work eyebrow' },
      { key: 'selectedWorkHeading', label: 'Selected work heading' },
      { key: 'selectedWorkAccent', label: 'Selected work emphasized heading' },
      { key: 'viewAllLabel', label: 'View all projects link' },
      { key: 'openGithubLabel', label: 'GitHub button label' },
    ],
  },
  {
    title: 'Education',
    fields: [
      { key: 'educationHeading', label: 'Education heading' },
      { key: 'educationDegree', label: 'Degree' },
      { key: 'educationSchool', label: 'School and location' },
      { key: 'educationDetails', label: 'Education details' },
      { key: 'educationLogoUrl', label: 'Education logo URL' },
    ],
  },
  {
    title: 'Skills, languages & courses',
    fields: [
      { key: 'toolkitHeading', label: 'Section heading' },
      { key: 'skills', label: 'Skills (one per line)', multiline: true },
      { key: 'languagesHeading', label: 'Languages heading' },
      { key: 'languages', label: 'Languages (language|proficiency per line)', multiline: true },
      { key: 'coursesHeading', label: 'Courses heading' },
      { key: 'courses', label: 'Courses list' },
    ],
  },
  {
    title: 'Community & volunteering',
    fields: [
      { key: 'communityHeading', label: 'Section heading' },
      { key: 'communityEntries', label: 'Entries (title|date and role|description per line)', multiline: true },
    ],
  },
  {
    title: 'Hobbies',
    fields: [
      { key: 'hobbiesHeading', label: 'Hobbies heading' },
      { key: 'hobbiesDescription', label: 'Introduction text', multiline: true },
      { key: 'hobbiesImageUrl', label: 'Introduction photo URL' },
      { key: 'hobbyEntries', label: 'Expandable entries (one per line: title|description|photo URL)', multiline: true },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { key: 'contactEyebrow', label: 'Contact eyebrow' },
      { key: 'contactTitle', label: 'Contact heading' },
      { key: 'contactAccent', label: 'Contact emphasized heading' },
      { key: 'contactButton', label: 'Contact button' },
      { key: 'contactEmail', label: 'Contact email' },
    ],
  },
  {
    title: 'Page navigation',
    fields: [
      { key: 'onThisPageLabel', label: 'Page index label' },
      { key: 'navIntroduction', label: 'Introduction link label' },
      { key: 'navExperience', label: 'Experience link label' },
      { key: 'navWork', label: 'Selected work link label' },
      { key: 'navEducation', label: 'Education link label' },
      { key: 'navToolkit', label: 'Skills and courses link label' },
      { key: 'navCommunity', label: 'Volunteering link label' },
      { key: 'navHobbies', label: 'Hobbies link label' },
    ],
  },
] as const satisfies readonly {
  title: string;
  fields: readonly { key: keyof AboutPageContent; label: string; multiline?: boolean }[];
}[];

export const PORTFOLIO_CONTENT_FIELDS = [
  { key: 'loadingLabel', label: 'Loading message' },
  { key: 'signInRequiredMessage', label: 'Bookmark sign-in message' },
  { key: 'saveProjectLabel', label: 'Save-project accessible label' },
  { key: 'removeBookmarkLabel', label: 'Remove-bookmark accessible label' },
  { key: 'openGithubLabel', label: 'GitHub button label' },
  { key: 'resumeEyebrow', label: 'Resume section eyebrow' },
  { key: 'resumeTitle', label: 'Resume section title' },
  { key: 'resumeAccent', label: 'Resume emphasized title' },
  { key: 'atsResumeTitle', label: 'ATS resume document title' },
  { key: 'modernResumeTitle', label: 'Modern resume document title' },
  { key: 'portfolioPdfTitle', label: 'Portfolio PDF document title' },
  { key: 'openPdfLabel', label: 'PDF button label' },
] as const;
