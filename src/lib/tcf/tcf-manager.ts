import type { CmpApi } from "@iabtechlabtcf/cmpapi";
import type { GVL, TCModel } from "@iabtechlabtcf/core";
import {
  CATEGORY_TO_PURPOSES,
  CATEGORY_TO_SPECIAL_FEATURES,
  CMP_ID,
  CMP_VERSION,
  CONSENT_LANGUAGE,
  GVL_BASE_URL,
} from "./constants";
import { deleteTcCookie, getTcCookie, setTcCookie } from "./cookie-utils";

let cmpApi: CmpApi | null = null;
let tcModel: TCModel | null = null;
let initialized = false;
let initializing = false;
let pendingCategories: string[] | null = null;
let currentTcString = "";
const listeners = new Set<(tcString: string) => void>();

export function subscribeTcString(cb: (tcString: string) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getTcString(): string {
  return currentTcString;
}

function notifyListeners(tcString: string) {
  currentTcString = tcString;
  for (const cb of listeners) cb(tcString);
}

// Lazily loaded modules (avoid SSR evaluation of browser-only packages)
let _TCString: typeof import("@iabtechlabtcf/core").TCString;
let _GVL: typeof import("@iabtechlabtcf/core").GVL;
let _TCModel: typeof import("@iabtechlabtcf/core").TCModel;
let _CmpApi: typeof import("@iabtechlabtcf/cmpapi").CmpApi;

function loadModules() {
  // Use require() to force CJS resolution — the ESM builds of these
  // packages have circular dependencies that break under Turbopack.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const core = require("@iabtechlabtcf/core");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cmpapi = require("@iabtechlabtcf/cmpapi");
  _TCString = core.TCString;
  _GVL = core.GVL;
  _TCModel = core.TCModel;
  _CmpApi = cmpapi.CmpApi;
}

/**
 * Initialize the TCF layer.
 * GVL is required for TCString.encode(), so this must fully succeed.
 */
export async function initTcf(): Promise<void> {
  if (initialized || initializing) return;
  initializing = true;

  try {
    loadModules();

    _GVL.baseUrl = GVL_BASE_URL;
    const gvl = new _GVL();
    await gvl.readyPromise;
    await gvl.changeLanguage(CONSENT_LANGUAGE);

    cmpApi = new _CmpApi(CMP_ID, CMP_VERSION, true);

    const existingCookie = getTcCookie();
    if (existingCookie) {
      try {
        tcModel = _TCString.decode(existingCookie);
        tcModel.gvl = gvl;
        // TCF v2.3: vendorsDisclosed is mandatory — upgrade old v2.2 cookies on the fly
        if (tcModel.vendorsDisclosed.maxId === 0) {
          tcModel.setAllVendorsDisclosed();
          const upgraded = _TCString.encode(tcModel);
          setTcCookie(upgraded);
          cmpApi.update(upgraded, false);
          notifyListeners(upgraded);
        } else {
          cmpApi.update(existingCookie, false);
          notifyListeners(existingCookie);
        }
      } catch {
        tcModel = createFreshModel(gvl);
        cmpApi.update("", true);
      }
    } else {
      tcModel = createFreshModel(gvl);
      cmpApi.update("", true);
    }

    initialized = true;

    if (pendingCategories) {
      updateTcfConsent(pendingCategories);
      pendingCategories = null;
    }
  } catch (e) {
    console.error("[TCF] initTcf failed:", e);
    initializing = false;
    throw e;
  }

  initializing = false;
}

function createFreshModel(gvl: GVL): TCModel {
  const model = new _TCModel(gvl);
  model.cmpId = CMP_ID;
  model.cmpVersion = CMP_VERSION;
  model.consentLanguage = CONSENT_LANGUAGE;
  model.isServiceSpecific = true;
  model.publisherCountryCode = "PL";
  // TCF v2.3: vendorsDisclosed segment is mandatory — disclose all GVL vendors
  model.setAllVendorsDisclosed();
  return model;
}

/**
 * Translate accepted cookie-consent categories into TCF consent
 * and persist the TC String.
 */
export function updateTcfConsent(acceptedCategories: string[]): void {
  if (!initialized || !tcModel || !cmpApi) {
    pendingCategories = acceptedCategories;
    return;
  }

  tcModel.unsetAllPurposeConsents();

  for (let i = 1; i <= 2; i++) {
    tcModel.specialFeatureOptins.unset(i);
  }

  for (const category of acceptedCategories) {
    const purposes = CATEGORY_TO_PURPOSES[category];
    if (purposes) {
      for (const id of purposes) {
        tcModel.purposeConsents.set(id);
      }
    }

    const specialFeatures = CATEGORY_TO_SPECIAL_FEATURES[category];
    if (specialFeatures) {
      for (const id of specialFeatures) {
        tcModel.specialFeatureOptins.set(id);
      }
    }
  }

  const encodedString = _TCString.encode(tcModel);
  setTcCookie(encodedString);
  cmpApi.update(encodedString, false);
  notifyListeners(encodedString);
}

/**
 * Delete the euconsent-v2 cookie and reset TCF state.
 */
export function resetTcfConsent(): void {
  deleteTcCookie();

  if (tcModel) {
    tcModel.unsetAllPurposeConsents();
    for (let i = 1; i <= 2; i++) {
      tcModel.specialFeatureOptins.unset(i);
    }
  }

  if (cmpApi) {
    cmpApi.update("", true);
  }

  notifyListeners("");
}
