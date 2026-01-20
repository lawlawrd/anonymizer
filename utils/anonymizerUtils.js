export const formatConfidence = (value) => {
  if (typeof value !== "number") return "--";
  return `${Math.round(value * 1000) / 10}%`;
};

export const resolveDisplayEntityType = (entityType, displayMap) => {
  if (typeof entityType !== "string" || entityType.length === 0) {
    return entityType;
  }

  if (!displayMap) {
    return entityType;
  }

  if (displayMap instanceof Map) {
    return displayMap.get(entityType) ?? entityType;
  }

  if (typeof displayMap === "object") {
    return displayMap[entityType] ?? entityType;
  }

  return entityType;
};

export const applyAnonymizationToHtml = (
  html,
  plainText,
  items,
  entities,
  { entityTypeDisplayMap, deidentificationType } = {},
) => {
  let sanitizedHtml = typeof html === "string" ? html : "";

  if (!Array.isArray(entities) || entities.length === 0) {
    return sanitizedHtml;
  }

  const replacementByEntity = new WeakMap();
  if (Array.isArray(items) && items.length > 0) {
    const entityOrder = entities
      .filter(
        (entity) =>
          typeof entity?.start === "number" &&
          typeof entity?.end === "number" &&
          entity.end > entity.start,
      )
      .sort((a, b) => a.start - b.start || a.end - b.end);
    const itemOrder = items
      .filter(
        (item) =>
          typeof item?.start === "number" &&
          typeof item?.end === "number" &&
          item.end > item.start,
      )
      .sort((a, b) => a.start - b.start || a.end - b.end);

    const pairCount = Math.min(entityOrder.length, itemOrder.length);
    for (let index = 0; index < pairCount; index += 1) {
      replacementByEntity.set(entityOrder[index], itemOrder[index]?.text ?? "");
    }
  }

  if (typeof plainText === "string") {
    entities.forEach((entity) => {
      if (
        entity &&
        typeof entity.start === "number" &&
        typeof entity.end === "number" &&
        entity.end > entity.start
      ) {
        entity.foundText = plainText.slice(entity.start, entity.end);
      }
    });
  }

  const sortedEntities = [...entities].sort((a, b) => {
    const aLength = typeof a?.foundText === "string" ? a.foundText.length : 0;
    const bLength = typeof b?.foundText === "string" ? b.foundText.length : 0;
    return bLength - aLength;
  });

  const itemMap = new Map();
  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (typeof item?.start === "number" && typeof item?.end === "number") {
        const key = `${item.start}-${item.end}-${item.entity_type ?? ""}`;
        itemMap.set(key, item);
      }
    });
  }

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  sortedEntities.forEach((entity) => {
    if (
      entity &&
      typeof entity.foundText === "string" &&
      entity.foundText.length > 0
    ) {
      const start = entity?.start;
      const end = entity?.end;
      const entityType = entity?.entity_type ?? "";
      const itemKey = `${start ?? ""}-${end ?? ""}-${entityType}`;
      const matchedItem = itemMap.get(itemKey);
      const pairedReplacement = replacementByEntity.get(entity);
      const displayEntityType = resolveDisplayEntityType(
        entityType,
        entityTypeDisplayMap,
      );
      const replacement = (() => {
        if (deidentificationType === "highlight") {
          return `<mark>${escapeHtml(entity.foundText)}</mark>`;
        }

        if (deidentificationType === "redact") {
          return "";
        }

        if (typeof pairedReplacement === "string" && pairedReplacement.length) {
          return escapeHtml(pairedReplacement);
        }

        if (matchedItem && typeof matchedItem.text === "string") {
          return escapeHtml(matchedItem.text);
        }

        if (displayEntityType && displayEntityType.length > 0) {
          return `&lt;${displayEntityType}&gt;`;
        }

        return "&lt;REDACTED&gt;";
      })();
      const escapedFoundText = entity.foundText.replace(
        /[-\/\\^$*+?.()|[\]{}]/g,
        "\\$&",
      );
      const regex = new RegExp(escapedFoundText, "g");
      sanitizedHtml = sanitizedHtml.replace(regex, replacement);
    }
  });

  return sanitizedHtml;
};

