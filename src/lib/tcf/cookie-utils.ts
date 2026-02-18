import { TC_COOKIE_NAME } from "./constants";

/** Max-age in seconds: 396 days (IAB recommended maximum) */
const MAX_AGE_SECONDS = 396 * 24 * 60 * 60;

export function setTcCookie(encodedString: string): void {
  document.cookie = [
    `${TC_COOKIE_NAME}=${encodedString}`,
    `max-age=${MAX_AGE_SECONDS}`,
    "path=/",
    "SameSite=Lax",
    "Secure",
  ].join("; ");
}

export function getTcCookie(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${TC_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteTcCookie(): void {
  document.cookie = `${TC_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax; Secure`;
}
