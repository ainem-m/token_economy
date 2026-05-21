import { expect, test, type Locator, type Page } from "@playwright/test";

const parentPinHeader = { "x-token-eco-parent-pin": "2468" };
const parentPin = "2468";

test.beforeEach(async ({ request }) => {
  const reset = await request.post("/api/test/reset", { headers: parentPinHeader });
  expect(reset.ok()).toBeTruthy();
});

async function unlockParent(page: Page) {
  await page.getByLabel("親モードPIN").fill(parentPin);
  await page.getByRole("button", { name: "開く" }).click();
}

async function expectClickable(locator: Locator) {
  await expect(locator).toBeVisible();
  await locator.click({ trial: true });
}

test("key screens match visual baselines", async ({ page }) => {
  await page.goto("/kids");
  await expect(page).toHaveScreenshot("kids-kiosk.png", { fullPage: true, maxDiffPixelRatio: 0.02 });

  await page.goto("/parent/settings");
  await unlockParent(page);
  await expect(page.getByRole("heading", { name: "タグ設定" })).toBeVisible();
  await expect(page).toHaveScreenshot("parent-settings.png", { fullPage: true, maxDiffPixelRatio: 0.02 });
});

test("kids kiosk stays display-only and child-safe", async ({ page }) => {
  await page.goto("/kids");

  await expect(page.getByRole("region", { name: "あおいのタグ" })).toBeVisible();
  await expect(page.getByRole("region", { name: "はるのタグ" })).toBeVisible();
  await expect(page.getByLabel("3このタグ")).toBeVisible();
  await expect(page.getByRole("img", { name: "レゴ ミニセット" })).toBeVisible();
  await expect(page.getByText(/^更新 /)).toBeVisible();

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
  await expect(page.getByRole("region", { name: "あおいのタグ" })).toBeVisible();
  await expect(page.getByRole("region", { name: "はるのタグ" })).toBeVisible();

  await page.getByRole("button", { name: "親の記録画面へ" }).click();
  await expect(page.getByRole("heading", { name: "PINを入力" })).toBeVisible();

  await page.getByLabel("親モードPIN").fill("0000");
  await page.getByRole("button", { name: "開く" }).click();
  await expect(page.getByText("PINが違います。")).toBeVisible();

  await unlockParent(page);
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

  await unlockParent(page);
  await expect(page.getByRole("heading", { name: "タグ設定" })).toBeVisible();

  const box = await page.getByRole("navigation", { name: "親画面" }).boundingBox();
  expect(box).not.toBeNull();

  if (testInfo.project.name === "mobile") {
    expect(box!.width).toBeGreaterThan(box!.height);
  } else {
    expect(box!.height).toBeGreaterThan(box!.width);
  }

  await expectClickable(page.getByRole("button", { name: "子ども画面へ" }));
  await expectClickable(page.getByRole("button", { name: "保存する" }));

  await page.getByRole("button", { name: "記録" }).click();
  await expect(page.getByRole("heading", { name: "記録する" })).toBeVisible();
  await expectClickable(page.getByRole("button", { name: "記録する" }));

  await page.getByRole("button", { name: "履歴" }).click();
  await expect(page.getByRole("heading", { name: "履歴" })).toBeVisible();
  await expectClickable(page.getByRole("button", { name: "取消" }).first());

  await page.getByRole("button", { name: "目標" }).click();
  await expect(page.getByRole("heading", { name: "目標を編集" })).toBeVisible();
  await expectClickable(page.getByRole("button", { name: "保存する" }));

  await page.getByRole("button", { name: "設定" }).click();
  await expect(page.getByRole("heading", { name: "タグ設定" })).toBeVisible();
  await expectClickable(page.getByRole("button", { name: "保存する" }));
});

test("parent settings update the kiosk display", async ({ page }) => {
  await page.goto("/parent/settings");
  await unlockParent(page);

  await expect(page.getByRole("heading", { name: "タグ設定" })).toBeVisible();

  const firstChild = page.getByRole("region", { name: "1人目の表示設定" });
  await firstChild.getByLabel("名前").fill("あお");
  await firstChild.getByLabel("ラベル").fill("6さい");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();

  await page.getByRole("button", { name: "子ども画面へ" }).click();
  await expect(page.getByRole("heading", { name: "あお" })).toBeVisible();
  await expect(page.getByText("6さい")).toBeVisible();
});

test("parent settings weekly grant changes record quick action", async ({ page }) => {
  await page.goto("/parent/settings");
  await unlockParent(page);

  await page.getByRole("textbox", { name: "土ようび支給の数" }).fill("4");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();

  await page.getByRole("button", { name: "記録" }).click();
  await expect(page.getByRole("button", { name: /土ようび.*\+4こ/s })).toBeVisible();
});

