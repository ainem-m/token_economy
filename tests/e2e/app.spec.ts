import { expect, test } from "@playwright/test";

const parentPinHeader = { "x-token-eco-parent-pin": "2468" };

test("key screens match visual baselines", async ({ page }) => {
  await page.goto("/kids");
  await expect(page).toHaveScreenshot("kids-kiosk.png", { fullPage: true, maxDiffPixelRatio: 0.02 });

  await page.goto("/parent/settings");
  await page.getByLabel("親モードPIN").fill("2468");
  await page.getByRole("button", { name: "開く" }).click();
  await expect(page.getByRole("heading", { name: "タグ設定" })).toBeVisible();
  await expect(page).toHaveScreenshot("parent-settings.png", { fullPage: true, maxDiffPixelRatio: 0.02 });
});

test("kids kiosk stays display-only and child-safe", async ({ page }) => {
  await page.goto("/kids");

  await expect(page.locator(".child-panel")).toHaveCount(2);
  await expect(page.locator(".token-icons span").first()).toBeVisible();
  await expect(page.locator(".goal-image").first()).toBeVisible();
  await expect(page.locator(".last-updated")).toBeVisible();

  await expect(page.getByText("円")).toHaveCount(0);
  await expect(page.getByText("履歴")).toHaveCount(0);
  await expect(page.getByText("記録する")).toHaveCount(0);
  await expect(page.getByText("保存する")).toHaveCount(0);
  await expect(page.getByText("取り消す")).toHaveCount(0);
  await expect(page.getByText("ランキング")).toHaveCount(0);
});

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

test("parent routes require PIN and parent layout responds to viewport width", async ({ page }, testInfo) => {
  for (const route of ["/parent/record", "/parent/history", "/parent/goal", "/parent/settings"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "PINを入力" })).toBeVisible();
  }

  await page.getByLabel("親モードPIN").fill("2468");
  await page.getByRole("button", { name: "開く" }).click();
  await expect(page.getByRole("heading", { name: "タグ設定" })).toBeVisible();

  const box = await page.locator(".parent-nav").boundingBox();
  expect(box).not.toBeNull();

  if (testInfo.project.name === "mobile") {
    expect(box!.width).toBeGreaterThan(box!.height);
  } else {
    expect(box!.height).toBeGreaterThan(box!.width);
  }
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

test("parent goal updates the kiosk goal", async ({ page }) => {
  await page.goto("/parent/goal");
  await page.getByLabel("親モードPIN").fill("2468");
  await page.getByRole("button", { name: "開く" }).click();

  await expect(page.getByRole("heading", { name: "目標を編集" })).toBeVisible();
  await page.getByLabel("目標名").fill("じてんしゃ");
  await page.getByLabel("画像URL").fill("");

  const targetInput = page.locator(".static-stepper input").first();
  await targetInput.fill("6");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();

  await page.getByRole("button", { name: "子ども画面へ" }).click();
  await expect(page.getByRole("heading", { name: "じてんしゃ" })).toBeVisible();
  await expect(page.getByText("あと 3 こ")).toBeVisible();
});

test("API requires PIN for goal updates", async ({ request }) => {
  const noPin = await request.post("/api/goals", {
    data: { goals: [] },
  });
  expect(noPin.status()).toBe(403);

  const state = await request.get("/api/kiosk-state");
  const body = await state.json();
  const goals = body.state.goals.map((goal: { id: string; title: string }) =>
    goal.id === "goal-aoi" ? { ...goal, title: "API目標" } : goal,
  );

  const withPin = await request.post("/api/goals", {
    headers: parentPinHeader,
    data: { goals },
  });
  expect(withPin.status()).toBe(200);
});

test("API requires PIN and enforces ledger correction rules", async ({ request }) => {
  const noPin = await request.post("/api/transactions", {
    data: { childId: "aoi", type: "grant", amount: 1, label: "no pin" },
  });
  expect(noPin.status()).toBe(403);

  const overspend = await request.post("/api/transactions", {
    headers: parentPinHeader,
    data: { childId: "aoi", type: "spend", amount: -999, label: "too much" },
  });
  expect(overspend.status()).toBe(400);
  await expect(overspend.json()).resolves.toEqual({ error: "insufficient_balance" });

  const grant = await request.post("/api/transactions", {
    headers: parentPinHeader,
    data: { childId: "aoi", type: "grant", amount: 1, label: "E2E支給" },
  });
  expect(grant.status()).toBe(201);
  const grantBody = await grant.json();
  const sourceId = grantBody.state.transactions[0].id;

  const cancel = await request.post(`/api/transactions/${sourceId}/cancel`, {
    headers: parentPinHeader,
    data: { reason: "E2E取り消し" },
  });
  expect(cancel.status()).toBe(201);

  const secondCancel = await request.post(`/api/transactions/${sourceId}/cancel`, {
    headers: parentPinHeader,
    data: { reason: "E2E二重取り消し" },
  });
  expect(secondCancel.status()).toBe(409);
  await expect(secondCancel.json()).resolves.toEqual({ error: "transaction_already_cancelled" });
});
