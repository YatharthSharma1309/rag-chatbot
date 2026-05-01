import { test, expect } from "@playwright/test";

test.describe("marketing shell", () => {
  test("home loads and shows auth entry point", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /chat with your documents/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i }).first()).toBeVisible();
  });
});
