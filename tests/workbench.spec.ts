import { test, expect } from "@playwright/test";
test("overview shares counts, methodology and keyboard map navigation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Overview Dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".kpi-value")).toHaveText(["03", "05", "03", "05"]);
  await expect(page.locator(".activity-row")).toHaveCount(5);
  await expect(page.locator(".activity-row").first()).toContainText(
    "Completed",
  );
  await page.getByRole("button", { name: "How is this estimated?" }).click();
  await expect(page.getByRole("dialog")).toContainText("18.6 kWh × 0.40");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Expand sidebar", exact: true }),
  ).toBeVisible();
  const region = page.getByRole("link", {
    name: "Main Building, 2 monitored classrooms",
  });
  await region.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/buildingId=MB/);
  await expect(page.locator("tbody tr")).toHaveCount(2);
});
test("map supports an informative unmonitored building state", async ({
  page,
}) => {
  await page.goto("/overview");
  await page.getByRole("link", { name: "RBC, 0 monitored classrooms" }).click();
  await expect(
    page.getByRole("heading", {
      name: "No monitored classrooms in this building",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
});
test("directory filters combine and detail return preserves context", async ({
  page,
}) => {
  await page.goto("/buildings-rooms");
  await page.getByLabel("Room ID search").fill("mb201");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("link", { name: "MB-201" }).click();
  await expect(
    page.getByRole("heading", { name: "MB-201", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to Room Directory" }).click();
  await expect(page.getByLabel("Room ID search")).toHaveValue("mb201");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page.getByLabel("Building", { exact: true }).selectOption("MB");
  await page.getByLabel("Booking Status").selectOption("UNBOOKED");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("MB-302");
  await page.getByLabel("Occupancy Status").selectOption("OCCUPIED");
  await expect(
    page.getByText("No classrooms match your current filters.", {
      exact: true,
    }),
  ).toBeVisible();
});
test("calendar preserves exact events, applies ranges and navigates empty weeks", async ({
  page,
}) => {
  await page.goto("/buildings-rooms/rooms/MB-201");
  await expect(page.locator(".booking-block")).toHaveCount(4);
  await page.getByRole("button", { name: /DEMO-101/ }).click();
  await expect(page.getByRole("dialog")).toContainText("11:50 AM");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByLabel("Start Time", { exact: true }).fill("20:00");
  await page.getByLabel("End Time", { exact: true }).fill("10:00");
  await expect(
    page.getByRole("button", { name: "Refresh calendar" }),
  ).toBeDisabled();
  await page.getByLabel("Start Time", { exact: true }).fill("08:00");
  await page.getByLabel("End Time", { exact: true }).fill("12:00");
  await page.getByRole("button", { name: "Refresh calendar" }).click();
  await expect(page.locator(".booking-block")).toHaveCount(2);
  await page.getByRole("button", { name: "Next week" }).click();
  await expect(
    page.getByText("No bookings scheduled for this week."),
  ).toBeVisible();
});
test("approval remains pending until apply, persists and has immutable history", async ({
  page,
}) => {
  await page.goto("/approval-center?itemId=APR-2026-001");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("75%");
  await page
    .getByLabel("Administrator Comment (Optional)")
    .fill("Reviewed comfort evidence.");
  await page.getByRole("button", { name: "Approve & Configure" }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Increase target temperature" })
    .click();
  await page.getByRole("button", { name: "Back to Review" }).click();
  await expect(dialog).toContainText("Pending");
  await page.getByRole("button", { name: "Approve & Configure" }).click();
  await expect(dialog.locator(".temperature-stepper strong")).toHaveText(
    "23.0°C",
  );
  await page
    .getByRole("button", { name: "Apply Settings (Simulated)" })
    .click();
  await expect(dialog).toContainText("Configuration successfully applied");
  await page.getByRole("button", { name: "Close & Return to Inbox" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.goto("/approval-center?itemId=APR-2026-001");
  await expect(page).toHaveURL(/history\/APR-2026-001/);
  await expect(page.getByText("Reviewed comfort evidence.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Workflow Timeline" }),
  ).toBeVisible();
  await page.goto("/buildings-rooms/rooms/MB-201");
  await expect(page.locator(".status-card").last()).toContainText(
    "Setpoint 22.5°C",
  );
});
test("rejection requires reason, bypasses configuration and preserves history", async ({
  page,
}) => {
  await page.goto("/approval-center?itemId=APR-2026-002");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm Rejection" }),
  ).toBeDisabled();
  await page
    .getByLabel("Rejection reason *")
    .selectOption("Insufficient evidence");
  await page.getByRole("button", { name: "Confirm Rejection" }).click();
  await expect(page.getByRole("dialog")).toContainText("Request rejected");
  await page.getByRole("button", { name: "Close & Return to Inbox" }).click();
  await page.goto("/approval-center/history/APR-2026-002");
  await expect(
    page.getByText(
      "No facility configuration was applied because the request was rejected.",
    ),
  ).toBeVisible();
});
test("short flow search and OFF configuration work", async ({ page }) => {
  await page.goto("/approval-center");
  await page
    .getByPlaceholder("Search Flow ID, Room ID or Building")
    .fill("APR-002");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "APR-2026-002", exact: true }).click();
  await page.getByRole("button", { name: "Approve & Configure" }).click();
  await expect(
    page.getByRole("button", { name: "Increase target temperature" }),
  ).toBeDisabled();
  await page.getByLabel("End Time *").fill("12:00");
  await expect(
    page.getByRole("button", { name: "Apply Settings (Simulated)" }),
  ).toBeDisabled();
  await page.getByLabel("End Time *").fill("16:00");
  await page
    .getByRole("button", { name: "Apply Settings (Simulated)" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Not applicable (OFF)");
});
test("rule drafts are incomplete, activate with validation, retain IDs and toggle", async ({
  page,
}) => {
  await page.goto("/rules-settings");
  await page.getByRole("button", { name: "Create New Rule" }).click();
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.getByText("Use 3–60 characters.")).toBeVisible();
  await page
    .getByLabel("Rule Name *", { exact: true })
    .fill("Evening energy saving");
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("button", { name: "Edit RUL-003" }).click();
  await page.getByRole("button", { name: "Submit Rule" }).click();
  await expect(
    page.getByText("Select a category.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Category *", { exact: true }).selectOption("SCHEDULE");
  await page.getByRole("button", { name: "Add an AND condition" }).click();
  await expect(page.locator(".condition-form")).toHaveCount(2);
  await page.getByRole("button", { name: "Submit Rule" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  const row = page
    .locator("tbody tr")
    .filter({ hasText: "Evening energy saving" });
  await expect(row).toContainText("Active");
  await row.getByRole("button", { name: "Disable", exact: true }).click();
  await expect(row).toContainText("Inactive");
  await page.reload();
  await expect(
    page.locator("tbody tr").filter({ hasText: "Evening energy saving" }),
  ).toContainText("Inactive");
});
test("system rule displays restoration stage and unsaved drawer changes require a decision", async ({
  page,
}) => {
  await page.goto("/rules-settings");
  await page.getByRole("button", { name: "View RUL-002" }).click();
  await expect(page.getByRole("dialog")).toContainText("24.5°C");
  await expect(page.getByText("02 · Event begins")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Create New Rule" }).click();
  await page
    .getByLabel("Rule Name *", { exact: true })
    .fill("Unsubmitted rule");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByText("You have unsaved changes. Discard them and close?"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep Editing" }).click();
  await expect(page.getByLabel("Rule Name *", { exact: true })).toHaveValue(
    "Unsubmitted rule",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Discard Changes" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
});
test("small screen retains navigation, keeps body in viewport and has no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/overview");
  await expect(
    page.getByRole("heading", { name: "Overview Dashboard", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Buildings & Rooms" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Buildings & Rooms", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("failed persistence cannot complete an approval", async ({ page }) => {
  await page.goto("/approval-center?itemId=APR-2026-001");
  await page.getByRole("button", { name: "Approve & Configure" }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    };
  });
  await page
    .getByRole("button", { name: "Apply Settings (Simulated)" })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "The request could not be saved.",
  );
  await expect(page.getByRole("dialog")).toContainText("Pending");
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText("Review request");
  await expect(
    page.getByRole("button", { name: "Approve & Configure" }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(5);
});
test("refreshing an unsubmitted configuration leaves the request pending", async ({
  page,
}) => {
  await page.goto("/approval-center?itemId=APR-2026-003");
  await page.getByRole("button", { name: "Approve & Configure" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "outside the standard 23–26°C",
  );
  await page
    .getByRole("button", { name: "Increase target temperature" })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Approve & Configure" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Pending");
  await expect(page.locator("tbody tr")).toHaveCount(5);
});
