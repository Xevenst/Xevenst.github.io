export interface PortfolioProject {
  id: string;
  title: string;
  year: string;
  type: string;
  summary: string;
  details: string;
  technologies: string[];
  githubUrl: string;
  featured: boolean;
  accent: string;
}

export interface AboutPageContent {
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroBiography: string;
  heroRole: string;
  heroImageUrl: string;
  highlightOneValue: string;
  highlightOneLabel: string;
  highlightTwoValue: string;
  highlightTwoLabel: string;
  highlightThreeValue: string;
  highlightThreeLabel: string;
  highlightNote: string;
  highlightsLabel: string;
  onThisPageLabel: string;
  navIntroduction: string;
  navWork: string;
  navEducation: string;
  navExperience: string;
  navCommunity: string;
  navToolkit: string;
  navHobbies: string;
  introductionHeading: string;
  introductionCopy: string;
  availability: string;
  selectedWorkEyebrow: string;
  selectedWorkHeading: string;
  selectedWorkAccent: string;
  viewAllLabel: string;
  openGithubLabel: string;
  educationHeading: string;
  educationDegree: string;
  educationSchool: string;
  educationDetails: string;
  experienceHeading: string;
  experienceEntries: string;
  communityHeading: string;
  communityEntries: string;
  toolkitHeading: string;
  skills: string;
  languagesHeading: string;
  languages: string;
  coursesHeading: string;
  courses: string;
  hobbiesHeading: string;
  hobbiesDescription: string;
  hobbiesImageUrl: string;
  contactEyebrow: string;
  contactTitle: string;
  contactAccent: string;
  contactButton: string;
  contactEmail: string;
}

export interface PortfolioPageContent {
  eyebrow: string;
  title: string;
  titleAccent: string;
  introduction: string;
  projectCountLabel: string;
  dataLabel: string;
  signInToSaveLabel: string;
  viewSavedLabel: string;
  loadingLabel: string;
  signInRequiredMessage: string;
  saveProjectLabel: string;
  removeBookmarkLabel: string;
  openGithubLabel: string;
  resumeEyebrow: string;
  resumeTitle: string;
  resumeAccent: string;
  atsResumeTitle: string;
  modernResumeTitle: string;
  portfolioPdfTitle: string;
  openPdfLabel: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export interface StoredFile {
  id: string;
  name: string;
  driveFileId: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
  visibility: 'private' | 'public';
}

export interface DiaryEntry {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
