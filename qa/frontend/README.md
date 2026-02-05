# Frontend QA Documentation

## Overview
This directory contains End-to-End (E2E) tests for the Frontend application, executed using **Playwright**.
The tests run inside a Docker container (`frontend-qa`) to ensure consistency and network isolation.

## Directory Structure
- `Dockerfile`: Defines the testing environment (Node.js + Playwright).
- `package.json`: Dependencies (`@playwright/test`).
- `playwright.config.js`: Configuration for Playwright (reporters, base URL).
- `tests/`: Directory containing test files (`*.spec.js`).
- `README.md`: This file.

## 🤖 Instructions for AI Agents

**When to use:**
If you make changes to the frontend or need to verify UI functionality (e.g., "Check if the login button works", "Verify the list is empty"), you **MUST** create and run an automated test. Do not rely on assumption.

**Workflow:**
When you need to make changes and test them:
1.  **Create Verification Test**: Create a test (e.g., in `qa/frontend/tests/<feature_name>.spec.js`) to verify the current behavior (reproduce the issue or check base state).
2.  **Implement Change**: Make the change based on the test results.
3.  **Verify Change**: Execute `docker compose -f qa/docker-compose.yml run --rm frontend-qa` to verify the change using the test.
    *   `passed`: The change works as expected.
    *   `failed`: Analyze the error log, fix the code or the test, and retry.

## How to Run Tests

**Pre-requisite:** The main application stack (Frontend + Backend) must be running.
Ensure `menu_frontend` container is active and reachable on the `foodplanner_default` network.

### Command
To execute the tests, run the following command from the repository root:

```bash
docker compose -f qa/docker-compose.yml run --rm frontend-qa
```

### Expected Output
- **Success:**
  ```text
  Running 2 tests using 1 worker
  [chromium] › example.spec.js:3:1 › has title
  [chromium] › example.spec.js:10:1 › shows login or main page
    2 passed (2.5s)
  ```
- **Failure:**
  Only failing tests are logged with detailed error messages.

## How to Add Tests
1.  Create a new file in `qa/frontend/tests/` (e.g., `navigation.spec.js`).
2.  Use standard Playwright syntax:
    ```javascript
    const { test, expect } = require('@playwright/test');

    test('should navigate to planning page', async ({ page }) => {
      await page.goto('/');
      await page.getByText('Planning').click();
      await expect(page).toHaveURL(/.*planning/);
    });
    ```
3.  The test will automatically be picked up by the runner.

## Configuration
- **Base URL**: Defaults to `http://menu_frontend:80` (internal Docker network). Can be overridden via `BASE_URL` env var.
- **Reporters**: Configured to output both `list` (console) and `junit` (xml).

## Troubleshooting
- **Network Error**: If tests fail immediately with connection refused, ensure the `foodplanner_default` network exists and the frontend container is running.
