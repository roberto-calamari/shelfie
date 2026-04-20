import { create } from 'zustand';
import type { WizardState, WizardStep, WorkSearchResult, CoverCandidate, StoryScene, ColorPalette, StoryStyle } from '@/types';
import { buildScene } from '@/lib/scene';
import { todayISO } from '@/lib/formatting';

interface WizardActions {
  setStep: (step: WizardStep) => void;
  setQuery: (query: string) => void;
  setResults: (results: WorkSearchResult[]) => void;
  selectWork: (work: WorkSearchResult) => void;
  setCovers: (covers: CoverCandidate[]) => void;
  selectCover: (cover: CoverCandidate) => void;
  setUploadedCover: (dataUrl: string) => void;
  setPalette: (palette: ColorPalette) => void;
  setStyle: (style: StoryStyle) => void;
  setRating: (rating: number | undefined) => void;
  setFinishedDate: (date: string | undefined) => void;
  setShowBranding: (show: boolean) => void;
  setTitleOverride: (title: string) => void;
  setAuthorOverride: (author: string) => void;
  setManualMode: (manual: boolean) => void;
  setManualTitle: (title: string) => void;
  setManualAuthor: (author: string) => void;
  setIsSearching: (searching: boolean) => void;
  setIsLoadingCovers: (loading: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  setExportedImageUrl: (url: string | null) => void;
  getScene: () => StoryScene;
  reset: () => void;
}

const initialState: WizardState = {
  step: 'intro',
  query: '',
  results: [],
  selectedWork: null,
  covers: [],
  selectedCover: null,
  uploadedCover: null,
  scene: {},
  manualMode: false,
  manualTitle: '',
  manualAuthor: '',
  isSearching: false,
  isLoadingCovers: false,
  isExporting: false,
  exportedImageUrl: null,
};

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),

  selectWork: (work) =>
    set({
      selectedWork: work,
      scene: {
        ...get().scene,
        title: work.title,
        author: work.authors.length ? `by ${work.authors.join(', ')}` : '',
        finishedDate: todayISO(),
      },
    }),

  setCovers: (covers) => set({ covers }),

  selectCover: (cover) =>
    set({
      selectedCover: cover,
      uploadedCover: null,
      scene: {
        ...get().scene,
        coverUrl: cover.proxyUrl,
        coverWidth: cover.width,
        coverHeight: cover.height,
      },
    }),

  setUploadedCover: (dataUrl) =>
    set({
      uploadedCover: dataUrl,
      selectedCover: null,
    }),

  setPalette: (palette) =>
    set({ scene: { ...get().scene, palette } }),

  setStyle: (style) =>
    set({ scene: { ...get().scene, style } }),

  setRating: (rating) =>
    set({ scene: { ...get().scene, rating } }),

  setFinishedDate: (finishedDate) =>
    set({ scene: { ...get().scene, finishedDate } }),

  setShowBranding: (showBranding) =>
    set({ scene: { ...get().scene, showBranding } }),

  setTitleOverride: (title) =>
    set({ scene: { ...get().scene, title } }),

  setAuthorOverride: (author) =>
    set({ scene: { ...get().scene, author } }),

  setManualMode: (manualMode) => set({ manualMode }),
  setManualTitle: (manualTitle) => set({ manualTitle }),
  setManualAuthor: (manualAuthor) => set({ manualAuthor }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setIsLoadingCovers: (isLoadingCovers) => set({ isLoadingCovers }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setExportedImageUrl: (exportedImageUrl) => set({ exportedImageUrl }),

  getScene: () => {
    const state = get();
    return buildScene({
      work: state.selectedWork,
      cover: state.selectedCover,
      uploadedCover: state.uploadedCover,
      palette: state.scene.palette as ColorPalette | undefined,
      style: state.scene.style as StoryStyle | undefined,
      rating: state.scene.rating as number | undefined,
      finishedDate: state.scene.finishedDate as string | undefined,
      showBranding: state.scene.showBranding as boolean | undefined,
      titleOverride: state.scene.title as string | undefined,
      authorOverride: state.scene.author as string | undefined,
    });
  },

  reset: () => set(initialState),
}));
