const demoPassword = "demo12345";

export const schemaConfig = {
  User: ["id", "name", "email", "password_hash", "role", "team_id", "created_at"],
  Team: ["id", "name", "supervisor_id", "created_at"],
  Task: [
    "id",
    "title",
    "description",
    "due_date",
    "priority",
    "status",
    "creator_id",
    "assignee_id",
    "created_at",
    "completed_at",
  ],
  Attachment: ["id", "task_id", "file_name", "file_url", "uploaded_at"],
  Notification: ["id", "user_id", "message", "is_read", "created_at"],
  Feedback: ["id", "task_id", "author_id", "rating", "comment", "created_at"],
};

export const apiRoutes = [
  "/api/auth/login",
  "/api/tasks",
  "/api/tasks/:id/attachments",
  "/api/teams",
  "/api/notifications/:id/read",
  "/api/analytics",
];

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createInitialDemoState(createdAt = new Date().toISOString()) {
  return {
    activeUserId: null,
    theme: "light",
    users: [
      {
        id: "user-1",
        name: "Aisha",
        email: "admin@teamflow.local",
        password_hash: "$demo$bcrypt-preview$admin",
        role: "ADMIN",
        team_id: null,
        created_at: createdAt,
      },
      {
        id: "user-2",
        name: "Dr. Imran",
        email: "supervisor@teamflow.local",
        password_hash: "$demo$bcrypt-preview$supervisor",
        role: "SUPERVISOR",
        team_id: "team-1",
        created_at: createdAt,
      },
      {
        id: "user-3",
        name: "Faisal",
        email: "faisal@teamflow.local",
        password_hash: "$demo$bcrypt-preview$faisal",
        role: "TEAM_MEMBER",
        team_id: "team-1",
        created_at: createdAt,
      },
      {
        id: "user-4",
        name: "Ahmed",
        email: "ahmed@teamflow.local",
        password_hash: "$demo$bcrypt-preview$ahmed",
        role: "TEAM_MEMBER",
        team_id: "team-1",
        created_at: createdAt,
      },
      {
        id: "user-5",
        name: "Yousef",
        email: "yousef@teamflow.local",
        password_hash: "$demo$bcrypt-preview$yousef",
        role: "TEAM_MEMBER",
        team_id: "team-1",
        created_at: createdAt,
      },
      {
        id: "user-6",
        name: "Mohammed",
        email: "mohammed@teamflow.local",
        password_hash: "$demo$bcrypt-preview$mohammed",
        role: "TEAM_MEMBER",
        team_id: null,
        created_at: createdAt,
      },
    ],
    teams: [
      {
        id: "team-1",
        name: "Smart Assistant Team",
        supervisor_id: "user-2",
        created_at: createdAt,
      },
    ],
    tasks: [
      {
        id: "task-1",
        title: "Accessibility review",
        description: "Check dashboard keyboard and contrast behavior before submission.",
        due_date: "2026-06-04",
        priority: "HIGH",
        status: "DONE",
        creator_id: "user-2",
        assignee_id: "user-3",
        created_at: createdAt,
        completed_at: "2026-06-01T16:30:00.000Z",
      },
      {
        id: "task-2",
        title: "API contract map",
        description: "Document endpoint payloads for auth, tasks, notifications, teams, and analytics.",
        due_date: "2026-06-03",
        priority: "HIGH",
        status: "IN_PROGRESS",
        creator_id: "user-2",
        assignee_id: "user-3",
        created_at: createdAt,
        completed_at: null,
      },
      {
        id: "task-3",
        title: "Database relation diagram",
        description: "Prepare a concise relational schema view for the project report.",
        due_date: "2026-06-06",
        priority: "MEDIUM",
        status: "TODO",
        creator_id: "user-2",
        assignee_id: "user-5",
        created_at: createdAt,
        completed_at: null,
      },
      {
        id: "task-4",
        title: "Final presentation deck",
        description: "Build the presentation narrative and handoff notes.",
        due_date: "2026-06-05",
        priority: "MEDIUM",
        status: "TODO",
        creator_id: "user-2",
        assignee_id: null,
        created_at: createdAt,
        completed_at: null,
      },
      {
        id: "task-5",
        title: "Prototype media upload proof",
        description: "Attach proof of progress to the task detail view.",
        due_date: "2026-06-04",
        priority: "LOW",
        status: "IN_PROGRESS",
        creator_id: "user-2",
        assignee_id: "user-4",
        created_at: createdAt,
        completed_at: null,
      },
    ],
    attachments: [
      {
        id: "att-1",
        task_id: "task-1",
        file_name: "a11y-checklist.pdf",
        file_url: "uploads/a11y-checklist.pdf",
        uploaded_at: "2026-06-01T15:00:00.000Z",
      },
    ],
    notifications: [
      {
        id: "note-1",
        user_id: "user-3",
        message: "Assigned: API contract map is due on 2026-06-03.",
        is_read: false,
        created_at: createdAt,
      },
      {
        id: "note-2",
        user_id: "user-2",
        message: "Accessibility review was completed by Faisal.",
        is_read: true,
        created_at: "2026-06-01T16:30:00.000Z",
      },
    ],
    feedback: [
      {
        id: "feedback-1",
        task_id: "task-1",
        author_id: "user-2",
        rating: 5,
        comment: "Strong accessibility pass. Keep this checklist attached to the final report.",
        created_at: "2026-06-01T17:00:00.000Z",
      },
    ],
    auditLog: [
      "Demo state created with relational Teamflow Workspace data.",
      "JWT auth, bcrypt hashing, multer upload, and API routers are represented as static demo contracts.",
    ],
  };
}

