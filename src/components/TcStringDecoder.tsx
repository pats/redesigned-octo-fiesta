"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getTcString, subscribeTcString } from "@/lib/tcf/tcf-manager";

// TCF v2.2 purpose definitions (Polish)
const PURPOSES = [
  {
    id: 1,
    name: "Przechowywanie i odczyt informacji na urządzeniu",
    description:
      "Cookies, identyfikatory urządzenia lub podobne nośniki mogą być przechowywane lub odczytywane w celu identyfikacji urządzenia.",
    category: "Niezbędne",
  },
  {
    id: 2,
    name: "Wybieranie podstawowych reklam",
    description:
      "Reklamy dobierane na podstawie treści serwisu lub prostego profilu użytkownika — bez budowania długoterminowego profilu.",
    category: "Marketing",
  },
  {
    id: 3,
    name: "Tworzenie spersonalizowanego profilu reklamowego",
    description:
      "Dane o zachowaniu użytkownika są zbierane i łączone w celu stworzenia spersonalizowanego profilu reklamowego.",
    category: "Marketing",
  },
  {
    id: 4,
    name: "Wybieranie spersonalizowanych reklam",
    description:
      "Reklamy dobierane na podstawie spersonalizowanego profilu stworzonego na potrzeby danego użytkownika.",
    category: "Marketing",
  },
  {
    id: 5,
    name: "Tworzenie spersonalizowanego profilu treści",
    description:
      "Dane o zachowaniu użytkownika są zbierane i łączone w celu stworzenia spersonalizowanego profilu treści.",
    category: "Marketing",
  },
  {
    id: 6,
    name: "Wybieranie spersonalizowanych treści",
    description:
      "Treści dobierane na podstawie spersonalizowanego profilu użytkownika.",
    category: "Marketing",
  },
  {
    id: 7,
    name: "Pomiar skuteczności reklam",
    description:
      "Informacje o wyświetleniu reklamy i interakcjach z nią są zbierane w celu pomiaru skuteczności kampanii.",
    category: "Analityka",
  },
  {
    id: 8,
    name: "Pomiar skuteczności treści",
    description:
      "Informacje o wyświetleniu treści i interakcjach z nią są zbierane w celu optymalizacji treści.",
    category: "Analityka",
  },
  {
    id: 9,
    name: "Badania rynku w celu generowania wiedzy o odbiorcach",
    description:
      "Dane o odbiorcach i ich zachowaniu są wykorzystywane do badań rynku i generowania raportów.",
    category: "Analityka",
  },
  {
    id: 10,
    name: "Rozwijanie i ulepszanie produktów",
    description:
      "Dane są wykorzystywane do tworzenia nowych funkcji i ulepszania istniejących produktów i usług.",
    category: "Analityka",
  },
];

const SPECIAL_FEATURES = [
  {
    id: 1,
    name: "Używanie precyzyjnych danych geolokalizacyjnych",
    description:
      "Dane GPS lub inne mechanizmy pozwalające ustalić dokładną lokalizację użytkownika (precyzja do kilku metrów).",
    category: "Marketing",
  },
  {
    id: 2,
    name: "Aktywne skanowanie charakterystyki urządzenia",
    description:
      "Właściwości urządzenia są odczytywane w celu stworzenia unikalnego identyfikatora (fingerprinting).",
    category: "Marketing",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Niezbędne: "#2b6cb0",
  Marketing: "#c05621",
  Analityka: "#276749",
};

interface DecodedTcData {
  cmpId: number;
  cmpVersion: number;
  consentLanguage: string;
  created: Date;
  lastUpdated: Date;
  vendorListVersion: number;
  isServiceSpecific: boolean;
  useNonStandardTexts: boolean;
  purposeOneTreatment: boolean;
  vendorsDisclosedMax: number;
  publisherCountryCode: string;
  purposeConsents: Set<number>;
  purposeLegitimateInterests: Set<number>;
  specialFeatureOptins: Set<number>;
  vendorConsentsMax: number;
  vendorLegitimateInterestsMax: number;
}

function decodeTcString(tcString: string): DecodedTcData | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TCString } = require("@iabtechlabtcf/core");
    const model = TCString.decode(tcString);

    const purposeConsents = new Set<number>();
    const purposeLegitimateInterests = new Set<number>();
    const specialFeatureOptins = new Set<number>();

    for (let i = 1; i <= 10; i++) {
      if (model.purposeConsents.has(i)) purposeConsents.add(i);
      if (model.purposeLegitimateInterests.has(i))
        purposeLegitimateInterests.add(i);
    }
    for (let i = 1; i <= 2; i++) {
      if (model.specialFeatureOptins.has(i)) specialFeatureOptins.add(i);
    }

    return {
      cmpId: model.cmpId,
      cmpVersion: model.cmpVersion,
      consentLanguage: model.consentLanguage,
      created: model.created,
      lastUpdated: model.lastUpdated,
      vendorListVersion: model.vendorListVersion,
      isServiceSpecific: model.isServiceSpecific,
      useNonStandardTexts: model.useNonStandardTexts,
      purposeOneTreatment: model.purposeOneTreatment,
      publisherCountryCode: model.publisherCountryCode,
      purposeConsents,
      purposeLegitimateInterests,
      specialFeatureOptins,
      vendorConsentsMax: model.vendorConsents.maxId ?? 0,
      vendorLegitimateInterestsMax: model.vendorLegitimateInterests.maxId ?? 0,
      vendorsDisclosedMax: model.vendorsDisclosed.maxId ?? 0,
    };
  } catch (e) {
    console.error("[TcStringDecoder] decode failed:", e);
    return null;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: "1.25rem" }}>
      <h3
        style={{
          margin: "0 0 0.5rem",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#718096",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.25rem",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.3rem 0",
        borderBottom: "1px solid #f7fafc",
        fontSize: 13,
        alignItems: "baseline",
      }}
    >
      <span style={{ color: "#718096", minWidth: 200, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: "#2d3748", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ConsentRow({
  id,
  name,
  description,
  category,
  hasConsent,
  hasLegitimateInterest,
}: {
  id: number;
  name: string;
  description: string;
  category: string;
  hasConsent: boolean;
  hasLegitimateInterest?: boolean;
}) {
  const color = CATEGORY_COLORS[category] ?? "#4a5568";

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid #f7fafc",
        alignItems: "flex-start",
      }}
    >
      {/* ID badge */}
      <span
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: hasConsent ? "#48bb78" : "#e2e8f0",
          color: hasConsent ? "#fff" : "#a0aec0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {id}
      </span>

      {/* Name + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>
            {name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: 999,
              background: `${color}18`,
              color,
              letterSpacing: "0.04em",
            }}
          >
            {category}
          </span>
        </div>
        <p
          style={{
            margin: "0.2rem 0 0",
            fontSize: 12,
            color: "#718096",
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      </div>

      {/* Consent status */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "flex-end",
          fontSize: 11,
        }}
      >
        <ConsentBadge label="zgoda" active={hasConsent} />
        {hasLegitimateInterest !== undefined && (
          <ConsentBadge label="LI" active={hasLegitimateInterest} />
        )}
      </div>
    </div>
  );
}

function ConsentBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      style={{
        padding: "1px 7px",
        borderRadius: 4,
        background: active ? "#c6f6d5" : "#fed7d7",
        color: active ? "#276749" : "#9b2c2c",
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: "0.04em",
      }}
    >
      {active ? "✓" : "✗"} {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TcStringDecoder() {
  const tcString = useSyncExternalStore(subscribeTcString, getTcString, () => "");
  const [decoded, setDecoded] = useState<DecodedTcData | null>(null);

  useEffect(() => {
    if (!tcString) {
      setDecoded(null);
      return;
    }
    setDecoded(decodeTcString(tcString));
  }, [tcString]);

  if (!tcString) {
    return null;
  }

  if (!decoded) {
    return (
      <div style={{ padding: "1rem", color: "#e53e3e", fontSize: 13 }}>
        Nie udało się zdekodować TC Stringa.
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        padding: "1rem 1.25rem",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        background: "#fff",
        maxWidth: 680,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          margin: "0 0 0.25rem",
          fontSize: 15,
          fontWeight: 700,
          color: "#1a202c",
        }}
      >
        Zdekodowany TC String
      </h2>
      <p style={{ margin: "0 0 0.5rem", fontSize: 12, color: "#718096" }}>
        TCF v2.3 — co użytkownik zaakceptował
      </p>

      {/* Metadata */}
      <Section title="Metadane">
        <MetaRow label="Język zgody" value={decoded.consentLanguage.toUpperCase()} />
        <MetaRow label="Kraj wydawcy" value={decoded.publisherCountryCode} />
        <MetaRow label="Utworzono" value={formatDate(decoded.created)} />
        <MetaRow label="Zaktualizowano" value={formatDate(decoded.lastUpdated)} />
        <MetaRow label="Wersja GVL (Global Vendor List)" value={decoded.vendorListVersion} />
        <MetaRow label="CMP ID" value={decoded.cmpId} />
        <MetaRow label="CMP Version" value={decoded.cmpVersion} />
        <MetaRow
          label="Specyficzne dla serwisu"
          value={decoded.isServiceSpecific ? "Tak" : "Nie"}
        />
        <MetaRow
          label="Cel 1 traktowany specjalnie (publisher)"
          value={decoded.purposeOneTreatment ? "Tak" : "Nie"}
        />
        <MetaRow
          label="Maks. ID dostawcy (zgoda)"
          value={decoded.vendorConsentsMax || "—"}
        />
        <MetaRow
          label="Maks. ID dostawcy (uzasadniony interes)"
          value={decoded.vendorLegitimateInterestsMax || "—"}
        />
        <MetaRow
          label="Maks. ID ujawnionego dostawcy (v2.3)"
          value={decoded.vendorsDisclosedMax || "—"}
        />
      </Section>

      {/* Purposes */}
      <Section title="Cele przetwarzania (Purposes 1–10)">
        {PURPOSES.map((p) => (
          <ConsentRow
            key={p.id}
            id={p.id}
            name={p.name}
            description={p.description}
            category={p.category}
            hasConsent={decoded.purposeConsents.has(p.id)}
            hasLegitimateInterest={decoded.purposeLegitimateInterests.has(p.id)}
          />
        ))}
      </Section>

      {/* Special Features */}
      <Section title="Specjalne funkcje (Special Features 1–2) — wymaga opt-in">
        {SPECIAL_FEATURES.map((sf) => (
          <ConsentRow
            key={sf.id}
            id={sf.id}
            name={sf.name}
            description={sf.description}
            category={sf.category}
            hasConsent={decoded.specialFeatureOptins.has(sf.id)}
          />
        ))}
      </Section>
    </div>
  );
}
