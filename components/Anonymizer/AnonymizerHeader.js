import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { updateAnonymizerStore } from "../../store/anonymizerStore.js";

import {
  THEME_LIGHT,
  THEME_DARK,
  THEME_STORAGE_KEY,
} from "./../../config/anonymizerConfig.js";

const AnonymizerHeader = () => {
  const dispatch = useDispatch();

  const { theme } = useSelector((state) => state.anonymizer);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (storageError) {
      console.warn("Failed to store theme preference", storageError);
    }

    const desiredHref =
      theme === THEME_DARK
        ? "/anonymizer-dark.min.css"
        : "/anonymizer-light.min.css";
    const existingLink = document.querySelector(
      'link[href*="/anonymizer-light.min.css"], link[href*="/anonymizer-dark.min.css"]',
    );
    if (existingLink) {
      existingLink.setAttribute("href", desiredHref);
    } else {
      const linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = desiredHref;
      document.head.appendChild(linkEl);
    }
  }, [theme]);

  const brandImageSrc =
    theme === THEME_DARK ? "/images/face-white.svg" : "/images/face-black.svg";

  return (
    <header className="navbar anonymizer-navbar">
      <a href="/" id="brand">
        <img src={brandImageSrc} />
        <span>Anonymizer</span>
      </a>

      <div className="spacer" />
      <a
        role="button"
        tabIndex={0}
        className={`knob`}
        style={{ margin: "1px 0 0 .5rem" }}
        onClick={() =>
          dispatch(updateAnonymizerStore({ helpDialogActive: true }))
        }
      >
        <svg className="icon">
          <use xlinkHref="/images/icons.svg#help" />
        </svg>
        Help
      </a>

      <a
        href="https://github.com/lawlawrd/anonymizer"
        className={`knob`}
        style={{ margin: "1px 0 0 1rem" }}
        target="_blank"
      >
        <svg className="icon">
          <use xlinkHref="/images/icons.svg#external" />
        </svg>
        Github repository
      </a>

      {theme === THEME_LIGHT ? (
        <a
          tabIndex={0}
          role="button"
          className={`knob`}
          style={{ margin: "1px 0 0 1rem" }}
          onClick={() => dispatch(updateAnonymizerStore({ theme: THEME_DARK }))}
          aria-pressed={theme === THEME_DARK}
        >
          <svg className="icon">
            <use xlinkHref="/images/icons.svg#darkmode" />
          </svg>
          Dark mode
        </a>
      ) : (
        <a
          tabIndex={0}
          role="button"
          className={`knob`}
          style={{ margin: "1px 0 0 1rem" }}
          onClick={() =>
            dispatch(updateAnonymizerStore({ theme: THEME_LIGHT }))
          }
          aria-pressed={theme === THEME_LIGHT}
        >
          <svg className="icon">
            <use xlinkHref="/images/icons.svg#lightmode" />
          </svg>
          Light mode
        </a>
      )}
    </header>
  );
};

export default AnonymizerHeader;
