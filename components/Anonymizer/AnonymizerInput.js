import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";

import Editor from "../Editor/index.js";

import {
  INITIAL_EDITOR_STATE,
  DEFAULT_ACCEPTANCE_THRESHOLD,
  API_ROUTES,
  DEFAULT_NER_MODEL,
  ENTITY_TYPE_OPTIONS,
} from "./../../config/anonymizerConfig.js";

import { updateAnonymizerStore } from "../../store/anonymizerStore.js";

import {
  buildEntityId,
  applyAnonymizationToHtml,
  redactTextByEntities,
  plainTextToHtml,
} from "../../utils/anonymizerUtils.js";

const AnonymizerInput = ({ selectedLanguage, localizedEntityOptions }) => {
  const dispatch = useDispatch();
  const {
    nerModel,
    threshold,
    editorState,
    statusMessage,
    errorMessage,
    resetSignal,
    allowlistText,
    denylistText,
    entityTypeSelection,
    deidentificationType,
    maskCharCount,
    maskChar,
    encryptKey,
    isSubmitting,
  } = useSelector((state) => state.anonymizer);

  const hasContent = editorState.text.trim().length > 0;

  const selectedBuiltinEntityTypes = useMemo(
    () =>
      ENTITY_TYPE_OPTIONS.filter(
        (option) => entityTypeSelection[option.value] !== false,
      ).map((option) => option.value),
    [entityTypeSelection],
  );

  const requestedEntityTypes = useMemo(
    () => [...selectedBuiltinEntityTypes],
    [selectedBuiltinEntityTypes],
  );

  const entityTypeDisplayValueMap = useMemo(() => {
    const map = new Map();
    localizedEntityOptions.forEach((option) => {
      map.set(option.value, option.displayValue);
    });
    return map;
  }, [localizedEntityOptions]);

  const localizeEntityPlaceholders = useCallback(
    (input) => {
      if (typeof input !== "string" || input.length === 0) {
        return typeof input === "string" ? input : "";
      }

      let output = input;
      entityTypeDisplayValueMap.forEach((displayValue, originalValue) => {
        if (!displayValue || displayValue === originalValue) {
          return;
        }

        const plainPattern = new RegExp(`<${originalValue}>`, "g");
        const encodedPattern = new RegExp(`&lt;${originalValue}&gt;`, "g");
        output = output.replace(plainPattern, `<${displayValue}>`);
        output = output.replace(encodedPattern, `&lt;${displayValue}&gt;`);
      });

      return output;
    },
    [entityTypeDisplayValueMap],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!hasContent) {
        dispatch(
          updateAnonymizerStore({
            errorMessage: "Please provide some text first.",
          }),
        );
        return;
      }

      const submission = {
        html: editorState.html,
        text: editorState.text,
      };

      const requestLanguage =
        typeof selectedLanguage === "string" && selectedLanguage.length > 0
          ? selectedLanguage
          : "en";

      dispatch(
        updateAnonymizerStore({
          isSubmitting: true,
          errorMessage: "",
          statusMessage: "Contacting Presidio services...",
        }),
      );

      try {
        const response = await fetch(API_ROUTES.anonymize, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: submission.text,
            language: requestLanguage,
            nerModel,
            threshold,
            allowlist: allowlistText,
            denylist: denylistText,
            entityTypes: requestedEntityTypes,
            deidentificationType,
            maskCharCount,
            maskChar,
            encryptKey,
          }),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Anonymization request failed.");
        }

        const data = await response.json();
        const rawEntities = Array.isArray(data?.entities) ? data.entities : [];
        const items = Array.isArray(data?.items) ? data.items : [];
        const anonymizedText =
          deidentificationType === "redact"
            ? redactTextByEntities(submission.text, rawEntities)
            : typeof data?.anonymizedText === "string"
            ? data.anonymizedText
            : submission.text;
        const localizedResultText =
          rawEntities.length > 0
            ? localizeEntityPlaceholders(anonymizedText)
            : anonymizedText;
        const initialToggles = Object.fromEntries(
          rawEntities.map((entity, index) => [
            buildEntityId(entity, index),
            true,
          ]),
        );
        const anonymizedHtml = applyAnonymizationToHtml(
          submission.html,
          submission.text,
          items,
          rawEntities.map((entity) => ({ ...entity })),
          {
            entityTypeDisplayMap: entityTypeDisplayValueMap,
            deidentificationType,
          },
        );
        const outputHtml =
          deidentificationType === "redact" && items.length === 0
            ? plainTextToHtml(anonymizedText)
            : anonymizedHtml;

        dispatch(
          updateAnonymizerStore({
            results: {
              anonymizedText: localizedResultText,
              anonymizedHtml: outputHtml,
              entities: rawEntities,
              items,
            },
            lastSubmittedText: submission.text,
            lastSubmittedHtml: submission.html,
            entityToggles: initialToggles,
            displayHtml: outputHtml,
            statusMessage: "Done!",
          }),
        );
      } catch (error) {
        console.error(error);
        dispatch(
          updateAnonymizerStore({
            errorMessage:
              "Anonymization failed. Ensure the Presidio services are reachable.",
            statusMessage: "",
          }),
        );
      } finally {
        dispatch(
          updateAnonymizerStore({
            isSubmitting: false,
          }),
        );
      }
    },
    [
      editorState.html,
      editorState.text,
      hasContent,
      nerModel,
      threshold,
      allowlistText,
      denylistText,
      requestedEntityTypes,
      deidentificationType,
      maskCharCount,
      maskChar,
      encryptKey,
      selectedLanguage,
      entityTypeDisplayValueMap,
      localizeEntityPlaceholders,
    ],
  );

  const handleReset = useCallback(() => {
    dispatch(
      updateAnonymizerStore({
        editorState: { ...INITIAL_EDITOR_STATE },
        results: {
          anonymizedText: "",
          anonymizedHtml: "",
          entities: [],
          items: [],
        },
        statusMessage: "",
        errorMessage: "",
        resetSignal: (value) => value + 1,
        lastSubmittedText: "",
        lastSubmittedHtml: "",
        entityToggles: {},
        displayHtml: "",
        threshold: DEFAULT_ACCEPTANCE_THRESHOLD,
        allowlistText: "",
        denylistText: "",
        nerModel: DEFAULT_NER_MODEL,
        entityTypeSelection:
          buildDefaultEntityTypeSelection(ENTITY_TYPE_OPTIONS),
        saveStatusMessage: "",
        saveErrorMessage: "",
        suggestionsOpen: false,
      }),
    );
  }, []);

  return (
    <form className={`anonymizer-input`} onSubmit={handleSubmit}>
      <div id="anonymizer-editor-input" className="editor-field">
        <Editor
          editorSize="medium"
          initState={INITIAL_EDITOR_STATE}
          updateState={(state) =>
            dispatch(updateAnonymizerStore({ editorState: state }))
          }
          resetState={resetSignal}
          externalState={null}
          placeholder="Write or paste the text you want to anonymize..."
        />
      </div>

      <div className="header">
        <div>
          <strong>Input</strong>
          <br />
          {statusMessage && (
            <span className="help" role="status" aria-live="polite">
              {statusMessage}
            </span>
          )}
          {errorMessage && (
            <span className="help error" role="alert">
              {errorMessage}
            </span>
          )}
        </div>
        <div className="spacer" />

        <button type="button" onClick={handleReset} disabled={isSubmitting}>
          Clear
        </button>
        <button
          type="submit"
          className="primary"
          disabled={isSubmitting}
          style={{ marginRight: "0" }}
        >
          {isSubmitting ? "Processing…" : "Anonymize"}
        </button>
      </div>
    </form>
  );
};

export default AnonymizerInput;
