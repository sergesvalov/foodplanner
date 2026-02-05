# QA Guide for AI Agents

## 0. AGENT DIRECTIVE (CRITICAL)
**IF YOU ARE ASKED TO VERIFY BACKEND CHANGES:**
You STRICTLY MUST NOT assume it works based on code analysis alone.
**You MUST write a new test case** (or run existing ones) to prove it works.

**Workflow:**
1.  **Write Test**: Create `qa/tests/test_verify_fix.py` covering the specific logic.
2.  **Run**: Execute the QA container.
3.  **Check**: Analyze the report.
4.  **Clean**: Ensure your test deletes any data it creates.

---

This document describes the automated testing infrastructure for the `FoodPlanner` backend.
**Context:** The tests run in an isolated Docker container on a **remote production/staging server**.

## 1. Capabilities
The QA suite is designed to verify the API's health, CRUD operations, and complex business logic (Autofill).
- **Location:** `/qa` directory in the repo.
- **Type:** Black-box API tests (using `pytest` + `requests`).
- **Data Strategy:** Non-destructive. Tests **create** their own temporary data (random names) and **delete** it upon completion.

## 2. How to Run Tests (Remote)

### Context: Jenkins (CI/CD)
If you have access to the Jenkins pipeline control:
1. Trigger the `Deploy` pipeline.
2. Set the boolean parameter `RUN_TESTS` to `true`.
3. The pipeline will automatically build the `qa` image, push it, and run it on the remote server.

### Context: SSH / Console Access
If you are executing commands via SSH or instructing a user:
1. **Navigate**: `cd ~/foodplanner`
2. **Execute**:
   ```bash
   # Uses the docker-compose.yml relative to the QA folder or manual docker run
   docker run --rm --network foodplanner_default -e API_URL=http://foodplanner-backend:8000 <registry_ip>:5050/foodplanner-qa:latest
   ```

## 3. Interpreting Output

I have designed the output to be easily parsable by LLMs.
Look for the **Automated Test Report** section in the logs:

```markdown
# Automated Test Report  <-- Anchor
**Date:** 2024-XX-XX
**Status:** ✅ PASSED  <-- OR ❌ FAILED
```

### 3.1 Analyzing Failures
If `Status` is `FAILED`:
1. Read the **Execution Log** block below the status.
2. Identify the failing file: e.g., `tests/test_autofill.py`
3. Identify the error message: e.g., `AssertionError: Plan should not be empty`
4. **Action**: Correlate the failure with recent changes in the `backend/` code (especially `routers/`).

## 4. Test Structure (File Map)

| File | Purpose | Key Checks |
|------|---------|------------|
| `test_smoke.py` | Health Check | `GET /` (200 OK), List endpoints return 200. |
| `test_products.py` | Product CRUD | Create product, ensure it appears in list, delete it. |
| `test_recipes.py` | Recipe CRUD | Create recipe with ingredients, update title/portions, delete. |
| `test_plan.py` | Manual Planning | Add meal to schedule, update portions, remove from schedule. |
| `test_autofill.py` | **Core Logic** | Seeds "Soup"/"Main" recipes -> Calls `/autofill_week` -> Verifies 7 days of meals -> Cleans up. |

## 5. Maintenance
- **Adding Tests**: Create a new file `qa/tests/test_newfeature.py`.
- **Naming**: Must start with `test_` to be discovered.
- **Cleanup**: ALWAYS implement cleanup (delete created resources) in the `finally` block or fixture teardown.
