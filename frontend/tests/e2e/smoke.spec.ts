import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseURL = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:8000';
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'SecurePass123';

async function requestJson<T>(
  request: APIRequestContext,
  path: string,
  options: Parameters<APIRequestContext['post']>[1] = {}
) {
  const response = await request.fetch(`${apiBaseURL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers ?? {})
    }
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<T>;
}

async function loginAndGetToken(request: APIRequestContext) {
  const response = await request.post(`${apiBaseURL}/api/auth/login/`, {
    data: { email: adminEmail, password: adminPassword }
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.access as string;
}

async function seedBranchAdminData(request: APIRequestContext) {
  const accessToken = await loginAndGetToken(request);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const stamp = Date.now();
  const organization = await requestJson<Record<string, unknown>>(request, '/api/organizations/', {
    method: 'POST',
    data: { name: 'E2E Org', slug: `e2e-org-${stamp}`, contact_email: 'org@example.com', contact_phone: '9999999999' },
    headers
  });
  const branch = await requestJson<Record<string, unknown>>(request, '/api/branches/', {
    method: 'POST',
    data: {
      organization: organization.id,
      name: 'E2E Branch',
      slug: `e2e-branch-${stamp}`,
      status: 'active',
      working_hours: '9 AM - 5 PM',
      timezone: 'UTC',
      queue_prefix: 'E',
      manager: 1
    },
    headers
  });
  const service = await requestJson<Record<string, unknown>>(request, '/api/services/', {
    method: 'POST',
    data: {
      organization: organization.id,
      branch: branch.id,
      name: 'E2E Service',
      duration: 10,
      prefix: 'E',
      priority: 1,
      is_active: true
    },
    headers
  });
  const counter = await requestJson<Record<string, unknown>>(request, '/api/counters/', {
    method: 'POST',
    data: { organization: organization.id, branch: branch.id, name: 'E2E Counter', status: 'open' },
    headers
  });
  return { accessToken, headers, organization, branch, service, counter };
}

async function capturePageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  return errors;
}

async function gotoWithRetry(page: Page, path: string, attempts = 3) {
  for (let index = 0; index < attempts; index += 1) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    if (response?.status() !== 404 && !(await page.getByRole('heading', { name: 'This page could not be found.' }).count())) {
      return response;
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  return page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function loginAsAdmin(page: Page) {
  await gotoWithRetry(page, '/login');
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await page.getByPlaceholder('Email').fill(adminEmail);
  await page.getByPlaceholder('Password').fill(adminPassword);
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/api/auth/login/') && response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Sign in' }).click()
  ]);
  await page.waitForURL(/\/dashboard(?:\/|$)/, { timeout: 20_000 });
  await page.waitForFunction(() => Boolean(localStorage.getItem('smartqueue-auth')));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await expect(page.getByText("Today's queue activity")).toBeVisible({ timeout: 20_000 });
}

test('admin can log in and dashboard pages load without runtime errors', async ({ page }) => {
  const errors = await capturePageErrors(page);
  await loginAsAdmin(page);

  const routes = [
    { path: '/dashboard', anchor: "Today's queue activity", kind: 'text' },
    { path: '/dashboard/organizations', anchor: 'Add organization', kind: 'heading' },
    { path: '/dashboard/branches', anchor: 'Branches', kind: 'h2' },
    { path: '/dashboard/departments', anchor: 'Departments', kind: 'h1' },
    { path: '/dashboard/services', anchor: 'Services', kind: 'h2' },
    { path: '/dashboard/counters', anchor: 'Counters', kind: 'h2' },
    { path: '/dashboard/staff', anchor: 'Staff', kind: 'h2' },
    { path: '/dashboard/analytics', anchor: 'Average wait time', kind: 'text' },
    { path: '/dashboard/notifications', anchor: 'Notification history', kind: 'h2' }
  ];

  for (const route of routes) {
    await gotoWithRetry(page, route.path);
    await expect(page).toHaveURL(new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if (route.kind === 'heading') {
      await expect(page.getByRole('heading', { name: route.anchor })).toBeVisible({ timeout: 15_000 });
    } else if (route.kind === 'h1') {
      await expect(page.locator('h1').filter({ hasText: route.anchor }).first()).toBeVisible({ timeout: 15_000 });
    } else if (route.kind === 'h2') {
      await expect(page.locator('h2').filter({ hasText: route.anchor }).first()).toBeVisible({ timeout: 15_000 });
    } else {
      await expect(page.getByText(route.anchor)).toBeVisible({ timeout: 15_000 });
    }
  }

  expect(errors).toEqual([]);
});

test('admin can create, edit, archive, and restore core resources', async ({ page, request }) => {
  const errors = await capturePageErrors(page);
  const data = await seedBranchAdminData(request);
  const { branch, service, counter } = data;

  await loginAsAdmin(page);

  await gotoWithRetry(page, '/dashboard/organizations');
  const orgName = `E2E Org UI ${Date.now()}`;
  const orgSlug = `e2e-org-ui-${Date.now()}`;
  const createOrgResponse = page.waitForResponse((response) => response.url().endsWith('/api/organizations/') && response.request().method() === 'POST');
  await page.getByPlaceholder('Name').fill(orgName);
  await page.getByPlaceholder('Slug').fill(orgSlug);
  await page.getByRole('button', { name: 'Create organization' }).click();
  const createOrgPayload = await (await createOrgResponse).json();
  expect((createOrgPayload as { id: number }).id).toBeGreaterThan(0);
  await page.waitForResponse((response) => response.url().endsWith('/api/organizations/') && response.request().method() === 'GET');
  await page.waitForLoadState('networkidle');
  await expect(page.getByPlaceholder('Name')).toHaveValue('');
  await expect(page.getByPlaceholder('Slug')).toHaveValue('');
  const createdOrg = await requestJson<Record<string, unknown>>(request, `/api/organizations/${(createOrgPayload as { id: number }).id}/`, { headers: data.headers });
  expect(createdOrg.name).toBe(orgName);
  await expect(page.getByRole('button', { name: 'Archive' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Archive' }).first().click();
  await page.getByRole('button', { name: 'Restore' }).first().click();

  await gotoWithRetry(page, '/dashboard/branches');
  const branchName = `E2E Branch UI ${Date.now()}`;
  const createBranchResponse = page.waitForResponse((response) => response.url().endsWith('/api/branches/') && response.request().method() === 'POST');
  const organizationValue = await page.locator('select').first().locator('option:not([value=""])').first().getAttribute('value');
  expect(organizationValue).toBeTruthy();
  await page.locator('select').first().selectOption(String(organizationValue));
  await page.getByPlaceholder('Branch name').fill(branchName);
  const createBranchButton = page.getByRole('button', { name: 'Create Branch', exact: true });
  await createBranchButton.scrollIntoViewIfNeeded();
  await expect(createBranchButton).toBeEnabled();
  await createBranchButton.click();
  const createBranchPayload = await (await createBranchResponse).json();
  expect((createBranchPayload as { id: number }).id).toBeGreaterThan(0);
  await page.waitForResponse((response) => response.url().endsWith('/api/branches/') && response.request().method() === 'GET');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  const createdBranch = await requestJson<Record<string, unknown>>(request, `/api/branches/${(createBranchPayload as { id: number }).id}/`, { headers: data.headers });
  expect(createdBranch.name).toBe(branchName);
  const branchRow = page.getByRole('row').filter({ hasText: 'E2E Branch' }).first();
  await expect(branchRow).toBeVisible();
  const branchRowTestId = await branchRow.getAttribute('data-testid');
  expect(branchRowTestId).toBeTruthy();
  const branchRowId = Number(String(branchRowTestId).replace('row-', ''));
  await branchRow.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByPlaceholder('Branch name')).toHaveValue('E2E Branch');
  const updatedBranchName = 'E2E Branch Updated';
  await page.getByPlaceholder('Branch name').fill(updatedBranchName);
  await page.getByRole('button', { name: 'Update Branch' }).click();
  const updatedBranch = await requestJson<Record<string, unknown>>(request, `/api/branches/${branchRowId}/`, { headers: data.headers });
  expect(updatedBranch.name).toBe(updatedBranchName);
  await branchRow.getByRole('button', { name: 'Delete' }).click();
  await branchRow.getByRole('button', { name: 'Restore' }).click();

  await gotoWithRetry(page, '/dashboard/services');
  const serviceName = `E2E Service UI ${Date.now()}`;
  const createServiceResponse = page.waitForResponse((response) => response.url().endsWith('/api/services/') && response.request().method() === 'POST');
  await page.getByPlaceholder('Service name').fill(serviceName);
  const serviceBranchValue = await page.locator('select').first().locator('option:not([value=""])').first().getAttribute('value');
  expect(serviceBranchValue).toBeTruthy();
  await page.locator('select').first().selectOption(String(serviceBranchValue));
  await page.getByPlaceholder('Duration (minutes)').fill('12');
  await page.getByPlaceholder('Queue prefix').fill('U');
  await page.getByPlaceholder('Priority').fill('2');
  const createServiceButton = page.getByRole('button', { name: 'Create Service', exact: true });
  await createServiceButton.scrollIntoViewIfNeeded();
  await expect(createServiceButton).toBeEnabled();
  await createServiceButton.click();
  const createServicePayload = await (await createServiceResponse).json() as { id?: number; name?: string };
  await page.waitForResponse((response) => response.url().endsWith('/api/services/') && response.request().method() === 'GET');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  expect(createServicePayload.id).toBeGreaterThan(0);
  const createdService = await requestJson<Record<string, unknown>>(request, `/api/services/${createServicePayload.id}/`, { headers: data.headers });
  expect(createdService.name).toBe(serviceName);
  await expect(page.getByPlaceholder('Service name')).toHaveValue('');
  const serviceRow = page.getByRole('row').filter({ hasText: 'E2E Service' }).first();
  await expect(serviceRow).toBeVisible();
  await serviceRow.getByRole('button', { name: 'Edit' }).click();
  const currentServiceName = await page.getByPlaceholder('Service name').inputValue();
  expect(currentServiceName).toBeTruthy();
  const updatedServiceName = `${currentServiceName} Updated`;
  await page.getByPlaceholder('Service name').fill(updatedServiceName);
  const serviceRowId = Number(String(await serviceRow.getAttribute('data-testid')).replace('row-', ''));
  const updateServiceResponse = page.waitForResponse((response) => response.url().includes(`/api/services/${serviceRowId}/`) && response.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Update Service' }).click();
  await updateServiceResponse;
  const updatedService = await requestJson<Record<string, unknown>>(request, `/api/services/${serviceRowId}/`, { headers: data.headers });
  expect(updatedService.name).toBe(updatedServiceName);
  await serviceRow.getByRole('button', { name: 'Delete' }).click();
  await serviceRow.getByRole('button', { name: 'Restore' }).click();

  await gotoWithRetry(page, '/dashboard/counters');
  const counterName = `E2E Counter UI ${Date.now()}`;
  const createCounterResponse = page.waitForResponse((response) => response.url().endsWith('/api/counters/') && response.request().method() === 'POST');
  await page.getByPlaceholder('Counter name').fill(counterName);
  const counterBranchValue = await page.locator('select').first().locator('option:not([value=""])').first().getAttribute('value');
  expect(counterBranchValue).toBeTruthy();
  await page.locator('select').first().selectOption(String(counterBranchValue));
  const createCounterButton = page.getByRole('button', { name: 'Create Counter', exact: true });
  await createCounterButton.scrollIntoViewIfNeeded();
  await expect(createCounterButton).toBeEnabled();
  await createCounterButton.click();
  const createCounterResult = await createCounterResponse;
  expect(createCounterResult.status()).toBe(201);
  const createCounterPayload = await createCounterResult.json() as Record<string, unknown>;
  const createdCounterId = Number(createCounterPayload.id);
  expect(createdCounterId).toBeGreaterThan(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  const createdCounterReadback = await requestJson<Record<string, unknown>>(request, `/api/counters/${createdCounterId}/`, { headers: data.headers });
  expect(createdCounterReadback.name).toBe(counterName);
  await expect(page.getByPlaceholder('Counter name')).toHaveValue('');
  const counterRow = page.getByRole('row').filter({ hasText: 'E2E Counter' }).first();
  await expect(counterRow).toBeVisible();
  await counterRow.getByRole('button', { name: 'Edit' }).click();
  const currentCounterName = await page.getByPlaceholder('Counter name').inputValue();
  expect(currentCounterName).toBeTruthy();
  const updatedCounterName = `${currentCounterName} Updated`;
  await page.getByPlaceholder('Counter name').fill(updatedCounterName);
  await page.getByRole('button', { name: 'Update Counter' }).click();
  await page.waitForTimeout(500);
  const counterRowId = Number(String(await counterRow.getAttribute('data-testid')).replace('row-', ''));
  const updatedCounter = await requestJson<Record<string, unknown>>(request, `/api/counters/${counterRowId}/`, { headers: data.headers });
  expect(updatedCounter.name).toBe(updatedCounterName);
  await counterRow.getByRole('button', { name: 'Delete' }).click();
  await counterRow.getByRole('button', { name: 'Restore' }).click();

  expect(errors).toEqual([]);

  await requestJson(request, `/api/organizations/${data.organization.id}/restore/`, { method: 'POST', headers: data.headers });
  await requestJson(request, `/api/branches/${branch.id}/restore/`, { method: 'POST', headers: data.headers });
  await requestJson(request, `/api/services/${service.id}/restore/`, { method: 'POST', headers: data.headers });
  await requestJson(request, `/api/counters/${counter.id}/restore/`, { method: 'POST', headers: data.headers });
});

test('queue flow supports join, call next, skip, complete, and no-show', async ({ request }) => {
  const data = await seedBranchAdminData(request);
  const { headers, branch, service } = data;

  const join = await requestJson<Record<string, unknown>>(request, '/api/queue-tokens/join/', {
    method: 'POST',
    data: {
      branch: branch.id,
      service: service.id,
      customer_name: 'Queue User',
      mobile_number: '9999999999'
    }
  });

  const callNext = await requestJson<Record<string, unknown>>(request, '/api/queue-tokens/call-next/', {
    method: 'POST',
    data: { branch: branch.id },
    headers
  });
  const tokenId = callNext.id as number;
  await requestJson(request, `/api/queue-tokens/${tokenId}/skip/`, { method: 'POST', headers });
  await requestJson(request, `/api/queue-tokens/${tokenId}/complete/`, { method: 'POST', headers });
  await requestJson(request, `/api/queue-tokens/${tokenId}/no-show/`, { method: 'POST', headers });

  expect(join).toBeTruthy();
  expect(callNext).toBeTruthy();
});
