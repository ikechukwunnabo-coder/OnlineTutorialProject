export type Difficulty = "beginner" | "intermediate" | "advanced";

export type SearchResultType = "tutorial" | "chapter" | "category";

export interface CategoryRef {
  name: string;
  slug: string;
}

export interface CategoryDetailRef extends CategoryRef {
  id: number;
}

export interface Tag {
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  tutorial_count: number;
}

export interface HomeCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface HomeTutorial {
  title: string;
  slug: string;
  summary: string;
  category: CategoryRef;
  difficulty: Difficulty;
  estimated_reading_time: number;
  published_at: string;
}

export interface HomeData {
  site_name: string;
  featured_categories: HomeCategory[];
  latest_tutorials: HomeTutorial[];
  stats: {
    published_tutorials: number;
    published_chapters: number;
    published_categories: number;
  };
}

export interface TutorialListItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: CategoryRef;
  difficulty: Difficulty;
  estimated_reading_time: number;
  chapter_count: number;
  tags: Tag[];
  published_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CategoryTutorial {
  title: string;
  slug: string;
  summary: string;
  difficulty: Difficulty;
  estimated_reading_time: number;
  chapter_count: number;
  published_at: string;
}

export interface CategoryDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  tutorials: CategoryTutorial[];
}

export interface ChapterSummary {
  title: string;
  slug: string;
  order: number;
  estimated_reading_time: number;
  summary: string;
}

export interface ProgressSummary {
  completed_chapters: number;
  total_chapters: number;
  percent: number;
}

export interface TutorialDetail {
  id: number;
  title: string;
  slug: string;
  summary: string;
  category: CategoryDetailRef;
  author: { display_name: string };
  difficulty: Difficulty;
  estimated_reading_time: number;
  tags: Tag[];
  published_at: string;
  updated_at: string;
  chapters: ChapterSummary[];
  progress: ProgressSummary | null;
}

export interface CodeExample {
  language: string;
  title: string;
  source: string;
  expected_output: string;
  order: number;
}

export interface ChapterImage {
  url: string;
  alt_text: string;
  decorative: boolean;
  caption: string;
  order: number;
}

export interface VideoEmbed {
  provider: "youtube" | "vimeo";
  title: string;
  embed_url: string;
  order: number;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface ChapterNavigationItem {
  title: string;
  url: string;
}

export interface ChapterDetail {
  id: number;
  title: string;
  slug: string;
  order: number;
  summary: string;
  content_html: string;
  estimated_reading_time: number;
  published_at: string;
  updated_at: string;
  tutorial: {
    title: string;
    slug: string;
    chapter_count: number;
  };
  code_examples: CodeExample[];
  images: ChapterImage[];
  video_embeds: VideoEmbed[];
  toc: TocItem[];
  navigation: {
    previous: ChapterNavigationItem | null;
    next: ChapterNavigationItem | null;
  };
  bookmark: { saved: boolean };
  progress: { completed: boolean; reading_position: number } | null;
}

export interface SearchResult {
  type: SearchResultType;
  title: string;
  excerpt: string;
  url: string;
  tutorial?: { title: string; slug: string };
  score?: number;
}

export type SearchResults = Paginated<SearchResult>;

export interface SearchSuggestion {
  title: string;
  url: string;
  type: SearchResultType;
}

export interface SearchSuggestions {
  suggestions: SearchSuggestion[];
}

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

export interface ContactResponse {
  message: string;
}

export type UserRole = "learner" | "editor" | "admin";

export interface UserSummary {
  id: number;
  email: string;
  role: UserRole;
  display_name: string;
  email_verified: boolean;
  date_joined: string;
}

export interface UserProfile extends UserSummary {
  bio: string;
}

export interface MeResponse {
  authenticated: boolean;
  user: UserProfile | null;
}

export interface LoginResponse {
  user: UserSummary;
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
  user: UserSummary;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileInput {
  display_name?: string;
  bio?: string;
}

export interface PasswordChangeInput {
  current_password: string;
  new_password: string;
}

export interface PasswordResetConfirmInput {
  uid: string;
  token: string;
  new_password: string;
}

export interface BookmarkChapter {
  id: number;
  title: string;
  slug: string;
  tutorial: {
    title: string;
    slug: string;
  };
  estimated_reading_time: number;
}

export interface Bookmark {
  id: number;
  chapter: BookmarkChapter;
  created_at: string;
}

export type BookmarkPage = Paginated<Bookmark>;

export interface ProgressRecord {
  chapter: number;
  completed: boolean;
  completed_at: string | null;
  reading_position: number;
  updated_at: string;
}

export interface ProgressUpdateInput {
  completed?: boolean;
  reading_position?: number;
}

export interface ProgressTutorialItem {
  tutorial: {
    title: string;
    slug: string;
  };
  completed_chapters: number;
  total_chapters: number;
  percent: number;
  last_activity_at: string;
}

export interface ProgressOverview {
  overall: {
    completed_chapters: number;
    started_tutorials: number;
    percent_complete: number;
  };
  tutorials: ProgressTutorialItem[];
}
