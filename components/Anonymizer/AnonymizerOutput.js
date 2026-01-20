import React, { useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import { updateAnonymizerStore } from "../../store/anonymizerStore.js";

import { THEME_DARK } from "./../../config/anonymizerConfig.js";

const AnonymizerOutput = () => {
  const dispatch = useDispatch();
  const { theme, isSubmitting, displayHtml, copiedHTML, copiedPlainText } =
    useSelector((state) => state.anonymizer);

  const editorContentRef = useRef(null);

  const getPlainTextFromDisplay = useCallback(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const sourceNode =
      editorContentRef.current?.cloneNode(true) ??
      (() => {
        if (!displayHtml) {
          return null;
        }
        const fallbackContainer = document.createElement("div");
        fallbackContainer.innerHTML = displayHtml;
        return fallbackContainer;
      })();

    if (!sourceNode) {
      return "";
    }

    const doubleBreakTags = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6"]);
    const singleBreakTags = new Set(["LI"]);
    const listContainerTags = new Set(["UL", "OL"]);
    const parts = [];

    const append = (value) => {
      if (!value) return;
      parts.push(value);
    };

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        append(node.nodeValue ?? "");
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const tagName = node.tagName;

      if (tagName === "BR") {
        append("\n");
        return;
      }

      const children = Array.from(node.childNodes);
      children.forEach(walk);

      if (doubleBreakTags.has(tagName)) {
        append("\n\n");
        return;
      }

      if (singleBreakTags.has(tagName)) {
        append("\n");
        return;
      }

      if (listContainerTags.has(tagName)) {
        append("\n\n");
      }
    };

    walk(sourceNode);

    const result = parts
      .join("")
      .replace(/\u00A0/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return result;
  }, [displayHtml]);

  const handleCopyHtml = useCallback(async () => {
    if (typeof window === "undefined" || !displayHtml) {
      return;
    }

    const plainText = getPlainTextFromDisplay();

    try {
      const clipboard = navigator.clipboard;
      const ClipboardItemCtor = window.ClipboardItem;

      if (clipboard?.write && typeof ClipboardItemCtor === "function") {
        const item = new ClipboardItemCtor({
          "text/html": new Blob([displayHtml], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        });

        await clipboard.write([item]);
        setTimeout(() => {
          dispatch(updateAnonymizerStore({ copiedHTML: true }));
          setTimeout(() => {
            dispatch(updateAnonymizerStore({ copiedHTML: false }));
          }, 4000);
        }, 300);
        return;
      }
    } catch (clipboardError) {
      console.warn(
        "Rich text clipboard copy failed; falling back.",
        clipboardError,
      );
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(displayHtml);
        setTimeout(() => {
          dispatch(updateAnonymizerStore({ copiedHTML: true }));
          setTimeout(() => {
            dispatch(updateAnonymizerStore({ copiedHTML: false }));
          }, 4000);
        }, 300);
        return;
      }
    } catch (writeTextError) {
      console.warn(
        "Clipboard writeText fallback for HTML failed; using legacy path.",
        writeTextError,
      );
    }

    if (typeof document !== "undefined") {
      const element = editorContentRef.current;

      if (element && window.getSelection && document.createRange) {
        const selection = window.getSelection();

        if (selection) {
          const savedRanges = [];
          for (let index = 0; index < selection.rangeCount; index += 1) {
            savedRanges.push(selection.getRangeAt(index).cloneRange());
          }

          selection.removeAllRanges();

          const range = document.createRange();
          range.selectNodeContents(element);
          selection.addRange(range);

          try {
            const successful = document.execCommand("copy");
            selection.removeAllRanges();
            savedRanges.forEach((savedRange) => selection.addRange(savedRange));

            if (successful) {
              setTimeout(() => {
                dispatch(updateAnonymizerStore({ copiedHTML: true }));
                setTimeout(() => {
                  dispatch(updateAnonymizerStore({ copiedHTML: false }));
                }, 4000);
              }, 300);
              return;
            }
          } catch (execError) {
            selection.removeAllRanges();
            savedRanges.forEach((savedRange) => selection.addRange(savedRange));
            console.warn(
              "execCommand copy failed; falling back to textarea.",
              execError,
            );
          }
        }
      }

      const textarea = document.createElement("textarea");
      textarea.value = displayHtml;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy");
        setTimeout(() => {
          dispatch(updateAnonymizerStore({ copiedHTML: true }));
          setTimeout(() => {
            dispatch(updateAnonymizerStore({ copiedHTML: false }));
          }, 4000);
        }, 300);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [displayHtml, getPlainTextFromDisplay]);

  const handleCopyPlainText = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const textToCopy = getPlainTextFromDisplay();

    if (!textToCopy) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setTimeout(() => {
          dispatch(updateAnonymizerStore({ copiedPlainText: true }));
          setTimeout(() => {
            dispatch(updateAnonymizerStore({ copiedPlainText: false }));
          }, 4000);
        }, 300);
        return;
      }
    } catch (clipboardError) {
      console.warn(
        "Plain text clipboard copy failed; using fallback.",
        clipboardError,
      );
    }

    if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy");
        setTimeout(() => {
          dispatch(updateAnonymizerStore({ copiedPlainText: true }));
          setTimeout(() => {
            dispatch(updateAnonymizerStore({ copiedPlainText: false }));
          }, 4000);
        }, 1000);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [getPlainTextFromDisplay]);

  const brandImageSrc =
    theme === THEME_DARK ? "/images/face-white.svg" : "/images/face-black.svg";

  return (
    <section className={`anonymizer-results`}>
      <div className="header">
        <div>
          <strong>Output</strong>
        </div>
        <div className="spacer" />
      </div>
      {displayHtml ? (
        <div id="anonymizer-editor-output" className="editor-field">
          <div className="editor-wrapper">
            <div className="editor-toolbar">
              <button type="button" onClick={handleCopyHtml}>
                {copiedHTML ? (
                  <>
                    <svg
                      className="icon"
                      style={{
                        marginRight: ".2rem",
                        transform: "scale(0.9)",
                      }}
                    >
                      <use xlinkHref="/images/icons.svg#check" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="icon"
                      style={{
                        marginRight: ".2rem",
                        transform: "scale(0.9)",
                      }}
                    >
                      <use xlinkHref="/images/icons.svg#content-copy" />
                    </svg>
                    Copy HTML
                  </>
                )}
              </button>
              <div className="divider" />
              <button type="button" onClick={handleCopyPlainText}>
                {copiedPlainText ? (
                  <>
                    <svg
                      className="icon"
                      style={{
                        marginRight: ".2rem",
                        transform: "scale(0.9)",
                      }}
                    >
                      <use xlinkHref="/images/icons.svg#check" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="icon"
                      style={{
                        marginRight: ".2rem",
                        transform: "scale(0.9)",
                      }}
                    >
                      <use xlinkHref="/images/icons.svg#content-copy" />
                    </svg>
                    Copy plain text
                  </>
                )}
              </button>
            </div>

            <div className="editor-content">
              <div
                ref={editorContentRef}
                contentEditable={false}
                dangerouslySetInnerHTML={{ __html: displayHtml }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="pre-result">
          <img src={brandImageSrc} />
          <br />
          Run the anonymizer to see the generated markup preserving output.
        </div>
      )}

      <div className={`fetching ${isSubmitting ? "active" : ""}`}>
        <div className="spinner" style={{ position: "absolute" }}>
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="20" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default AnonymizerOutput;
