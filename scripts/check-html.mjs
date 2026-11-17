import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, expect } from "@playwright/test";

const file = resolve("dist-html/index.html");
const html = readFileSync(file);
const server = createServer((req, res) => {
  if (req.url?.split("?")[0] === "/hku-campus-cooling-workbench/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const url of [
    `http://127.0.0.1:${port}/hku-campus-cooling-workbench/`,
    pathToFileURL(file).href,
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors = [],
      external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (req) => {
      if (!req.isNavigationRequest() && /^https?:/.test(req.url()))
        external.push(req.url());
    });
    try {
      await page.goto(url);
    } catch (error) {
      if (
        url.startsWith("file:") &&
        error.message.includes("ERR_BLOCKED_BY_ADMINISTRATOR")
      ) {
        console.log(
          "SKIP: file:// opening is blocked by this managed browser policy. No bypass attempted.",
        );
        await context.close();
        continue;
      }
      throw error;
    }
    await expect(
      page.getByRole("heading", { name: "Overview Dashboard", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/#\/overview$/);
    await expect(page.locator(".kpi-value")).toHaveText([
      "03",
      "05",
      "03",
      "05",
    ]);
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((images) =>
            images.every((img) => img.complete && img.naturalWidth > 0),
          ),
      )
      .toBe(true);
    await page
      .getByRole("link", { name: "Main Building, 2 monitored classrooms" })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/buildings-rooms\?buildingId=MB/);
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await page.reload();
    await expect(page.locator("tbody tr")).toHaveCount(2);
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Approval Center", exact: true })
      .click();
    await page
      .getByRole("button", { name: "APR-2026-001", exact: true })
      .click();
    await page.getByRole("button", { name: "Approve & Configure" }).click();
    await page
      .getByRole("button", { name: "Apply Settings (Simulated)" })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Configuration successfully applied",
    );
    await page.getByRole("button", { name: "Close & Return to Inbox" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(4);
    await page.reload();
    await expect(page.locator("tbody tr")).toHaveCount(4);
    expect(errors, "JavaScript runtime errors").toEqual([]);
    expect(
      external,
      "Standalone HTML should have no external asset requests",
    ).toEqual([]);
    console.log(
      url.startsWith("file:")
        ? "PASS: downloaded HTML opens offline, retains navigation and saves approvals."
        : "PASS: GitHub Pages project subpath, deep-link reload and approval persistence.",
    );
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