export function authenticateDemoUser(state, email, password) {
  const user = state.users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !passwordMatches(user, password)) {
    throw new Error("Invalid email or password");
  }
  return user;
}

export function createDemoUser(state, { name, email, password, role = "TEAM_MEMBER" }, timestamp = new Date().toISOString()) {
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");
  const validRoles = ["SUPERVISOR", "TEAM_MEMBER"];

  if (cleanName.length < 2) throw new Error("Name must be at least 2 characters");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Enter a valid email address");
  if (state.users.some((user) => user.email.toLowerCase() === cleanEmail)) throw new Error("A profile with that email already exists");
  if (cleanPassword.length < 8) throw new Error("Password must be at least 8 characters");
  if (!validRoles.includes(role)) throw new Error("Profiles can be Supervisor or Team Member");

  const user = {
    id: `user-${state.users.length + 1}`,
    name: cleanName,
    email: cleanEmail,
    password_hash: `$demo$bcrypt-preview$custom:${cleanPassword}`,
    role,
    team_id: null,
    created_at: timestamp,
  };
  state.users.push(user);
  state.auditLog.push(`Profile created for ${cleanName} (${role}).`);
  return user;
}

export function roleSectionsForUser(user) {
  if (!user) return [];
  if (user.role === "SUPERVISOR" || user.role === "ADMIN") {
    return ["dashboard", "teams", "tasks", "notifications", "analytics"];
  }
  return ["dashboard", "tasks", "notifications", "analytics"];
}

export function userName(state, userId) {
  return state.users.find((user) => user.id === userId)?.name || "Unassigned";
}

export function teamMembers(state, supervisorId) {
  const managedTeamIds = state.teams
    .filter((team) => team.supervisor_id === supervisorId)
    .map((team) => team.id);
  return state.users.filter((user) => user.role === "TEAM_MEMBER" && managedTeamIds.includes(user.team_id));
}

export function visibleTasksForUser(state, user) {
  if (!user) return [];
  if (user.role === "SUPERVISOR" || user.role === "ADMIN") {
    const teamIds = state.teams
      .filter((team) => team.supervisor_id === user.id || user.role === "ADMIN")
      .map((team) => team.id);
    const memberIds = state.users
      .filter((item) => teamIds.includes(item.team_id) || item.id === user.id)
      .map((item) => item.id);
    return state.tasks.filter((task) => memberIds.includes(task.assignee_id) || task.creator_id === user.id || !task.assignee_id);
  }
  return state.tasks.filter((task) => task.assignee_id === user.id);
}

export function assignTask(state, taskId, assigneeId, actorId, timestamp = new Date().toISOString()) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found");
  const assignee = state.users.find((user) => user.id === assigneeId);
  if (!assignee || assignee.role !== "TEAM_MEMBER") throw new Error("Assignee must be a team member");

  task.assignee_id = assigneeId;
  if (task.status === "TODO") task.status = "IN_PROGRESS";
  task.completed_at = task.status === "DONE" ? task.completed_at : null;
  pushNotification(state, assigneeId, `Assigned: ${task.title} is due on ${task.due_date}.`, timestamp);
  state.auditLog.push(`${userName(state, actorId)} assigned ${task.title} to ${assignee.name}.`);
  return task;
}

export function setTaskStatus(state, taskId, status, actorId, timestamp = new Date().toISOString()) {
  const valid = ["TODO", "IN_PROGRESS", "DONE"];
  if (!valid.includes(status)) throw new Error("Invalid status");
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found");

  task.status = status;
  task.completed_at = status === "DONE" ? timestamp : null;
  if (status === "DONE") {
    pushNotification(state, task.creator_id, `${task.title} was completed by ${userName(state, task.assignee_id)}.`, timestamp);
  }
  state.auditLog.push(`${userName(state, actorId)} moved ${task.title} to ${status}.`);
  return task;
}

