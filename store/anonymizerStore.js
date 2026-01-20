import { createSlice } from "@reduxjs/toolkit";

import {
  buildDefaultEntityTypeSelection,
  readStoredDeidentificationType,
  readStoredMaskCharCount,
  readStoredMaskChar,
  readStoredEncryptKey,
  sortPresetsByName,
  persistPresets,
} from "./../utils/anonymizerUtils.js";

import {
  DEFAULT_ACCEPTANCE_THRESHOLD,
  DEFAULT_DEIDENTIFICATION_TYPE,
  DEFAULT_MASK_CHAR_COUNT,
  DEFAULT_MASK_CHAR,
  DEFAULT_ENCRYPT_KEY,
  INITIAL_EDITOR_STATE,
  THEME_STORAGE_KEY,
  THEME_LIGHT,
  THEME_DARK,
  DEFAULT_NER_MODEL,
  ENTITY_TYPE_OPTIONS,
  ENTITY_TYPE_STORAGE_KEY,
  DEIDENTIFICATION_TYPE_OPTIONS,
  DEIDENTIFICATION_TYPE_STORAGE_KEY,
  MASK_CHAR_COUNT_STORAGE_KEY,
  MASK_CHAR_STORAGE_KEY,
  ENCRYPT_KEY_STORAGE_KEY,
  PRESET_STORAGE_KEY,
} from "./../config/anonymizerConfig.js";

const initialState = {
  nerModel: DEFAULT_NER_MODEL,
  editorState: INITIAL_EDITOR_STATE,
  statusMessage: "",
  errorMessage: "",
  resetSignal: 0,
  isSubmitting: false,
  lastSubmittedText: "",
  displayHtml: "",
  lastSubmittedHtml: "",
  threshold: DEFAULT_ACCEPTANCE_THRESHOLD,
  deidentificationType: readStoredDeidentificationType(
    DEIDENTIFICATION_TYPE_STORAGE_KEY,
    DEIDENTIFICATION_TYPE_OPTIONS,
    DEFAULT_DEIDENTIFICATION_TYPE,
  ),
  maskCharCount: readStoredMaskCharCount(
    MASK_CHAR_COUNT_STORAGE_KEY,
    DEFAULT_MASK_CHAR_COUNT,
  ),
  maskChar: readStoredMaskChar(MASK_CHAR_STORAGE_KEY, DEFAULT_MASK_CHAR),
  encryptKey: readStoredEncryptKey(
    ENCRYPT_KEY_STORAGE_KEY,
    DEFAULT_ENCRYPT_KEY,
  ),
  allowlistText: "",
  denylistText: "",
  entityToggles: {},
  entityTypeSelection: () => {
    const defaults = buildDefaultEntityTypeSelection(ENTITY_TYPE_OPTIONS);

    if (typeof window === "undefined") return defaults;

    try {
      const stored = window.localStorage.getItem(ENTITY_TYPE_STORAGE_KEY);
      if (!stored) return defaults;

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return defaults;

      const allowed = new Set(
        parsed
          .map((value) =>
            typeof value === "string" ? value.trim().toUpperCase() : null,
          )
          .filter(Boolean),
      );

      if (allowed.size === 0) return defaults;

      const restored = {};
      ENTITY_TYPE_OPTIONS.forEach((option) => {
        restored[option.value] = allowed.has(option.value);
      });

      return restored;
    } catch (storageError) {
      console.warn(
        "Failed to read stored entity type preferences",
        storageError,
      );
      return defaults;
    }
  },
  results: {
    anonymizedText: "",
    anonymizedHtml: "",
    entities: [],
    items: [],
  },
  openFilters: JSON.parse(localStorage.getItem("openFilters")) || ["ner-model"],
  copiedPlainText: false,
  copiedHTML: false,
  moreEntityOptions: false,
  entityTypeFilter: "",
  presets: [],
  selectedPresetId: "",
  isFetchingPresets: false,
  isPersistingPreset: false,
  presetStatusMessage: "",
  presetErrorMessage: "",
  theme: () => {
    if (typeof window === "undefined") {
      return THEME_LIGHT;
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  },
  helpDialogActive: false,
};

export const anonymizerStore = createSlice({
  name: "anonymizer",
  initialState,
  reducers: {
    updateAnonymizerStore: (state, action) => {
      const { payload } = action;
      if (payload && Object.entries(payload).length > 0) {
        for (let [key, val] of Object.entries(payload)) {
          state[key] =
            typeof val === "object" && !Array.isArray(val) && val !== null
              ? { ...state[key], ...val }
              : val;

          if (
            key == "pageSize" ||
            key == "sortMethod" ||
            key == "sortDirection"
          )
            localStorage.setItem(
              "customers" + key.charAt(0).toUpperCase() + key.slice(1),
              val,
            );
        }
      }
    },
    updateEntityToggles: (state, action) => {
      const { id, isChecked } = action.payload;
      state.entityToggles = { ...state.entityToggles, [id]: isChecked };
    },
    updateEntityToggleAll: (state, action) => {
      const { isChecked } = action.payload;
      if (state.findings.length !== 0) {
        const next = { ...state.entityToggles };
        const newEntityToggles = state.findings.map((finding) => {
          next[finding.id] = isChecked;
        });
        state.entityToggles = newEntityToggles;
      }
    },
    updateOpenFilters: (state, action) => {
      const { key, isOpen } = action.payload;
      const updated = isOpen
        ? Array.from(new Set([...state.openFilters, key]))
        : state.openFilters.filter((k) => k !== key);
      localStorage.setItem("openFilters", JSON.stringify(updated));
      state.openFilters = updated;
    },
    updatePresets: (state, action) => {
      const { preset, movement } = action.preload;
      let updated;
      if (movement == "add") {
        updated = sortPresetsByName([...state.presets, preset]);
      } else if (movement == "delete") {
        updated = state.presets.filter((item) => item.id !== selectedPreset.id);
      }
      persistPresets(updated, PRESET_STORAGE_KEY);
      state.presets = updated;
    },
    updateEntityTypeSelection: (state, action) => {
      const { movement, val, isChecked } = action.payload;
      let updated = {};
      if (movement == "all") {
        const nextValue = !ENTITY_TYPE_OPTIONS.every(
          (option) => state.entityTypeSelection[option.value] !== false,
        );
        ENTITY_TYPE_OPTIONS.forEach((option) => {
          updated[option.value] = nextValue;
        });
      } else if (movement == "single") {
        updated = {
          ...state.entityTypeSelection,
          [val]: isChecked,
        };
      }
      state.entityTypeSelection = updated;
    },
    updateResults: (state, action) => {
      const { html, localizeEntityPlaceholders } = action.payload;
      const newResults =
        state.results.anonymizedHtml === html
          ? state.results
          : {
              ...state.results,
              anonymizedHtml: html,
              anonymizedText: localizeEntityPlaceholders(
                state.results.anonymizedText,
              ),
            };
      state.results = newResults;
    },
  },
});

export const {
  updateAnonymizerStore,
  updateEntityToggles,
  updateEntityToggleAll,
  updateOpenFilters,
  updatePresets,
  updateEntityTypeSelection,
  updateResults,
} = anonymizerStore.actions;

export default anonymizerStore.reducer;
