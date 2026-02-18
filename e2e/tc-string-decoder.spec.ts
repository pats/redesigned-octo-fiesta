import { test, expect } from "@playwright/test";

test.describe("TcStringDecoder", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("nie wyświetla dekodera przed akceptacją", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("tc-string-empty")).toBeVisible();
    await expect(page.getByTestId("tc-decoder")).not.toBeAttached();
  });

  test("wyświetla dekoder z poprawnymi metadanymi TCF v2.3 po akceptacji", async ({
    page,
  }) => {
    await page.goto("/");

    const acceptBtn = page.getByRole("button", { name: /zaakceptuj wszystkie/i });
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
    await acceptBtn.click();

    const decoder = page.getByTestId("tc-decoder");
    await expect(decoder).toBeVisible({ timeout: 15_000 });

    await expect(decoder).toContainText("Zdekodowany TC String");
    await expect(decoder).toContainText("TCF v2.3");

    // GVL version zakodowana w TC stringu
    const gvlVersion = page.getByTestId("tc-decoder-gvl-version");
    await expect(gvlVersion).toBeVisible();
    const gvlText = await gvlVersion.textContent();
    expect(Number(gvlText)).toBeGreaterThan(0);

    // CMP ID = 2 (zgodnie ze stałą CMP_ID)
    await expect(page.getByTestId("tc-decoder-cmp-id")).toHaveText("2");

    // vendorsDisclosed niepusty — TCF v2.3 wymaga tego segmentu
    const vendorsDisclosed = page.getByTestId("tc-decoder-vendors-disclosed");
    await expect(vendorsDisclosed).toBeVisible();
    const disclosedText = await vendorsDisclosed.textContent();
    expect(Number(disclosedText)).toBeGreaterThan(0);
  });

  test("wszystkie cele i specjalne funkcje zaakceptowane po 'Zaakceptuj wszystkie'", async ({
    page,
  }) => {
    await page.goto("/");

    const acceptBtn = page.getByRole("button", { name: /zaakceptuj wszystkie/i });
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
    await acceptBtn.click();

    await expect(page.getByTestId("tc-decoder")).toBeVisible({ timeout: 15_000 });

    // Wszystkie 10 celów powinno mieć zgodę (✓)
    for (let i = 1; i <= 10; i++) {
      await expect(page.getByTestId(`purpose-${i}-consent`)).toContainText("✓");
    }

    // Obie specjalne funkcje powinny mieć opt-in (✓)
    await expect(page.getByTestId("sf-1-consent")).toContainText("✓");
    await expect(page.getByTestId("sf-2-consent")).toContainText("✓");
  });

  test("tylko cel 1 zaakceptowany po 'Odrzuć opcjonalne'", async ({ page }) => {
    await page.goto("/");

    const rejectBtn = page.getByRole("button", { name: /odrzuć opcjonalne/i });
    await expect(rejectBtn).toBeVisible({ timeout: 10_000 });
    await rejectBtn.click();

    await expect(page.getByTestId("tc-decoder")).toBeVisible({ timeout: 15_000 });

    // Cel 1 (niezbędny) — zawsze zaakceptowany
    await expect(page.getByTestId("purpose-1-consent")).toContainText("✓");

    // Cele 2–10 (opcjonalne) — odrzucone
    for (let i = 2; i <= 10; i++) {
      await expect(page.getByTestId(`purpose-${i}-consent`)).toContainText("✗");
    }

    // Specjalne funkcje — odrzucone (należą do kategorii marketing)
    await expect(page.getByTestId("sf-1-consent")).toContainText("✗");
    await expect(page.getByTestId("sf-2-consent")).toContainText("✗");
  });

  test("dekoder wyświetla poprawnie przy powrocie z istniejącym cookie (v2.3 upgrade)", async ({
    page,
  }) => {
    await page.goto("/");

    // Pierwsza wizyta — akceptujemy wszystko
    const acceptBtn = page.getByRole("button", { name: /zaakceptuj wszystkie/i });
    await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
    await acceptBtn.click();

    await expect(page.getByTestId("tc-decoder")).toBeVisible({ timeout: 15_000 });
    const firstTcString = await page.getByTestId("tc-string-value").textContent();
    expect(firstTcString?.trim().length).toBeGreaterThan(10);

    // Powrót na stronę — cookie już ustawione, banner nie powinien blokować
    await page.goto("/");

    // Dekoder powinien od razu wyświetlić dane z cookie (bez interakcji z banerem)
    await expect(page.getByTestId("tc-decoder")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("tc-string-empty")).not.toBeAttached();

    // TC string powinien być identyczny jak przy pierwszej wizycie
    const returnTcString = await page.getByTestId("tc-string-value").textContent();
    expect(returnTcString?.trim()).toBe(firstTcString?.trim());

    // Wszystkie zgody zachowane
    for (let i = 1; i <= 10; i++) {
      await expect(page.getByTestId(`purpose-${i}-consent`)).toContainText("✓");
    }

    // vendorsDisclosed niepuste — segment TCF v2.3 zachowany w cookie
    const disclosedText = await page
      .getByTestId("tc-decoder-vendors-disclosed")
      .textContent();
    expect(Number(disclosedText)).toBeGreaterThan(0);
  });
});
