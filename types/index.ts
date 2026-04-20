// ─── Book / Search Types ───────────────────────────────────────

export interface WorkSearchResult {
  /** Internal composite ID, e.g. "ol:OL12345W" or merged key */
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  firstPublishYear?: number;
  /** Best available thumbnail URL for search results list */
  thumbnail?: string;
  /** Number of editions found across providers */
  editionCount: number;
  /** Combined relevance score (0–100) */
  score: number;
  /** Provider keys that contributed to this result */
  sources: ('openLibrary' | 'googleBooks')[];
  /** Open Library work key, e.g. "/works/OL12345W" */
  olWorkKey?: string;
  /** Google Books volume ID */
  gbVolumeId?: string;
}

export interface EditionCandidate {
  id: string;
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  covers: CoverCandidate[];
  source: 'openLibrary' | 'googleBooks';
}

export interface CoverCandidate {
  id: string;
  url: string;
  /** Proxied URL for reliable access */
  proxyUrl: string;
  width?: number;
  height?: number;
  source: 'openLibrary' | 'googleBooks';
  /** Combined quality score (0–100) */
  score: number;
  /** Whether this is the recommended cover */
  recommended?: boolean;
  /** Inspected server-side */
  inspected: boolean;
}

export interface CoverDimensions {
  width: number;
  height: number;
  format?: string;
}

// ─── Scene / Story Types ───────────────────────────────────────

export type StoryStyle = 'dreamy' | 'retro' | 'cinematic';

export interface StoryScene {
  /** Cover image URL (proxied) */
  coverUrl: string;
  /** Cover dimensions for layout computation */
  coverWidth: number;
  coverHeight: number;
  title: string;
  author: string;
  /** 0–5, increments of 0.5. Undefined = hidden */
  rating?: number;
  /** ISO date string. Undefined = hidden */
  finishedDate?: string;
  style: StoryStyle;
  /** Extracted palette from cover */
  palette: ColorPalette;
  /** Whether to show branding watermark */
  showBranding: boolean;
}

export interface ColorPalette {
  dominant: string;
  vibrant: string;
  muted: string;
  darkMuted: string;
  lightMuted: string;
  /** Auto-selected text color for best contrast */
  textColor: string;
  /** Secondary text / subtle elements */
  textSecondary: string;
}

export interface StyleTokens {
  style: StoryStyle;
  /** Background strategy: gradient def, solid, or textured */
  background: string;
  /** Background overlay/blur layer */
  overlay?: string;
  /** Card/container background if applicable */
  cardBg?: string;
  /** Primary text color */
  textPrimary: string;
  /** Secondary/muted text color */
  textSecondary: string;
  /** Rating star color */
  starColor: string;
  /** Font family for title */
  titleFont: string;
  /** Font family for meta text */
  metaFont: string;
  /** Safe zone padding (px at 1080 width) */
  safeZonePadding: number;
}

// ─── Wizard State ──────────────────────────────────────────────

export type WizardStep = 'intro' | 'search' | 'work' | 'cover' | 'customize' | 'export';

export interface WizardState {
  step: WizardStep;
  query: string;
  results: WorkSearchResult[];
  selectedWork: WorkSearchResult | null;
  covers: CoverCandidate[];
  selectedCover: CoverCandidate | null;
  /** User-uploaded cover data URL */
  uploadedCover: string | null;
  scene: Partial<StoryScene>;
  /** Manual entry mode */
  manualMode: boolean;
  manualTitle: string;
  manualAuthor: string;
  isSearching: boolean;
  isLoadingCovers: boolean;
  isExporting: boolean;
  exportedImageUrl: string | null;
}

// ─── API Types ─────────────────────────────────────────────────

export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  results: WorkSearchResult[];
  query: string;
  timing: number;
}

export interface CoversRequest {
  workId: string;
}

export interface CoversResponse {
  covers: CoverCandidate[];
  workId: string;
}

export interface ExportRequest {
  scene: StoryScene;
}

// ─── Provider Types ────────────────────────────────────────────

export interface BookProvider {
  name: string;
  search(query: string): Promise<WorkSearchResult[]>;
  getCovers(workId: string): Promise<CoverCandidate[]>;
}
