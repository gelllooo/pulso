import { expect, test } from "@playwright/test";

test("fresh database renders; desktop and tablet keep navigation on the left", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /A prepared island\..*A resilient tomorrow\./,
    }),
  ).toBeVisible();
  await expect(page.locator("aside")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeHidden();
  expect(await page.locator("aside").boundingBox()).toMatchObject({
    x: 0,
    width: 256,
  });
  await page.setViewportSize({ width: 820, height: 1000 });
  await expect(page.locator("aside")).toBeVisible();
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your community dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Human review queue")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("mobile drawer traps focus, closes on navigation and does not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("aside")).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Facilities & evacuation" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Facilities & evacuation sites" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
});

test("all PSGC barangays, real GPS fallback, offline report storage and PWA reload", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /A prepared island\..*A resilient tomorrow\./,
    }),
  ).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  const municipality = page.getByRole("combobox", {
      name: "Municipality",
      exact: true,
    }),
    barangay = page.getByRole("combobox", { name: "Barangay", exact: true });
  for (const [name, count] of [
    ["Boac", 61],
    ["Buenavista", 15],
    ["Gasan", 25],
    ["Mogpog", 37],
    ["Santa Cruz", 55],
    ["Torrijos", 25],
  ] as const) {
    await municipality.selectOption(name);
    await expect(barangay.locator("option")).toHaveCount(count);
  }
  await municipality.selectOption("Boac");
  await page.getByRole("button", { name: "Use device GPS" }).click();
  await expect(
    page.getByText(
      "GPS was denied or unavailable. Tap the map or enter coordinates instead.",
    ),
  ).toBeVisible();
  await context.setOffline(true);
  await page
    .getByLabel("Describe what you observed")
    .fill("Synthetic browser test: water observed near the community road.");
  await page.getByLabel("Latitude", { exact: true }).fill("13.45");
  await page.getByLabel("Longitude", { exact: true }).fill("121.84");
  await page.getByRole("button", { name: "Set manual pin" }).click();
  await page.getByLabel("I understand how my report").check();
  await page.getByRole("button", { name: "Save report", exact: true }).click();
  await expect(
    page.getByText("Report saved on this device", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /1 saved on device/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: /A prepared island\..*A resilient tomorrow\./,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(
    page.getByText(
      "Synthetic browser test: water observed near the community road.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Community map", exact: true })
    .click();
  await expect(page.locator(".leaflet-marker-icon")).toHaveCount(1);
  await page.locator(".leaflet-marker-icon").click();
  await expect(page.locator(".leaflet-popup-content")).toContainText(
    "Synthetic browser test: water observed near the community road.",
  );
  const requests = await page.evaluate(async () => {
    const result: string[] = [];
    for (const key of await caches.keys()) {
      for (const req of await (await caches.open(key)).keys())
        result.push(req.url);
    }
    return result;
  });
  expect(requests.some((url) => url.endsWith(".woff2"))).toBe(true);
  expect(
    requests.some((url) => url.includes("/api/") || url.includes("/rest/v1/")),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("community map uses satellite tiles and an accessible collapsible legend; API authentication holds", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Community map", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Marinduque community map" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Switch to street map" }),
  ).toBeVisible();
  const legend = page.getByRole("button", { name: "Map legend" });
  await expect(legend).toHaveAttribute("aria-expanded", "true");
  await legend.click();
  await expect(legend).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Switch to street map" }).click();
  await expect(
    page.getByRole("button", { name: "Switch to satellite" }),
  ).toBeVisible();
  const unauth = await request.post("/api/ai/sort", {
    data: { reportId: "20000001-0000-4000-8000-000000000001" },
  });
  expect(unauth.status()).toBe(401);
  const method = await request.get("/api/ai/sort");
  expect(method.status()).toBe(405);
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(3);
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toBe("image/png");
  }
});
