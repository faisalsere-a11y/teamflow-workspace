import assert from "node:assert/strict";
import test from "node:test";

import {
  addAttachment,
  addFeedback,
  createDemoUser,
  assignTask,
  authenticateDemoUser,
  createInitialDemoState,
  markNotificationRead,
  reportingForUser,
  roleSectionsForUser,
  setTaskStatus,
} from "../demo-model.mjs";

test("authenticates demo users and limits sections by role", () => {
  const state = createInitialDemoState();

  const supervisor = authenticateDemoUser(state, "supervisor@teamflow.local", "demo12345");
  const member = authenticateDemoUser(state, "faisal@teamflow.local", "demo12345");

  assert.equal(supervisor.role, "SUPERVISOR");
  assert.deepEqual(roleSectionsForUser(supervisor), ["dashboard", "teams", "tasks", "notifications", "analytics"]);
  assert.deepEqual(roleSectionsForUser(member), ["dashboard", "tasks", "notifications", "analytics"]);
  assert.throws(() => authenticateDemoUser(state, "faisal@teamflow.local", "wrong"), /Invalid email or password/);
});

test("creates a new demo team-member profile that can sign in", () => {
  const state = createInitialDemoState("2026-06-02T08:00:00.000Z");

  const created = createDemoUser(state, {
    name: "Sara",
    email: "sara@teamflow.local",
    password: "demo12345",
    role: "TEAM_MEMBER",
  });
  const signedIn = authenticateDemoUser(state, "sara@teamflow.local", "demo12345");

  assert.equal(created.name, "Sara");
  assert.equal(created.role, "TEAM_MEMBER");
  assert.equal(created.team_id, null);
  assert.equal(signedIn.id, created.id);
  assert.deepEqual(roleSectionsForUser(created), ["dashboard", "tasks", "notifications", "analytics"]);
});

test("assigning a task creates an assignee notification and supervisor audit entry", () => {
  const state = createInitialDemoState("2026-06-02T08:00:00.000Z");

  assignTask(state, "task-4", "user-4", "user-2", "2026-06-02T08:05:00.000Z");

  const assigned = state.tasks.find((task) => task.id === "task-4");
  const notice = state.notifications.find((item) => item.user_id === "user-4" && item.message.includes("Assigned"));

  assert.equal(assigned.assignee_id, "user-4");
  assert.equal(assigned.status, "IN_PROGRESS");
  assert.equal(notice.is_read, false);
  assert.match(state.auditLog.at(-1), /Dr. Imran assigned Final presentation deck to Ahmed/);
});

test("moving a task to DONE stores completed_at and notifies the creator", () => {
  const state = createInitialDemoState("2026-06-02T08:00:00.000Z");

  setTaskStatus(state, "task-2", "DONE", "user-1", "2026-06-02T09:30:00.000Z");

  const task = state.tasks.find((item) => item.id === "task-2");
  const completionNotice = state.notifications.find((item) => item.user_id === "user-2" && item.message.includes("completed"));

  assert.equal(task.status, "DONE");
  assert.equal(task.completed_at, "2026-06-02T09:30:00.000Z");
  assert.ok(completionNotice);
});

test("feedback is locked until a task is done and then notifies the assignee", () => {
  const state = createInitialDemoState("2026-06-02T08:00:00.000Z");

  assert.throws(
    () => addFeedback(state, "task-2", "user-2", 5, "Not yet complete.", "2026-06-02T08:10:00.000Z"),
    /Feedback is only available after DONE/,
  );

  setTaskStatus(state, "task-2", "DONE", "user-1", "2026-06-02T09:30:00.000Z");
  const feedback = addFeedback(state, "task-2", "user-2", 5, "Clear completion evidence.", "2026-06-02T09:45:00.000Z");

  assert.equal(feedback.rating, 5);
  assert.equal(feedback.comment, "Clear completion evidence.");
  assert.ok(state.notifications.some((item) => item.user_id === "user-3" && item.message.includes("Feedback")));
});

test("attachments and notification read state are recorded in the relational demo state", () => {
  const state = createInitialDemoState("2026-06-02T08:00:00.000Z");
  const notification = state.notifications.find((item) => item.user_id === "user-3");

  const attachment = addAttachment(state, "task-2", "progress.png", "uploads/progress.png", "2026-06-02T10:00:00.000Z");
  markNotificationRead(state, notification.id);

  assert.equal(attachment.task_id, "task-2");
  assert.equal(notification.is_read, true);
});

test("analytics includes pipeline counts, personal table, and exact due-date warning strings", () => {
  const state = createInitialDemoState("2026-06-02T08:00:00.000Z");

  const report = reportingForUser(state, "user-2", "2026-06-02T08:00:00.000Z");

  assert.deepEqual(report.pipeline, { TODO: 2, IN_PROGRESS: 2, DONE: 1 });
  assert.equal(report.personalWorkflows.find((row) => row.name === "Faisal").cleared, 1);
  assert.ok(report.recommendations.includes(
    "Warning: Task API contract map is highly exposed to pipeline delays. Suggest active follow-up tracking or alternative balancing assignments with available staff members.",
  ));
});
