import React from "react";
import { useDispatch } from "react-redux";

import { updateAnonymizerStore } from "../../store/anonymizerStore.js";

const AnonymizerHelpDialog = () => {
  const dispatch = useDispatch();

  return (
    <>
      <dialog open={true} className="anonymizer-help">
        <a
          className="control close"
          tabIndex="0"
          onClick={() =>
            dispatch(updateAnonymizerStore({ helpDialogActive: false }))
          }
        >
          <svg className="icon">
            <use xlinkHref="/images/icons.svg#clear"></use>
          </svg>
        </a>

        <h2>How to use the Anonymizer</h2>
        <p>
          The Anonymizer removes or masks personal and sensitive data from your
          text. Paste content on the left, tune the settings in the sidebar,
          then run “Anonymize” to get redacted HTML and plain text output.
        </p>

        <h3>Presidio under the hood</h3>
        <p>
          This tool calls{" "}
          <a href="https://microsoft.github.io/presidio/" target="_blank">
            Presidio
          </a>{" "}
          for entity recognition. Available language models: English
          (en_core_web_lg) and Dutch (nl_core_news_lg). Additional models are
          listed for future use.
        </p>
        <p>
          You can run the Anonymizer locally via Docker:
          <br />
          <code>docker run -p 9628:9628 lawlawrd/anonymizer</code>
        </p>

        <h3>Understanding the results</h3>
        <ul>
          <li>
            <strong>Findings table</strong>: shows detected entities, the
            recognizer and pattern used, and lets you toggle redaction per row.
          </li>
          <li>
            <strong>Acceptance threshold</strong>: minimum confidence (0-1)
            required before a finding is redacted.
          </li>
          <li>
            <strong>Allowlist / Denylist</strong>: terms to always keep visible
            or always redact (comma or newline separated).
          </li>
          <li>
            <strong>Entity filter</strong>: choose which entity types Presidio
            should search for; use the search box or “More options” to manage
            the list quickly.
          </li>
          <li>
            <strong>Presets</strong>: save/load your current model, threshold,
            lists, and entity filters for reuse.
          </li>
        </ul>

        <h3>Data and privacy</h3>
        <p>
          Anonymization runs in-memory; data is not persisted on the server.
          Presets are stored only in your browser (localStorage). Clearing
          storage or switching browsers/devices will lose your presets.
        </p>

        <h3>Feedback</h3>
        <p>
          Questions or suggestions? Email{" "}
          <a href="mailto:ben@lawlaw.law">ben@lawlaw.law</a> or contribute on{" "}
          <a
            href="https://github.com/lawlawrd/anonymizer"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>
        <p>This project is available under the MIT License.</p>
      </dialog>
      <div
        className="backdrop"
        onClick={() =>
          dispatch(updateAnonymizerStore({ helpDialogActive: false }))
        }
      />
    </>
  );
};

export default AnonymizerHelpDialog;
