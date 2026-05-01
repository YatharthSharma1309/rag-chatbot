import { test, expect, type Page } from "@playwright/test";

/** Auth error banner lives inside the sign-up form; exclude Next.js `#__next-route-announcer__` (also role=alert). */
function registerFeedbackAlert(page: Page) {
  return page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Create account" }) })
    .getByRole("alert");
}

test.describe("register tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /chat with your documents/i })).toBeVisible();
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("shows Create account after switching to Register", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
  });

  test("rejects empty email with clear message", async ({ page }) => {
    await page.getByRole("textbox", { name: "Email" }).fill("");
    await page.getByRole("textbox", { name: "Password" }).fill("abcdef");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(registerFeedbackAlert(page)).toHaveText("Enter your email.");
  });

  test("rejects invalid email format", async ({ page }) => {
    await page.getByRole("textbox", { name: "Email" }).fill("not-an-email");
    await page.getByRole("textbox", { name: "Password" }).fill("abcdef");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(registerFeedbackAlert(page)).toHaveText("Enter a valid email address.");
  });

  test("rejects password shorter than 6 characters", async ({ page }) => {
    await page.getByRole("textbox", { name: "Email" }).fill("e2e-register-check@example.com");
    await page.getByRole("textbox", { name: "Password" }).fill("abc");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(registerFeedbackAlert(page)).toHaveText("Password must be at least 6 characters.");
  });
});
