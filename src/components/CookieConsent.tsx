"use client";

import { useEffect } from "react";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { initTcf, updateTcfConsent } from "@/lib/tcf/tcf-manager";

export default function CookieConsentComponent() {
  useEffect(() => {
    initTcf().catch(console.error);

    CookieConsent.run({
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
        analytics: {
          enabled: false,
        },
        marketing: {
          enabled: false,
        },
      },
      cookie: {
        secure: location.protocol === "https:",
      },
      hideFromBots: false,
      onConsent: ({ cookie }) => {
        updateTcfConsent(cookie.categories);
      },
      onChange: ({ cookie }) => {
        updateTcfConsent(cookie.categories);
      },
      language: {
        default: "pl",
        translations: {
          pl: {
            consentModal: {
              title: "Używamy plików cookie",
              description:
                "Ta strona korzysta z plików cookie, aby zapewnić prawidłowe działanie, analizować ruch i personalizować treści. Klikając \u201EZaakceptuj wszystkie\u201D, wyrażasz zgodę na używanie wszystkich plików cookie. Możesz też dostosować swoje preferencje.",
              acceptAllBtn: "Zaakceptuj wszystkie",
              acceptNecessaryBtn: "Odrzuć opcjonalne",
              showPreferencesBtn: "Ustawienia",
            },
            preferencesModal: {
              title: "Ustawienia plików cookie",
              acceptAllBtn: "Zaakceptuj wszystkie",
              acceptNecessaryBtn: "Odrzuć opcjonalne",
              savePreferencesBtn: "Zapisz ustawienia",
              closeIconLabel: "Zamknij",
              sections: [
                {
                  title: "Zarządzanie zgodami",
                  description:
                    "Tutaj możesz zarządzać swoimi preferencjami dotyczącymi plików cookie. Kliknij na poszczególne kategorie, aby dowiedzieć się więcej i zmienić domyślne ustawienia.",
                },
                {
                  title: "Niezbędne",
                  description:
                    "Te pliki cookie są konieczne do prawidłowego działania strony i nie mogą zostać wyłączone.",
                  linkedCategory: "necessary",
                },
                {
                  title: "Analityczne",
                  description:
                    "Te pliki cookie pozwalają nam mierzyć ruch na stronie i analizować zachowania użytkowników, co pomaga ulepszać nasze usługi.",
                  linkedCategory: "analytics",
                },
                {
                  title: "Marketingowe",
                  description:
                    "Te pliki cookie służą do wyświetlania spersonalizowanych reklam i treści dopasowanych do Twoich zainteresowań.",
                  linkedCategory: "marketing",
                },
              ],
            },
          },
        },
      },
    });
  }, []);

  return null;
}
