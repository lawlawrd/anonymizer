import React, { useCallback, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch, useSelector } from "react-redux";

import AnonymizerHeader from "./AnonymizerHeader.js";
import AnonymizerInput from "./AnonymizerInput.js";
import AnonymizerOutput from "./AnonymizerOutput.js";
import AnonymizerFindings from "./AnonymizerFindings.js";
import AnonymizerSettings from "./AnonymizerSettings.js";
import AnonymizerHelpDialog from "./AnonymizerHelpDialog.js";

import { store } from "./../../store/index.js";

import {
  applyAnonymizationToHtml,
  buildEntityId,
} from "./../../utils/anonymizerUtils.js";

import {
  NER_MODEL_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  ENTITY_TYPE_TRANSLATIONS,
} from "./../../config/anonymizerConfig.js";

import { updateAnonymizerStore, updateResults } from "../../store/anonymizerStore.js";

const Anonymizer = () => {
  const dispatch = useDispatch();

  const {
    lastSubmittedText,
    lastSubmittedHtml,
    entityToggles,
    results,
    nerModel,
    deidentificationType,
    helpDialogActive,
  } = useSelector((state) => state.anonymizer);

  const selectedModel = useMemo(
    () =>
      NER_MODEL_OPTIONS.find((option) => option.value === nerModel) ??
      NER_MODEL_OPTIONS[0],
    [nerModel],
  );
  const selectedLanguage = selectedModel?.language ?? "en";

  const localizedEntityOptions = useMemo(() => {
    const translations = ENTITY_TYPE_TRANSLATIONS[selectedLanguage] ?? {};
    return ENTITY_TYPE_OPTIONS.map((option) => {
      const translation = translations[option.value];
      return {
        ...option,
        displayLabel: translation?.label ?? option.label,
        displayValue: translation?.value ?? option.value,
      };
    });
  }, [selectedLanguage]);

  const entityTypeDisplayValueMap = useMemo(() => {
    const map = new Map();
    localizedEntityOptions.forEach((option) => {
      map.set(option.value, option.displayValue);
    });
    return map;
  }, [localizedEntityOptions]);

  useEffect(() => {
    if (!helpDialogActive) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dispatch(updateAnonymizerStore({ helpDialogActive: false }));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [helpDialogActive]);

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

  useEffect(() => {
    if (!lastSubmittedHtml) {
      dispatch(updateAnonymizerStore({ displayHtml: "" }));
      return;
    }

    if (!Array.isArray(results.entities)) {
      dispatch(updateAnonymizerStore({ displayHtml: lastSubmittedHtml }));
      return;
    }

    const activeEntities = results.entities
      .map((entity, index) => ({ entity, index }))
      .filter(({ entity, index }) => {
        const id = buildEntityId(entity, index);
        return entityToggles[id] !== false;
      })
      .map(({ entity }) => ({ ...entity }));

    const html = applyAnonymizationToHtml(
      lastSubmittedHtml,
      lastSubmittedText,
      results.items,
      activeEntities,
      {
        entityTypeDisplayMap: entityTypeDisplayValueMap,
        deidentificationType,
      },
    );

		dispatch(updateResults({ html, localizeEntityPlaceholders }));
		dispatch(updateAnonymizerStore({ displayHtml: html }));
  }, [
    entityToggles,
    lastSubmittedHtml,
    lastSubmittedText,
    results.entities,
    results.items,
    entityTypeDisplayValueMap,
    deidentificationType,
    localizeEntityPlaceholders,
  ]);

  return (
    <>
      <AnonymizerHeader />

      <main className="anonymizer-wrapper">
        <AnonymizerInput {...{ selectedLanguage, localizedEntityOptions }} />
        <AnonymizerOutput />
        <AnonymizerFindings {...{ localizedEntityOptions }} />
        <AnonymizerSettings {...{ selectedLanguage, localizedEntityOptions }} />

        {helpDialogActive ? <AnonymizerHelpDialog /> : undefined}
      </main>
    </>
  );
};

const container = document.getElementById("anonymizer");
if (container) {
  const root = createRoot(container);
  root.render(
    <Provider {...{ store }}>
      <Anonymizer />
    </Provider>,
  );
}
