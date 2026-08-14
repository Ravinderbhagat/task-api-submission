## Notes

What I'd test next with more time: concurrent requests hitting the in-memory
store, validation on the `assign` endpoint for very long assignee strings,
and whether `getStats` correctly excludes already-overdue-but-done tasks.

What surprised me: `completeTask` silently overwriting priority — an easy
bug to miss without a test specifically checking priority is preserved,
since the endpoint "looks" like it works from the response alone.

Questions before shipping: should status filtering and pagination compose
(bug #4), and should assignee be validated against a real user list rather
than any arbitrary string?