export function addAttachment(state, taskId, fileName, fileUrl, timestamp = new Date().toISOString()) {
  if (!state.tasks.some((task) => task.id === taskId)) throw new Error("Task not found");
  const attachment = {
    id: `att-${state.attachments.length + 1}`,
    task_id: taskId,
    file_name: fileName,
    file_url: fileUrl,
    uploaded_at: timestamp,
  };
  state.attachments.push(attachment);
  state.auditLog.push(`Attachment uploaded for ${state.tasks.find((task) => task.id === taskId).title}: ${fileName}.`);
  return attachment;
}

export function addFeedback(state, taskId, authorId, rating, comment, timestamp = new Date().toISOString()) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found");
  if (task.status !== "DONE") throw new Error("Feedback is only available after DONE");
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    throw new Error("Rating must be from 1 to 5");
  }
  const feedback = {
    id: `feedback-${state.feedback.length + 1}`,
    task_id: taskId,
    author_id: authorId,
    rating: Number(rating),
    comment: String(comment).trim(),
    created_at: timestamp,
  };
  state.feedback.push(feedback);
  if (task.assignee_id) {
    pushNotification(state, task.assignee_id, `Feedback: ${userName(state, authorId)} rated ${task.title} ${feedback.rating}/5.`, timestamp);
  }
  state.auditLog.push(`${userName(state, authorId)} left feedback on ${task.title}.`);
  return feedback;
}

export function markNotificationRead(state, notificationId) {
  const notification = state.notifications.find((item) => item.id === notificationId);
  if (!notification) throw new Error("Notification not found");
  notification.is_read = true;
  return notification;
}

export function addUserToTeam(state, userId, teamId, actorId, timestamp = new Date().toISOString()) {
  const user = state.users.find((item) => item.id === userId);
  const team = state.teams.find((item) => item.id === teamId);
  if (!user || !team) throw new Error("User or team not found");
  user.team_id = teamId;
  pushNotification(state, userId, `You were assigned to ${team.name}.`, timestamp);
  state.auditLog.push(`${userName(state, actorId)} added ${user.name} to ${team.name}.`);
  return user;
}

export function offboardUser(state, userId, actorId, timestamp = new Date().toISOString()) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) throw new Error("User not found");
  const previousTeam = user.team_id;
  user.team_id = null;
  state.tasks
    .filter((task) => task.assignee_id === userId && task.status !== "DONE")
    .forEach((task) => {
      task.assignee_id = null;
      task.status = "TODO";
    });
  pushNotification(state, userId, "You were offboarded from the current Teamflow workspace.", timestamp);
  state.auditLog.push(`${userName(state, actorId)} offboarded ${user.name} from ${previousTeam || "no team"}.`);
  return user;
}

export function reportingForUser(state, userId, now = new Date().toISOString()) {
  const user = state.users.find((item) => item.id === userId);
  const visibleTasks = visibleTasksForUser(state, user);
  const pipeline = countPipeline(state.tasks);
  const personalWorkflows = workflowRows(state);
  const recommendations = visibleTasks
    .filter((task) => task.status !== "DONE" && daysUntil(task.due_date, now) <= 2)
    .map((task) => (
      `Warning: Task ${task.title} is highly exposed to pipeline delays. Suggest active follow-up tracking or alternative balancing assignments with available staff members.`
    ));

  return {
    pipeline,
    personalWorkflows,
    recommendations,
    visibleTaskCount: visibleTasks.length,
  };
}

function countPipeline(tasks) {
  return tasks.reduce(
    (counts, task) => {
      counts[task.status] += 1;
      return counts;
    },
    { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
  );
}

function workflowRows(state) {
  return state.users
    .filter((user) => user.role === "TEAM_MEMBER")
    .map((user) => {
      const assigned = state.tasks.filter((task) => task.assignee_id === user.id);
      const cleared = assigned.filter((task) => task.status === "DONE").length;
      const open = assigned.length - cleared;
      return {
        user_id: user.id,
        name: user.name,
        cleared,
        open,
        ratio: assigned.length ? Math.round((cleared / assigned.length) * 100) : 0,
      };
    });
}

function daysUntil(dateValue, now) {
  const start = new Date(now);
  const due = new Date(`${dateValue}T23:59:59.000Z`);
  return Math.ceil((due.getTime() - start.getTime()) / 86400000);
}

function pushNotification(state, userId, message, timestamp) {
  const notification = {
    id: `note-${state.notifications.length + 1}`,
    user_id: userId,
    message,
    is_read: false,
    created_at: timestamp,
  };
  state.notifications.push(notification);
  return notification;
}

function passwordMatches(user, password) {
  const customPrefix = "$demo$bcrypt-preview$custom:";
  if (user.password_hash.startsWith(customPrefix)) {
    return user.password_hash.slice(customPrefix.length) === String(password || "");
  }
  return password === demoPassword;
}
