"use client";

import { useSyncExternalStore } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import {
  getTcString,
  resetTcfConsent,
  subscribeTcString,
} from "@/lib/tcf/tcf-manager";

function useTcString() {
  return useSyncExternalStore(subscribeTcString, getTcString, () => "");
}

function handleReset() {
  resetTcfConsent();
  CookieConsent.reset(true);
  window.location.reload();
}

export default function TcStringDisplay() {
  const tcString = useTcString();

  return (
    <div
      data-testid="tc-string-display"
      style={{ padding: "1rem", fontFamily: "monospace", fontSize: 14 }}
    >
      <strong>TC String:</strong>
      {tcString ? (
        <>
          <pre
            data-testid="tc-string-value"
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem",
              background: "#f5f5f5",
              borderRadius: 6,
              overflowX: "auto",
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
            }}
          >
            {tcString}
          </pre>
          <button
            data-testid="reset-consent-btn"
            onClick={handleReset}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#e53e3e",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Usuń cookies zgody
          </button>
        </>
      ) : (
        <em data-testid="tc-string-empty" style={{ color: "#888" }}>
          {" "}
          brak zgody — zaakceptuj cookies
        </em>
      )}
    </div>
  );
}