test("parent goal updates the kiosk goal", async ({ page }) => {
  await page.goto("/parent/goal");
  await unlockParent(page);

  await expect(page.getByRole("heading", { name: "目標を編集" })).toBeVisible();
  await page.getByLabel("目標名").fill("じてんしゃ");
  await page.getByLabel("画像URL").fill("");

  await page.getByRole("textbox", { name: "必要タグ数" }).fill("6");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();

  await page.getByRole("button", { name: "子ども画面へ" }).click();
  await expect(page.getByRole("heading", { name: "じてんしゃ" })).toBeVisible();
  await expect(page.getByText("あと 3 こ")).toBeVisible();
});

test("parent goal image URL is used on the kiosk", async ({ page }) => {
  const imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%23f8d35a'/%3E%3Ccircle cx='80' cy='60' r='34' fill='%23277ec2'/%3E%3C/svg%3E";

  await page.goto("/parent/goal");
  await unlockParent(page);

  await page.getByLabel("目標名").fill("しゃしんつき");
  await page.getByLabel("画像URL").fill(imageUrl);
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("保存しました")).toBeVisible();

  await page.getByRole("button", { name: "子ども画面へ" }).click();
  const goalImage = page.getByRole("img", { name: "しゃしんつき" });
  await expect(goalImage).toBeVisible();
  await expect(goalImage).toHaveAttribute("src", imageUrl);
});

test("parent record grant and spend update kiosk balances", async ({ page }) => {
  await page.goto("/parent/record");
  await unlockParent(page);

  await expect(page.getByText(/いま \d+こ/)).toBeVisible();
  await page.getByRole("button", { name: "記録する" }).click();
  await expect(page.getByText("記録しました")).toBeVisible();

  await page.getByRole("button", { name: "チョコ 1こ" }).click();
  await page.getByRole("button", { name: "記録する" }).click();
  await expect(page.getByText("記録しました")).toBeVisible();

  await page.getByRole("button", { name: "子ども画面へ" }).click();
  await expect(page.getByLabel("あおいの合計 4こ")).toBeVisible();
  await expect(page.getByLabel("あおいのちょきん 1こ")).toBeVisible();
});

test("parent record blocks overspend through the UI", async ({ page }) => {
  await page.goto("/parent/record");
  await unlockParent(page);

  await page.getByRole("button", { name: "つかった" }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole("button", { name: "数量を増やす" }).click();
  }
  await page.getByRole("button", { name: "記録する" }).click();
  await expect(page.getByText("残高が足りないため記録できません")).toBeVisible();
});

test("history cancel flow adds correction and disables double cancel in UI", async ({ page }) => {
  await page.goto("/parent/record");
  await unlockParent(page);

  await page.getByRole("button", { name: "記録する" }).click();
  await expect(page.getByText("記録しました")).toBeVisible();

  await page.getByRole("button", { name: "履歴" }).click();
  const firstRow = page.getByRole("article", { name: "あおい 土ようび 物理タグの受け渡し" });
  await expect(firstRow.getByText("土ようび")).toBeVisible();
  await firstRow.getByRole("button", { name: "取消" }).click();
  await page.getByLabel("メモ").fill("E2E");
  await page.getByRole("button", { name: "取り消す" }).click();

  await expect(page.getByRole("article", { name: /あおい 取り消し: 土ようび/ })).toBeVisible();
  await expect(page.getByRole("article", { name: "あおい 土ようび 物理タグの受け渡し" }).getByRole("button", { name: "取消済み" })).toBeDisabled();
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

  const negativeGrant = await request.post("/api/transactions", {
    headers: parentPinHeader,
    data: { childId: "aoi", type: "grant", amount: -1, label: "bad grant" },
  });
  expect(negativeGrant.status()).toBe(400);
  await expect(negativeGrant.json()).resolves.toEqual({ error: "invalid_amount_sign" });

  const positiveSpend = await request.post("/api/transactions", {
    headers: parentPinHeader,
    data: { childId: "aoi", type: "spend", amount: 1, label: "bad spend" },
  });
  expect(positiveSpend.status()).toBe(400);
  await expect(positiveSpend.json()).resolves.toEqual({ error: "invalid_amount_sign" });

  const directCancel = await request.post("/api/transactions", {
    headers: parentPinHeader,
    data: { childId: "aoi", type: "cancel", amount: -1, label: "bad cancel", relatedTransactionId: "tx-aoi-1" },
  });
  expect(directCancel.status()).toBe(400);
  await expect(directCancel.json()).resolves.toEqual({ error: "invalid_transaction_type" });

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
