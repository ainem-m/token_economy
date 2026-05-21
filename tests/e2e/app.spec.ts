import { expect, test } from "@playwright/test";

test("kids kiosk links to PIN-locked parent record flow", async ({ page }) => {
  await page.goto("/kids");

  await expect(page.getByRole("button", { name: "親の記録画面へ" })).toBeVisible();
  await expect(page.locator(".child-panel")).toHaveCount(2);

  await page.getByRole("button", { name: "親の記録画面へ" }).click();
  await expect(page.getByRole("heading", { name: "PINを入力" })).toBeVisible();

  await page.getByLabel("親モードPIN").fill("0000");
  await page.getByRole("button", { name: "開く" }).click();
  await expect(page.getByText("PINが違います。")).toBeVisible();

  await page.getByLabel("親モードPIN").fill("2468");
  await page.getByRole("button", { name: "開く" }).click();
  await expect(page.getByRole("heading", { name: "記録する" })).toBeVisible();

  await page.getByRole("button", { name: "子ども画面へ" }).click();
  await page.getByRole("button", { name: "親の記録画面へ" }).click();
  await expect(page.getByRole("heading", { name: "PINを入力" })).toBeVisible();
});

test("parent settings update the kiosk display", async ({ page }) => {
  await page.goto("/parent/settings");
  await page.getByLabel("親モードPIN").fill("2468");
  await page.getByRole("button", { name: "開く" }).click();

  await expect(page.getByRole("heading", { name: "タグ設定" })).toBeVisible();

  const firstChild = page.locator(".child-settings-row").first();
  await firstChild.getByLabel("名前").fill("あお");
  await firstChild.getByLabel("ラベル").fill("6さい");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();

  await page.getByRole("button", { name: "子ども画面へ" }).click();
  await expect(page.getByRole("heading", { name: "あお" })).toBeVisible();
  await expect(page.getByText("6さい")).toBeVisible();
});
