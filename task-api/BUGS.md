# Bug Report

## 1. completeTask resets priority to 'medium'
- Expected: completing a task should preserve its existing priority.
- Actual: `completeTask` in taskService.js hardcodes `priority: 'medium'`, overwriting the original value.
- Found via: unit + integration test asserting priority is preserved after completion.
- Fix: remove the `priority: 'medium'` line from the spread in `completeTask` (line ~69) so the original priority carries over.

## 2. getByStatus matches partial strings
- Expected: `getByStatus('do')` should return zero tasks (no status is exactly 'do').
- Actual: uses `t.status.includes(status)`, so 'do' matches both 'todo' and 'done'.
- Found via: unit test with mixed-status tasks and a partial-match query.
- Fix: change to strict equality (`t.status === status`).

## 3. Pagination offset off-by-one (FIXED)
- Expected: page=1 with limit=2 should return the first 2 tasks (1-based paging).
- Actual: offset was `page * limit`, which for page=1 skips the first `limit` items entirely.
- Found via: unit + integration pagination tests.
- Fix applied: changed offset calculation to `(page - 1) * limit`.

## 4. Status filter ignores pagination params
- Expected: `GET /tasks?status=todo&page=1&limit=1` should return paginated results within the filtered set.
- Actual: the route returns early on `status` filter alone, never checking page/limit.
- Found via: integration test combining both query params.
- Fix would look like: `getByStatus` should accept optional page/limit args (or filter first, then paginate the result in the route) instead of the route short-circuiting.
