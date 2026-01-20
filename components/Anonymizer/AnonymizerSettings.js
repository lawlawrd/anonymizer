import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  NER_MODEL_OPTIONS,
  PRESET_STORAGE_KEY,
  DEFAULT_NER_MODEL,
  DEFAULT_ACCEPTANCE_THRESHOLD,
  DEFAULT_DEIDENTIFICATION_TYPE,
  DEFAULT_MASK_CHAR_COUNT,
  DEFAULT_MASK_CHAR,
  DEFAULT_ENCRYPT_KEY,
  DEIDENTIFICATION_TYPE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  ENTITY_TYPE_STORAGE_KEY,
  DEIDENTIFICATION_TYPE_STORAGE_KEY,
  MASK_CHAR_COUNT_STORAGE_KEY,
  MASK_CHAR_STORAGE_KEY,
  ENCRYPT_KEY_STORAGE_KEY,
  INITIAL_ENTITY_DISPLAY_LIMIT,
} from "./../../config/anonymizerConfig.js";

import {
  readStoredPresets,
  sortPresetsByName,
} from "./../../utils/anonymizerUtils.js";

import {
  updateAnonymizerStore,
  updateEntityTypeSelection,
  updateOpenFilters,
  updatePresets,
} from "./../../store/anonymizerStore.js";

