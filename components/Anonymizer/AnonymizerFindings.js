import React, {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector, useDispatch } from "react-redux";

import { formatConfidence } from "./../../utils/anonymizerUtils.js";

import {
  updateEntityToggles,
  updateEntityToggleAll,
} from "./../../store/anonymizerStore.js";

import { buildEntityId } from "../../utils/anonymizerUtils.js";

const AnonymizerFindings = ({ localizedEntityOptions }) => {
  const dispatch = useDispatch();
  const { results, lastSubmittedText, entityToggles } = useSelector(
    (state) => state.anonymizer,
  );
  const selectAllFindingsRef = useRef(null);
  const [sortConfig, setSortConfig] = useState(() => {
    if (typeof window === "undefined") {
      return { key: "position", direction: "asc" };
    }

    try {
      const stored = window.localStorage.getItem("findingsSort");
      if (!stored) return { key: "position", direction: "asc" };

      const parsed = JSON.parse(stored);
      const key =
        typeof parsed?.key === "string" ? parsed.key : "position";
      const direction =
        parsed?.direction === "desc" ? "desc" : "asc";

      return { key, direction };
    } catch (error) {
      console.warn("Failed to read findings sort preference", error);
      return { key: "position", direction: "asc" };
    }
  });

  const entityTypeDisplayValueMap = useMemo(() => {
    const map = new Map();
    localizedEntityOptions.forEach((option) => {
      map.set(option.value, option.displayValue);
    });
    return map;
  }, [localizedEntityOptions]);

  const occurrenceCounts = useMemo(() => {
    const counts = new Map();
    if (!Array.isArray(results.entities)) return counts;

    results.entities.forEach((entity) => {
      const entityType = entity?.entity_type ?? "";
      const start = entity?.start;
      const end = entity?.end;
      const originalText =
        typeof start === "number" &&
        typeof end === "number" &&
        typeof lastSubmittedText === "string"
          ? lastSubmittedText.slice(start, end)
          : "";
      const key = `${entityType}::${originalText}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [results.entities, lastSubmittedText]);

  const findings = useMemo(() => {
    if (!Array.isArray(results.entities)) return [];

    const itemMap = new Map();
    if (Array.isArray(results.items)) {
      results.items.forEach((item, index) => {
        if (typeof item?.start === "number" && typeof item?.end === "number") {
          const key = `${item.start}-${item.end}-${item.entity_type ?? ""}`;
          itemMap.set(key, { ...item, index });
        }
      });
    }

    return results.entities.map((entity, entityIndex) => {
      const entityType = entity?.entity_type ?? "";
      const displayEntityType =
        entityTypeDisplayValueMap.get(entityType) ?? entityType;
      const start = entity?.start;
      const end = entity?.end;
      const key = `${start ?? ""}-${end ?? ""}-${entityType}`;
      const matchedItem = itemMap.get(key);
      const originalText =
        typeof start === "number" &&
        typeof end === "number" &&
        typeof lastSubmittedText === "string"
          ? lastSubmittedText.slice(start, end)
          : "";
      const countKey = `${entityType}::${originalText}`;
      const count = occurrenceCounts.get(countKey) ?? 0;
      const positionLabel =
        typeof start === "number" && typeof end === "number"
          ? `${start}-${end}`
          : "—";
      const explanation =
        (entity && typeof entity.analysis_explanation === "object"
          ? entity.analysis_explanation
          : entity?.explanation) ?? {};
      const recognizer =
        explanation?.recognizer ??
        explanation?.recognizer_name ??
        entity?.recognizer ??
        entity?.recognizer_name ??
        "";

      return {
        id: buildEntityId(entity, entityIndex),
        entityType: displayEntityType,
        text: originalText,
        start,
        end,
        positionLabel,
        count,
        confidence: entity?.score,
        anonymizer: matchedItem?.anonymizer ?? "",
        replacement: matchedItem?.text ?? "",
        recognizer,
      };
    });
  }, [
    results.entities,
    results.items,
    lastSubmittedText,
    entityTypeDisplayValueMap,
    occurrenceCounts,
  ]);

  const sortedFindings = useMemo(() => {
    const next = [...findings];
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    const normalizeString = (value) =>
      typeof value === "string" ? value.toLowerCase() : "";

    next.sort((a, b) => {
      if (sortConfig.key === "position") {
        const aStart = Number.isFinite(a.start) ? a.start : Infinity;
        const bStart = Number.isFinite(b.start) ? b.start : Infinity;
        if (aStart !== bStart) return (aStart - bStart) * direction;
        const aEnd = Number.isFinite(a.end) ? a.end : Infinity;
        const bEnd = Number.isFinite(b.end) ? b.end : Infinity;
        return (aEnd - bEnd) * direction;
      }

      if (sortConfig.key === "count") {
        return (a.count - b.count) * direction;
      }

      if (sortConfig.key === "confidence") {
        const aScore = Number.isFinite(a.confidence) ? a.confidence : -1;
        const bScore = Number.isFinite(b.confidence) ? b.confidence : -1;
        return (aScore - bScore) * direction;
      }

      if (sortConfig.key === "text") {
        return (
          normalizeString(a.text).localeCompare(normalizeString(b.text)) *
          direction
        );
      }

      if (sortConfig.key === "recognizer") {
        return (
          normalizeString(a.recognizer).localeCompare(
            normalizeString(b.recognizer),
          ) * direction
        );
      }

      return (
        normalizeString(a.entityType).localeCompare(
          normalizeString(b.entityType),
        ) * direction
      );
    });

    return next;
  }, [findings, sortConfig]);

  const { allFindingsSelected, someFindingsSelected, totalFindingsCount } =
    useMemo(() => {
      let selectedCount = 0;
      findings.forEach((finding) => {
        if (entityToggles[finding.id] !== false) {
          selectedCount += 1;
        }
      });
      const totalCount = findings.length;
      return {
        allFindingsSelected: totalCount > 0 && selectedCount === totalCount,
        someFindingsSelected:
          selectedCount > 0 && selectedCount < totalCount && totalCount > 0,
        totalFindingsCount: totalCount,
      };
    }, [entityToggles, findings]);

  const handleToggleAllFindings = useCallback(
    (isChecked) => {
      dispatch(updateEntityToggleAll({ isChecked }));
    },
    [findings],
  );

  const handleFindingToggle = useCallback((id, isChecked) => {
    dispatch(updateEntityToggles({ id, isChecked }));
  }, []);

  useEffect(() => {
    const checkbox = selectAllFindingsRef.current;
    if (!checkbox) return;
    checkbox.indeterminate =
      totalFindingsCount > 0 && someFindingsSelected && !allFindingsSelected;
  }, [allFindingsSelected, someFindingsSelected, totalFindingsCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("findingsSort", JSON.stringify(sortConfig));
    } catch (error) {
      console.warn("Failed to persist findings sort preference", error);
    }
  }, [sortConfig]);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const getSortIndicator = useCallback(
    (key) => {
      if (sortConfig.key !== key) return "";
      return sortConfig.direction === "asc" ? " ▲" : " ▼";
    },
    [sortConfig],
  );

  return (
    <section className={`anonymizer-findings`}>
      {findings.length === 0 ? (
        <p>No findings yet</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>
                <input
                  ref={selectAllFindingsRef}
                  type="checkbox"
                  checked={allFindingsSelected}
                  onChange={(event) =>
                    handleToggleAllFindings(event.target.checked)
                  }
                  aria-label="Toggle redaction for all findings"
                  title="Toggle redaction for all findings"
                />
              </th>
              <th>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSort("entityType")}
                >
                  Entity type{getSortIndicator("entityType")}
                </span>
              </th>
              <th>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSort("text")}
                >
                  Text{getSortIndicator("text")}
                </span>
              </th>
              <th>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSort("position")}
                >
                  Position{getSortIndicator("position")}
                </span>
              </th>
              <th>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSort("count")}
                >
                  Count{getSortIndicator("count")}
                </span>
              </th>
              <th>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSort("confidence")}
                >
                  Confidence{getSortIndicator("confidence")}
                </span>
              </th>
              <th>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSort("recognizer")}
                >
                  Recognizer{getSortIndicator("recognizer")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFindings.map((finding, index) => (
              <tr key={`${finding.id}-${index}`}>
                <td>
                  <input
                    type="checkbox"
                    checked={entityToggles[finding.id] !== false}
                    onChange={(event) =>
                      handleFindingToggle(finding.id, event.target.checked)
                    }
                    aria-label={`Toggle redaction for ${
                      finding.entityType || finding.recognizer || "entity"
                    }`}
                  />
                </td>
                <td>{finding.entityType}</td>
                <td>{finding.text}</td>
                <td>{finding.positionLabel}</td>
                <td>{finding.count}</td>
                <td>{formatConfidence(finding.confidence)}</td>
                <td>{finding.recognizer || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default AnonymizerFindings;
