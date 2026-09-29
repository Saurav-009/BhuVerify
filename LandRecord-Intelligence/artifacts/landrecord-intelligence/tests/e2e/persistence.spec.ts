import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
});

test('submits a concern, reloads, and exposes it in the Official Portal', async ({ page }) => {
  const concern = `Please verify the survey area discrepancy from browser test ${Date.now()}.`;

  await page.goto('/concern');
  await page.getByTestId('textarea-concern').fill(concern);
  await page.getByTestId('button-submit-concern').click();
  await expect(page.getByText('Concern submitted', { exact: true })).toBeVisible();

  const officialLink = page.getByTestId('link-view-official-grievance');
  const grievanceId = await page.getByTestId('submitted-grievance-id').innerText();
  await page.reload();
  await expect(officialLink).toBeVisible();

  await officialLink.click();
  await page.getByTestId('button-demo-official-login').click();
  const grievanceLink = page.getByTestId(`link-grievance-${grievanceId}`);
  await expect(grievanceLink).toBeVisible();
  await grievanceLink.click();

  await expect(page.getByText(grievanceId, { exact: true })).toBeVisible();
  await expect(page.getByText(concern, { exact: true })).toBeVisible();

  const response = `Reviewed the discrepancy and requested the original register extract ${Date.now()}.`;
  await page.getByTestId('button-grievance-in-review').click();
  await page.getByTestId('textarea-resolution-note').fill(response);
  await page.getByTestId('button-save-resolution').click();

  await page.goto('/concern');
  await expect(page.getByTestId('citizen-grievance-status')).toContainText('In Review');
  await expect(page.getByText('Official review in progress', { exact: true })).toBeVisible();
  await expect(page.getByTestId('citizen-grievance-response')).toContainText(response);

  await page.reload();
  await expect(page.getByTestId('citizen-grievance-status')).toContainText('In Review');
  await expect(page.getByTestId('citizen-grievance-response')).toContainText(response);
});

test('saves an officer decision and retains the decision and remarks after reload', async ({ page }) => {
  const remarks = `Reviewed against the register from browser test ${Date.now()}.`;

  await page.goto('/review');
  await expect(page.getByTestId('button-action-verify')).toBeVisible();
  await page.getByTestId('button-action-verify').click();
  await page.getByTestId('textarea-officer-remarks').fill(remarks);
  await page.getByTestId('button-submit-decision').click();

  await expect(page.getByText('Decision recorded', { exact: true })).toBeVisible();
  await expect(page.getByTestId('button-submit-decision')).toHaveText(/Decision saved/);

  await page.reload();
  await expect(page.getByText('Decision recorded', { exact: true })).toBeVisible();
  await expect(page.getByTestId('button-action-verify')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('textarea-officer-remarks')).toHaveValue(remarks);
  await expect(page.getByText(`Officer remarks: ${remarks}`, { exact: true })).toBeVisible();
});