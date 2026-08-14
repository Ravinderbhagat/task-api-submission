# Take-Home Assignment — The Untested API

**Submission by Ravinder** | Branch: `submission`

**Live demo:** https://task-api-submission-1.onrender.com

Read **[ASSIGNMENT.md](./ASSIGNMENT.md)** for the full brief.

---

## What's in this submission

- ✅ Unit tests (`tests/taskService.test.js`) and integration tests (`tests/routes.test.js`) — 94% statement coverage
- ✅ 4 bugs found and documented — see [BUGS.md](./task-api/BUGS.md)
- ✅ 1 bug fixed: pagination offset off-by-one (1-based paging was skipping the first page)
- ✅ New endpoint implemented: `PATCH /tasks/:id/assign`
- ✅ Closing notes — see [NOTES.md](./task-api/NOTES.md)

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
cd task-api
npm install
npm start        # runs on http://localhost:3000
```

**Tests:**

```bash
npm test           # run test suite
npm run coverage   # run with coverage report
```

---

## Project Structure

```
task-api/
  src/
    app.js                  # Express app setup
    routes/tasks.js         # Route handlers
    services/taskService.js # Business logic + in-memory data store
    utils/validators.js     # Input validation helpers
  tests/                    # Unit + integration tests
  BUGS.md                   # Bug report
  NOTES.md                  # Closing notes
  package.json
  jest.config.js
ASSIGNMENT.md               # Full brief
```

> The data store is in-memory. It resets every time the server restarts.

---

## API Reference

| Method   | Path                      | Description                              |
|----------|---------------------------|-------------------------------------------|
| `GET`    | `/tasks`                  | List all tasks. Supports `?status=`, `?page=`, `?limit=` |
| `POST`   | `/tasks`                  | Create a new task                        |
| `PUT`    | `/tasks/:id`              | Full update of a task                    |
| `DELETE` | `/tasks/:id`              | Delete a task (returns 204)              |
| `PATCH`  | `/tasks/:id/complete`     | Mark a task as complete                  |
| `GET`    | `/tasks/stats`            | Counts by status + overdue count         |
| `PATCH`  | `/tasks/:id/assign`       | Assign a task to a user ✅ implemented   |

### Task shape

```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "pending | in-progress | completed",
  "priority": "low | medium | high",
  "dueDate": "ISO 8601 or null",
  "completedAt": "ISO 8601 or null",
  "createdAt": "ISO 8601",
  "assignee": "string (optional)"
}
```

### Sample requests

**Create a task**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write tests", "priority": "high"}'
```

**List tasks with filter**
```bash
curl "http://localhost:3000/tasks?status=pending&page=1&limit=10"
```

**Mark complete**
```bash
curl -X PATCH http://localhost:3000/tasks/<id>/complete
```

**Assign a task**
```bash
curl -X PATCH http://localhost:3000/tasks/<id>/assign \
  -H "Content-Type: application/json" \
  -d '{"assignee": "Ravinder"}'
```

---

## Submission Notes

See [BUGS.md](./task-api/BUGS.md) for the full bug report and [NOTES.md](./task-api/NOTES.md) for what I'd test next, what surprised me, and questions I'd ask before shipping this to production.