const AnonymizerSettings = ({ selectedLanguage, localizedEntityOptions }) => {
  const dispatch = useDispatch();
  const {
    openFilters,
    selectedPresetId,
    isFetchingPresets,
    presets,
    nerModel,
    threshold,
    moreEntityOptions,
    entityTypeSelection,
    entityTypeFilter,
    allowlistText,
    denylistText,
    deidentificationType,
    maskCharCount,
    maskChar,
    encryptKey,
    presetStatusMessage,
    presetErrorMessage,
    isPersistingPreset,
  } = useSelector((state) => state.anonymizer);

  const handleOpenFilterToggle = useCallback((key, isOpenOrEvent) => {
    const isOpen =
      typeof isOpenOrEvent === "boolean"
        ? isOpenOrEvent
        : Boolean(isOpenOrEvent?.target?.checked);
    dispatch(updateOpenFilters({ key, isOpen }));
  }, []);

  const handlePresetSave = useCallback(() => {
    if (typeof window === "undefined") return;

    const requestedName = window.prompt("Give this preset a name:");
    if (requestedName === null) {
      return;
    }

    const trimmedName = requestedName.trim();
    if (trimmedName.length === 0) {
      dispatch(
        updateAnonymizerStore({
          presetStatusMessage: "",
          presetErrorMessage: "Preset name cannot be empty.",
        }),
      );
      return;
    }

    dispatch(
      updateAnonymizerStore({
        isPersistingPreset: true,
        presetStatusMessage: "",
        presetErrorMessage: "Preset name cannot be empty.",
      }),
    );

    try {
      const preset = {
        id: Date.now(),
        name: trimmedName,
        nerModel,
        threshold,
        allowlist: allowlistText,
        denylist: denylistText,
        entityTypes: requestedEntityTypes,
      };

      dispatch(updatePresets({ preset, movement: "add" }));
      dispatch(
        updateAnonymizerStore({
          selectedPresetId: String(preset.id),
          presetStatusMessage: `Saved preset "${preset.name}".`,
        }),
      );
    } catch (error) {
      console.error("Failed to save preset", error);
      dispatch(
        updateAnonymizerStore({
          selectedPresetId: "",
          presetStatusMessage: "Failed to save preset.",
        }),
      );
    } finally {
      dispatch(updateAnonymizerStore({ isPersistingPreset: false }));
    }
  }, [allowlistText, denylistText, nerModel, requestedEntityTypes, threshold]);

  const handlePresetLoad = useCallback(() => {
    if (!selectedPreset) {
      dispatch(
        updateAnonymizerStore({
          presetStatusMessage: "",
          presetErrorMessage: "Select a preset to load.",
        }),
      );
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("preferredNerModel", selectedPreset.nerModel);
    }

    const nextThreshold =
      typeof selectedPreset.threshold === "number"
        ? selectedPreset.threshold
        : DEFAULT_ACCEPTANCE_THRESHOLD;

    const enabledTypes = Array.isArray(selectedPreset.entityTypes)
      ? selectedPreset.entityTypes
      : [];
    const nextSelection = {};
    ENTITY_TYPE_OPTIONS.forEach((option) => {
      nextSelection[option.value] = enabledTypes.includes(option.value);
    });

    dispatch(
      updateAnonymizerStore({
        presetErrorMessage: "",
        nerModel: selectedPreset.nerModel,
        threshold: nextThreshold,
        allowlistText: selectedPreset.allowlist ?? "",
        denylistText: selectedPreset.denylist ?? "",
        entityTypeSelection: nextSelection,
        presetStatusMessage: `Loaded preset "${selectedPreset.name}".`,
      }),
    );
  }, [selectedPreset]);

  const handlePresetDelete = useCallback(() => {
    if (!selectedPreset) {
      dispatch(
        updateAnonymizerStore({
          presetStatusMessage: "",
          presetErrorMessage: "Select a preset to delete.",
        }),
      );
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Are you sure you want to delete preset "${selectedPreset.name}"?`,
      );
      if (!confirmed) {
        return;
      }
    }

    dispatch(
      updateAnonymizerStore({
        isPersistingPreset: true,
        presetStatusMessage: "",
        presetErrorMessage: "",
      }),
    );

    try {
      dispatch(updatePresets({ preset: selectedPreset, movement: "delete" }));
      dispatch(
        updateAnonymizerStore({
          selectedPresetId: "",
          presetStatusMessage: `Deleted preset "${selectedPreset.name}".`,
        }),
      );
    } catch (error) {
      console.error("Failed to delete preset", error);
      dispatch(
        updateAnonymizerStore({
          presetStatusMessage: "",
          presetErrorMessage: "Failed to delete preset.",
        }),
      );
    } finally {
      dispatch(
        updateAnonymizerStore({
          isPersistingPreset: false,
        }),
      );
    }
  }, [selectedPreset]);

  const selectedBuiltinEntityTypes = useMemo(
    () =>
      ENTITY_TYPE_OPTIONS.filter(
        (option) => entityTypeSelection[option.value] !== false,
      ).map((option) => option.value),
    [entityTypeSelection],
  );

  const selectedEntityTypeCount = useMemo(
    () => selectedBuiltinEntityTypes.length,
    [selectedBuiltinEntityTypes],
  );

  const filteredEntityOptions = useMemo(() => {
    const query = entityTypeFilter.trim().toLowerCase();
    if (!query) return localizedEntityOptions;

    return localizedEntityOptions.filter((option) => {
      const label = option.label.toLowerCase();
      const value = option.value.toLowerCase();
      const displayLabel = option.displayLabel.toLowerCase();
      const displayValue = option.displayValue.toLowerCase();
      return (
        label.includes(query) ||
        value.includes(query) ||
        displayLabel.includes(query) ||
        displayValue.includes(query)
      );
    });
  }, [entityTypeFilter, localizedEntityOptions]);

  const displayedEntityOptions = useMemo(
    () =>
      moreEntityOptions
        ? filteredEntityOptions
        : filteredEntityOptions.slice(0, INITIAL_ENTITY_DISPLAY_LIMIT),
    [filteredEntityOptions, moreEntityOptions],
  );

  const shouldShowMoreEntityOptions =
    !moreEntityOptions &&
    filteredEntityOptions.length > INITIAL_ENTITY_DISPLAY_LIMIT;

  const requestedEntityTypes = useMemo(
    () => [...selectedBuiltinEntityTypes],
    [selectedBuiltinEntityTypes],
  );

  const allowlistCount = useMemo(
    () =>
      allowlistText
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean).length,
    [allowlistText],
  );

  const denylistCount = useMemo(
    () =>
      denylistText
        .split(/[\n,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean).length,
    [denylistText],
  );

  const allEntityTypesSelected = useMemo(
    () =>
      ENTITY_TYPE_OPTIONS.every(
        (option) => entityTypeSelection[option.value] !== false,
      ),
    [entityTypeSelection],
  );

  const handleEntityTypeToggleAll = useCallback(() => {
    dispatch(updateEntityTypeSelection({ movement: "all" }));
  }, []);

  const entityTypeToggleLabel = allEntityTypesSelected
    ? "Deselect all"
    : "Select all";

  const selectedPreset = useMemo(() => {
    const parsedId = Number.parseInt(selectedPresetId, 10);
    if (!Number.isFinite(parsedId)) {
      return null;
    }

    return presets.find((preset) => preset.id === parsedId) ?? null;
  }, [presets, selectedPresetId]);

  useEffect(() => {
    dispatch(updateAnonymizerStore({ moreEntityOptions: false }));
  }, [selectedLanguage]);

  const loadPresets = useCallback(() => {
    dispatch(
      updateAnonymizerStore({
        isFetchingPresets: true,
        presetErrorMessage: "",
        presetStatusMessage: "",
      }),
    );

    try {
      const loadedPresets = sortPresetsByName(
        readStoredPresets(
          PRESET_STORAGE_KEY,
          DEFAULT_NER_MODEL,
          DEFAULT_ACCEPTANCE_THRESHOLD,
        ),
      );
      dispatch(updateAnonymizerStore({ presets: loadedPresets }));
      if (loadedPresets.length === 0)
        dispatch(updateAnonymizerStore({ selectedPresetId: "" }));
    } catch (error) {
      console.error("Failed to load presets", error);
      dispatch(
        updateAnonymizerStore({
          presetErrorMessage: "Failed to load presets.",
        }),
      );
    } finally {
      dispatch(updateAnonymizerStore({ isFetchingPresets: false }));
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  useEffect(() => {
    if (!presetStatusMessage) return;
    const timeout = window.setTimeout(() => {
      dispatch(updateAnonymizerStore({ presetStatusMessage: "" }));
    }, 4000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [presetStatusMessage]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        ENTITY_TYPE_STORAGE_KEY,
        JSON.stringify(selectedBuiltinEntityTypes),
      );
    } catch (storageError) {
      console.warn("Failed to persist entity type selection", storageError);
    }
  }, [selectedBuiltinEntityTypes]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        DEIDENTIFICATION_TYPE_STORAGE_KEY,
        deidentificationType,
      );
      window.localStorage.setItem(
        MASK_CHAR_COUNT_STORAGE_KEY,
        String(maskCharCount),
      );
      window.localStorage.setItem(MASK_CHAR_STORAGE_KEY, maskChar);
      window.localStorage.setItem(ENCRYPT_KEY_STORAGE_KEY, encryptKey);
    } catch (storageError) {
      console.warn(
        "Failed to persist de-identification preferences",
        storageError,
      );
    }
  }, [deidentificationType, maskCharCount, maskChar, encryptKey]);

  return (
    <aside
      className="sidebar expandable anonymizer-settings"
      style={{ minWidth: "0" }}
    >
      <div className="settings-group sidebar-group">
        <input
          type="checkbox"
          id="saved-presets"
          checked={openFilters.includes("saved-presets")}
          onChange={handleOpenFilterToggle.bind(null, "saved-presets")}
        />
        <label className="settings-label" htmlFor="saved-presets">
          <strong>Saved presets</strong>
          <svg className="icon chevron">
            <use xlinkHref="/images/icons.svg#chevron-down" />
          </svg>
        </label>
        <div className="sidebar-group-content">
          <select
            id="saved-presets-select"
            aria-label="Saved presets"
            value={selectedPresetId}
            onChange={(event) =>
              dispatch(
                updateAnonymizerStore({ selectedPresetId: event.target.value }),
              )
            }
            disabled={isFetchingPresets || presets.length === 0}
          >
            <option value="">
              {isFetchingPresets ? "Loading presets…" : "Select a preset"}
            </option>
            {presets.map((preset) => (
              <option key={preset.id} value={String(preset.id)}>
                {preset.name}
              </option>
            ))}
          </select>
          <div className="preset-actions">
            <button
              type="button"
              className="small"
              onClick={handlePresetSave}
              disabled={isPersistingPreset}
            >
              Save
            </button>
            <button
              type="button"
              className="primary small"
              onClick={handlePresetLoad}
              disabled={
                isPersistingPreset || isFetchingPresets || !selectedPreset
              }
            >
              Load
            </button>

            <div className="spacer" />

            <button
              type="button"
              className="negative small"
              onClick={handlePresetDelete}
              disabled={
                isPersistingPreset || isFetchingPresets || !selectedPreset
              }
              style={{ marginRight: "0" }}
            >
              Delete
            </button>
          </div>
          {presetErrorMessage && (
            <small className="settings-help error">{presetErrorMessage}</small>
          )}
          {!presetErrorMessage && presetStatusMessage && (
            <small className="settings-help">{presetStatusMessage}</small>
          )}
        </div>
      </div>

      <div className="settings-group sidebar-group">
        <input
          type="checkbox"
          id="ner-model"
          checked={openFilters.includes("ner-model")}
          onChange={handleOpenFilterToggle.bind(null, "ner-model")}
        />
        <label className="settings-label" htmlFor="ner-model">
          <strong>NER model</strong>
          <svg className="icon chevron">
            <use xlinkHref="/images/icons.svg#chevron-down" />
          </svg>
        </label>

        <div className="sidebar-group-content">
          <select
            id="ner-model"
            value={nerModel}
            onChange={(event) => {
              localStorage.setItem("preferredNerModel", event.target.value);
              dispatch(updateAnonymizerStore({ nerModel: event.target.value }));
            }}
          >
            {NER_MODEL_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="settings-group sidebar-group">
        <input
          type="checkbox"
          id="deidentification-type"
          checked={openFilters.includes("deidentification-type")}
          onChange={handleOpenFilterToggle.bind(null, "deidentification-type")}
        />
        <label className="settings-label" htmlFor="deidentification-type">
          <strong>De-identification type</strong>
          <svg className="icon chevron">
            <use xlinkHref="/images/icons.svg#chevron-down" />
          </svg>
        </label>
        <div className="sidebar-group-content">
          <select
            id="deidentification-type"
            value={deidentificationType}
            onChange={(event) =>
              dispatch(
                updateAnonymizerStore({
                  deidentificationType:
                    event.target.value || DEFAULT_DEIDENTIFICATION_TYPE,
                }),
              )
            }
          >
            {DEIDENTIFICATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {deidentificationType === "mask" && (
            <>
              <label htmlFor="mask-char-count">Number of characters</label>
              <input
                id="mask-char-count"
                type="number"
                min="1"
                value={maskCharCount}
                onChange={(event) => {
                  const nextValue = Number.parseInt(event.target.value, 10);
                  dispatch(
                    updateAnonymizerStore({
                      maskCharCount: Number.isNaN(nextValue)
                        ? DEFAULT_MASK_CHAR_COUNT
                        : nextValue,
                    }),
                  );
                }}
              />
              <label htmlFor="mask-char">Mask character</label>
              <input
                id="mask-char"
                type="text"
                maxLength={1}
                value={maskChar}
                onChange={(event) =>
                  dispatch(
                    updateAnonymizerStore({
                      maskChar: event.target.value || DEFAULT_MASK_CHAR,
                    }),
                  )
                }
              />
            </>
          )}
          {deidentificationType === "encrypt" && (
            <>
              <label htmlFor="encrypt-key">AES key</label>
              <input
                id="encrypt-key"
                type="text"
                value={encryptKey}
                onChange={(event) =>
                  dispatch(
                    updateAnonymizerStore({
                      encryptKey: event.target.value || DEFAULT_ENCRYPT_KEY,
                    }),
                  )
                }
              />
            </>
          )}
        </div>
      </div>
      <div className="settings-group sidebar-group">
        <input
          type="checkbox"
          id="acceptance-threshold"
          checked={openFilters.includes("acceptance-threshold")}
          onChange={handleOpenFilterToggle.bind(null, "acceptance-threshold")}
        />
        <label className="settings-label" htmlFor="acceptance-threshold">
          <strong>
            Acceptance threshold
            {!openFilters.includes("acceptance-threshold") && (
              <>
                {" "}
                <span className="tag black">{threshold.toFixed(2)}</span>
              </>
            )}
          </strong>
          <svg className="icon chevron">
            <use xlinkHref="/images/icons.svg#chevron-down" />
          </svg>
        </label>
        <div className="sidebar-group-content threshold-control">
          <input
            id="acceptance-threshold"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={threshold}
            onChange={(event) => {
              const nextValue = parseFloat(event.target.value);
              dispatch(
                updateAnonymizerStore({
                  threshold: Number.isNaN(nextValue) ? 0 : nextValue,
                }),
              );
            }}
          />
          <output htmlFor="acceptance-threshold">{threshold.toFixed(2)}</output>
        </div>
      </div>

      <div className="settings-group sidebar-group">
        <input
          type="checkbox"
          id="entity-types"
          checked={openFilters.includes("entity-types")}
          onChange={handleOpenFilterToggle.bind(null, "entity-types")}
        />
        <label className="settings-label" htmlFor="entity-types">
          <strong>
            Entity types
            {selectedEntityTypeCount > 0 && (
              <>
                {" "}
                <span className="tag blue">{selectedEntityTypeCount}</span>
              </>
            )}
          </strong>
          <svg className="icon chevron">
            <use xlinkHref="/images/icons.svg#chevron-down" />
          </svg>
        </label>
        <div className="sidebar-group-content">
          <form className="group" onSubmit={(event) => event.preventDefault()}>
            <svg className="icon">
              <use xlinkHref="/images/icons.svg#search" />
            </svg>
            <input
              type="text"
              className="prepend-icon"
              placeholder="Filter entity types"
              value={entityTypeFilter}
              onChange={(event) => {
                dispatch(
                  updateAnonymizerStore({
                    entityTypeFilter: event.target.value,
                    moreEntityOptions: false,
                  }),
                );
              }}
            />
          </form>
          <ul className="checkboxes settings-checkbox-list">
            {displayedEntityOptions.map((option) => (
              <li
                key={option.value}
                style={{
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                <input
                  type="checkbox"
                  id={`entity-type-${option.value}`}
                  checked={entityTypeSelection[option.value] !== false}
                  onChange={(event) =>
                    dispatch(
                      updateEntityTypeSelection({
                        movement: "single",
                        val: option.value,
                        isChecked: event.target.checked,
                      }),
                    )
                  }
                />
                <label
                  htmlFor={`entity-type-${option.value}`}
                  className="settings-checkbox"
                  title={`${option.displayLabel} (${option.displayValue})`}
                >
                  {option.displayLabel}
                  <span style={{ marginLeft: "0.4em", opacity: 0.7 }}>
                    ({option.displayValue})
                  </span>
                </label>
              </li>
            ))}
            {displayedEntityOptions.length === 0 && (
              <li key="no-entity-matches" className="empty">
                No matching entity types
              </li>
            )}
            {shouldShowMoreEntityOptions && (
              <li key="more-entity-options" className="more-entity-options">
                <a
                  href="#select-deselect-all"
                  tabIndex={0}
                  role="button"
                  onClick={(event) => {
                    event.preventDefault();
                    handleEntityTypeToggleAll();
                  }}
                >
                  {entityTypeToggleLabel}
                </a>
                <a
                  href="#more-entity-options"
                  tabIndex={0}
                  role="button"
                  onClick={(event) => {
                    event.preventDefault();
                    dispatch(
                      updateAnonymizerStore({ moreEntityOptions: true }),
                    );
                  }}
                >
                  More options
                </a>
              </li>
            )}
            {moreEntityOptions &&
              filteredEntityOptions.length > INITIAL_ENTITY_DISPLAY_LIMIT && (
                <li key="less-entity-options" className="less-entity-options">
                  <a
                    href="#select-deselect-all"
                    tabIndex={0}
                    role="button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleEntityTypeToggleAll();
                    }}
                  >
                    {entityTypeToggleLabel}
                  </a>
                  <a
                    href="#less-entity-options"
                    tabIndex={0}
                    role="button"
                    onClick={(event) => {
                      event.preventDefault();
                      dispatch(
                        updateAnonymizerStore({ moreEntityOptions: false }),
                      );
                    }}
                  >
                    Less options
                  </a>
                </li>
              )}
          </ul>
        </div>
      </div>

      <div className="settings-group sidebar-group">
        <input
          type="checkbox"
          id="allowlist"
          checked={openFilters.includes("allowlist")}
          onChange={handleOpenFilterToggle.bind(null, "allowlist")}
        />
        <label className="settings-label" htmlFor="allowlist">
          <strong>
            Allowlist
            {allowlistCount > 0 && (
              <>
                {" "}
                <span className="tag green">{allowlistCount}</span>
              </>
            )}
          </strong>
          <svg className="icon chevron">
            <use xlinkHref="/images/icons.svg#chevron-down" />
          </svg>
        </label>
        <div className="sidebar-group-content">
          <textarea
            id="allowlist"
            rows={6}
            placeholder="Comma or newline separated"
            value={allowlistText}
            onChange={(event) =>
              dispatch(
                updateAnonymizerStore({ allowlistText: event.target.value }),
              )
            }
          />
          <small className="settings-help">
            Matching terms remain visible.
          </small>
        </div>
      </div>

      <div className="settings-group sidebar-group">
        <input
          type="checkbox"
          id="denylist"
          checked={openFilters.includes("denylist")}
          onChange={handleOpenFilterToggle.bind(null, "denylist")}
        />
        <label className="settings-label" htmlFor="denylist">
          <strong>
            Denylist
            {denylistCount > 0 && (
              <>
                {" "}
                <span className="tag red">{denylistCount}</span>
              </>
            )}
          </strong>
          <svg className="icon chevron">
            <use xlinkHref="/images/icons.svg#chevron-down" />
          </svg>
        </label>
        <div className="sidebar-group-content">
          <textarea
            id="denylist"
            rows={6}
            placeholder="Comma or newline separated"
            value={denylistText}
            onChange={(event) =>
              dispatch(
                updateAnonymizerStore({ denylistText: event.target.value }),
              )
            }
          />
          <small className="settings-help">
            Matching terms are always redacted.
          </small>
        </div>
      </div>
    </aside>
  );
};

export default AnonymizerSettings;
