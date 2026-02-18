/** Demo CMP ID — not registered with IAB (must be > 1) */
export const CMP_ID = 2;

export const CMP_VERSION = 2;

export const CONSENT_LANGUAGE = "pl";

export const TC_COOKIE_NAME = "euconsent-v2";

/**
 * Base URL for fetching the Global Vendor List.
 * Served locally from /public/gvl/ to avoid CORS issues with vendor-list.consensu.org.
 */
export const GVL_BASE_URL = "/gvl/";

/**
 * Mapping from vanilla-cookieconsent categories to TCF Purpose IDs.
 *
 * TCF v2.3 Purposes:
 *  1 – Store and/or access information on a device
 *  2 – Select basic ads
 *  3 – Create a personalised ads profile
 *  4 – Select personalised ads
 *  5 – Create a personalised content profile
 *  6 – Select personalised content
 *  7 – Measure ad performance
 *  8 – Measure content performance
 *  9 – Apply market research to generate audience insights
 * 10 – Develop and improve products
 */
export const CATEGORY_TO_PURPOSES: Record<string, number[]> = {
  necessary: [1],
  analytics: [7, 8, 9, 10],
  marketing: [2, 3, 4, 5, 6],
};

/**
 * Mapping from vanilla-cookieconsent categories to TCF Special Feature IDs.
 *
 * TCF v2.3 Special Features:
 *  1 – Use precise geolocation data
 *  2 – Actively scan device characteristics for identification
 */
export const CATEGORY_TO_SPECIAL_FEATURES: Record<string, number[]> = {
  necessary: [],
  analytics: [],
  marketing: [1, 2],
};
