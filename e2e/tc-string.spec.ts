import { test, expect } from "@playwright/test";

test.describe("TC String po akceptacji zgód", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("wyświetla placeholder przed akceptacją", async ({ page }) => {
    await page.goto("/");
    const empty = page.getByTestId("tc-string-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("brak zgody");
  });

  test("wyświetla TC String po kliknięciu Zaakceptuj wszystkie", async ({
    page,
  }) => {
    await page.goto("/");

    // Czekamy na banner cookie consent
    const acceptBtn = page.getByRole("button", {
      name: /zaakceptuj wszystkie/i,
    });
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 });

    // Przed kliknięciem — brak TC Stringa
    await expect(page.getByTestId("tc-string-empty")).toBeVisible();
    await expect(page.getByTestId("tc-string-value")).not.toBeVisible();

    // Klikamy "Zaakceptuj wszystkie"
    await acceptBtn.click();

    // TC String powinien się pojawić
    const tcValue = page.getByTestId("tc-string-value");
    await expect(tcValue).toBeVisible({ timeout: 15_000 });

    // TC String jest niepustym ciągiem
    const text = await tcValue.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(10);

    // Cookie euconsent-v2 powinna być ustawiona
    const cookies = await page.context().cookies();
    const euCookie = cookies.find((c) => c.name === "euconsent-v2");
    expect(euCookie).toBeDefined();
    expect(euCookie!.value).toBe(text!.trim());
  });

  test("przycisk usuń cookies resetuje TC String", async ({ page }) => {
    await page.goto("/");

    // Akceptujemy
    const acceptBtn = page.getByRole("button", {
      name: /zaakceptuj wszystkie/i,
    });
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
    await acceptBtn.click();

    // Czekamy na TC String
    await expect(page.getByTestId("tc-string-value")).toBeVisible({
      timeout: 15_000,
    });

    // Klikamy "Usuń cookies zgody" — strona się przeładuje
    const resetBtn = page.getByTestId("reset-consent-btn");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Po przeładowaniu — znowu placeholder i banner
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("tc-string-empty")).toBeVisible({
      timeout: 10_000,
    });

    // Cookie euconsent-v2 nie powinna istnieć
    const cookies = await page.context().cookies();
    const euCookie = cookies.find((c) => c.name === "euconsent-v2");
    expect(euCookie).toBeUndefined();
  });
});