export const buildEntityId = (entity, fallbackIndex) => {
  const entityType = entity?.entity_type ?? "";
  const start = typeof entity?.start === "number" ? entity.start : undefined;
  return `${entityType}-${start ?? fallbackIndex}-${fallbackIndex}`;
};

export const buildDefaultEntityTypeSelection = (entityTypeOptions) => {
  const defaults = {};
  entityTypeOptions.forEach((option) => {
    defaults[option.value] = true;
  });
  return defaults;
};

export const sortPresetsByName = (presetList) =>
  [...presetList].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

export const normalizePreset = (
  preset,
  fallbackId,
  defaultNerModel,
  defaultAcceptanceModel,
) => {
  const presetId = Number.isFinite(preset?.id) ? preset.id : fallbackId;
  const name =
    typeof preset?.name === "string" && preset.name.trim().length > 0
      ? preset.name.trim()
      : "Untitled preset";
  const nerModel =
    typeof preset?.nerModel === "string" && preset.nerModel.trim().length > 0
      ? preset.nerModel
      : defaultNerModel;
  const threshold =
    typeof preset?.threshold === "number"
      ? preset.threshold
      : defaultAcceptanceModel;
  const allowlist =
    typeof preset?.allowlist === "string" ? preset.allowlist : "";
  const denylist = typeof preset?.denylist === "string" ? preset.denylist : "";
  const entityTypes = Array.isArray(preset?.entityTypes)
    ? preset.entityTypes.filter((value) => typeof value === "string")
    : [];

  return {
    id: presetId,
    name,
    nerModel,
    threshold,
    allowlist,
    denylist,
    entityTypes,
  };
};

export const readStoredPresets = (
  presetStorageKey,
  defaultNerModel,
  defaultAcceptanceModel,
) => {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(presetStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((preset, index) =>
      normalizePreset(
        preset,
        index + 1,
        defaultNerModel,
        defaultAcceptanceModel,
      ),
    );
  } catch (error) {
    console.warn("Failed to read stored presets", error);
    return [];
  }
};

export const persistPresets = (presetList, presetStorageKey) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      presetStorageKey,
      JSON.stringify(presetList ?? []),
    );
  } catch (error) {
    console.warn("Failed to persist presets", error);
  }
};

export const redactTextByEntities = (text, entities) => {
  if (typeof text !== "string" || text.length === 0) {
    return "";
  }

  if (!Array.isArray(entities) || entities.length === 0) {
    return text;
  }

  const sorted = [...entities]
    .filter(
      (entity) =>
        typeof entity?.start === "number" &&
        typeof entity?.end === "number" &&
        entity.end > entity.start,
    )
    .sort((a, b) => b.start - a.start || b.end - a.end);

  let output = text;
  let lastStart = Infinity;

  sorted.forEach((entity) => {
    if (entity.end > lastStart) {
      return;
    }

    output = `${output.slice(0, entity.start)}${output.slice(entity.end)}`;
    lastStart = entity.start;
  });

  return output;
};

export const plainTextToHtml = (value) => {
  const text = typeof value === "string" ? value : "";
  if (!text) return "";

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  return escaped.replace(/\r\n|\r|\n/g, "<br />");
};

export const readStoredDeidentificationType = (
  storageKey,
  options,
  fallbackValue,
) => {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return fallbackValue;
    const isValid = options.some((option) => option.value === stored);
    return isValid ? stored : fallbackValue;
  } catch (error) {
    console.warn("Failed to read de-identification type", error);
    return fallbackValue;
  }
};

export const readStoredMaskCharCount = (storageKey, fallbackValue) => {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return fallbackValue;
    const parsed = Number.parseInt(stored, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
  } catch (error) {
    console.warn("Failed to read mask character count", error);
    return fallbackValue;
  }
};

export const readStoredMaskChar = (storageKey, fallbackValue) => {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (typeof stored === "string" && stored.length > 0) {
      return stored.slice(0, 1);
    }
    return fallbackValue;
  } catch (error) {
    console.warn("Failed to read mask character", error);
    return fallbackValue;
  }
};

export const readStoredEncryptKey = (storageKey, fallbackValue) => {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return typeof stored === "string" && stored.length > 0
      ? stored
      : fallbackValue;
  } catch (error) {
    console.warn("Failed to read encrypt key", error);
    return fallbackValue;
  }
};
