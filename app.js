import {
  addAttachment,
  addFeedback,
  addUserToTeam,
  apiRoutes,
  assignTask,
  authenticateDemoUser,
  clone,
  createDemoUser,
  createInitialDemoState,
  markNotificationRead,
  offboardUser,
  reportingForUser,
  roleSectionsForUser,
  setTaskStatus,
  teamMembers,
  userName,
  visibleTasksForUser,
} from "./demo-model.mjs";

const storageKey = "teamflow-static-rbac-demo-v1";

const sectionLabels = {
  dashboard: "Dashboard",
  teams: "Team Management",
  tasks: "Tasks",
  notifications: "Notifications",
  analytics: "Analytics",
};

const priorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const statusLabels = {
  TODO: "To-Do",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
};

let state = loadState();
cleanupCredentialQuery();

const el = {
  body: document.body,
  loginScreen: document.getElementById("loginScreen"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  demoAccounts: document.getElementById("demoAccounts"),
  appShell: document.getElementById("appShell"),
  navList: document.getElementById("navList"),
  activeRoleLabel: document.getElementById("activeRoleLabel"),
  activeUserName: document.getElementById("activeUserName"),
  notificationToggle: document.getElementById("notificationToggle"),
  notificationCount: document.getElementById("notificationCount"),
  notificationPopover: document.getElementById("notificationPopover"),
  themeToggle: document.getElementById("themeToggle"),
  resetDemo: document.getElementById("resetDemo"),
  logoutButton: document.getElementById("logoutButton"),
  sections: document.querySelectorAll(".section"),
  dashboardView: document.getElementById("dashboardView"),
  teamsView: document.getElementById("teamsView"),
  tasksView: document.getElementById("tasksView"),
  notificationsView: document.getElementById("notificationsView"),
  analyticsView: document.getElementById("analyticsView"),
  activityLog: document.getElementById("activityLog"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  closeModal: document.getElementById("closeModal"),
  toast: document.getElementById("toast"),
};

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? { ...createInitialDemoState(), ...JSON.parse(saved) } : createInitialDemoState();
  } catch {
    return createInitialDemoState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function activeUser() {
  return state.users.find((user) => user.id === state.activeUserId) || null;
}

function isSupervisor() {
  return ["ADMIN", "SUPERVISOR"].includes(activeUser()?.role);
}

function currentSection() {
  const user = activeUser();
  const sections = roleSectionsForUser(user);
  if (!sections.length) return "dashboard";
  return sections.includes(state.section) ? state.section : sections[0];
}

function demoJwt(user) {
  const header = window.btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = window.btoa(JSON.stringify({ sub: user.id, role: user.role, demo: true }));
  return `${header}.${payload}.local-demo-signature`;
}

function roleText(user) {
  if (!user) return "Logged out";
  return user.role.replace("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderLogin() {
  const demoUsers = state.users.filter((user) => user.role !== "ADMIN");
  el.demoAccounts.innerHTML = demoUsers.map((user) => `
    <button class="demo-account" data-demo-email="${escapeHtml(user.email)}">
      <span>${initials(user.name)}</span>
      <strong>${escapeHtml(user.name)}</strong>
      <small>${escapeHtml(roleText(user))}</small>
      <em>${escapeHtml(user.email)}</em>
    </button>
  `).join("");
}

function showApp() {
  el.loginScreen.hidden = true;
  el.appShell.hidden = false;
  el.body.dataset.role = activeUser()?.role || "anonymous";
  render();
}

function showLogin() {
  state.activeUserId = null;
  saveState();
  el.appShell.hidden = true;
  el.loginScreen.hidden = false;
  el.notificationPopover.hidden = true;
  renderLogin();
}

function login(email, password) {
  try {
    const user = authenticateDemoUser(state, email, password);
    state.activeUserId = user.id;
    state.section = roleSectionsForUser(user)[0];
    addAudit(`${user.name} signed in through the local JWT demo flow.`);
    cleanupCredentialQuery();
    saveState();
    showApp();
    toast(`Signed in as ${user.name}.`);
  } catch (error) {
    toast(error.message);
  }
}

function cleanupCredentialQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("email") || params.has("password")) {
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`);
  }
}

function render() {
  const user = activeUser();
  applyTheme();
  if (!user) {
    showLogin();
    return;
  }

  state.section = currentSection();
  el.activeUserName.textContent = `${user.name}'s workspace`;
  el.activeRoleLabel.textContent = `${roleText(user)} route`;
  renderNavigation(user);
  renderNotificationsChrome(user);
  renderSections();
  renderAudit();
  saveState();
}

function renderNavigation(user) {
  const allowed = roleSectionsForUser(user);
  el.navList.innerHTML = allowed.map((section) => `
    <button class="nav-item ${section === state.section ? "is-active" : ""}" data-section="${escapeHtml(section)}">
      ${escapeHtml(sectionLabels[section])}
    </button>
  `).join("");
}

function renderSections() {
  el.sections.forEach((section) => section.classList.toggle("is-visible", section.id === state.section));
  renderDashboard();
  renderTeams();
  renderTasks();
  renderNotificationsSection();
  renderAnalytics();
}

function renderDashboard() {
  const user = activeUser();
  const tasks = visibleTasksForUser(state, user);
  el.dashboardView.innerHTML = isSupervisor()
    ? supervisorDashboard(user, tasks)
    : memberDashboard(user, tasks);
}

function supervisorDashboard(user, tasks) {
  const managed = teamMembers(state, user.id);
  const active = tasks.filter((task) => task.status !== "DONE");
  const completed = tasks.filter((task) => task.status === "DONE");
  const velocity = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
  const warnings = reportingForUser(state, user.id).recommendations;

  return `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Supervisor dashboard</p>
        <h3>Operational control panel</h3>
      </div>
      <button class="primary-button" data-action="openTaskModal">Quick Task Creation</button>
    </div>
    <div class="metric-grid">
      ${metric("Managed Team Members", managed.length, "Assigned to your team")}
      ${metric("Active Workloads", active.length, "Open or in-progress tasks")}
      ${metric("Completed Cycles", completed.length, "Tasks with completed_at")}
      ${metric("Productivity Velocity", `${velocity}%`, "Done against total volume")}
    </div>
    <div class="dashboard-grid">
      <article class="decision-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Team management hub</p>
            <h3>Roster and capacity</h3>
          </div>
          <span class="confidence">${managed.length} active</span>
        </div>
        <div class="member-list compact-list">
          ${managed.map((member) => rosterRow(member)).join("")}
        </div>
        <button class="secondary-button" data-section-jump="teams">Manage roster</button>
      </article>
      <article class="alert-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Predictive panel</p>
            <h3>Delay exposure</h3>
          </div>
          <span class="risk-badge">${warnings.length} warnings</span>
        </div>
        <div class="recommendation-list">
          ${warnings.length ? warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("") : "<p>No near-deadline warnings for your managed team.</p>"}
        </div>
      </article>
    </div>
    <article class="assistant-brief">
      <div>
        <p class="eyebrow">Auth contract</p>
        <h3>JWT preview and RBAC guard</h3>
        <p class="token-preview">${escapeHtml(demoJwt(user))}</p>
      </div>
      <span class="state-pill">restrictTo(${escapeHtml(user.role)})</span>
    </article>
  `;
}

function memberDashboard(user, tasks) {
  const open = tasks.filter((task) => task.status !== "DONE");
  const done = tasks.filter((task) => task.status === "DONE");
  const ratio = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const dueSoon = open.filter((task) => daysUntil(task.due_date) <= 2);

  return `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Team member dashboard</p>
        <h3>Personal Kanban and progress</h3>
      </div>
      <span class="section-count">${tasks.length} visible tasks</span>
    </div>
    <div class="metric-grid">
      ${metric("Approaching Deadlines", dueSoon.length, "Due inside two days")}
      ${metric("Fulfillment Ratio", `${ratio}%`, "Completed personal queue")}
      ${metric("Open Queue", open.length, "Items still moving")}
      ${metric("Feedback Items", feedbackForUser(user.id).length, "Supervisor evaluations")}
    </div>
    <div class="member-kanban">
      ${kanbanColumns(tasks)}
    </div>
  `;
}

function renderTeams() {
  const user = activeUser();
  if (!isSupervisor()) {
    el.teamsView.innerHTML = restrictedPanel();
    return;
  }
  const team = state.teams.find((item) => item.supervisor_id === user.id);
  const managed = teamMembers(state, user.id);
  const unassigned = state.users.filter((item) => item.role === "TEAM_MEMBER" && !item.team_id);

  el.teamsView.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Team management hub</p>
        <h3>${escapeHtml(team?.name || "Managed team")}</h3>
      </div>
      <span class="section-count">${managed.length} members</span>
    </div>
    <div class="team-management-grid">
      <article class="workload-card">
        <h4>Current roster</h4>
        <div class="member-list">
          ${managed.map((member) => `
            <div class="member-row">
              <span class="avatar-chip">${initials(member.name)}</span>
              <div>
                <strong>${escapeHtml(member.name)}</strong>
                <small>${escapeHtml(member.email)}</small>
              </div>
              <button class="ghost-button mini-button" data-action="offboardUser" data-user-id="${escapeHtml(member.id)}">Offboard</button>
            </div>
          `).join("")}
        </div>
      </article>
      <article class="workload-card">
        <h4>Unassigned users</h4>
        <div class="member-list">
          ${unassigned.length ? unassigned.map((member) => `
            <div class="member-row">
              <span class="avatar-chip">${initials(member.name)}</span>
              <div>
                <strong>${escapeHtml(member.name)}</strong>
                <small>${escapeHtml(member.email)}</small>
              </div>
              <button class="secondary-button mini-button" data-action="addToTeam" data-user-id="${escapeHtml(member.id)}">Assign</button>
            </div>
          `).join("") : '<p class="empty-column">Every user is assigned.</p>'}
        </div>
      </article>
    </div>
  `;
}

function renderTasks() {
  const user = activeUser();
  const tasks = visibleTasksForUser(state, user);
  el.tasksView.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Task lifecycle</p>
        <h3>${isSupervisor() ? "Managed task board" : "My task board"}</h3>
      </div>
      ${isSupervisor() ? '<button class="primary-button" data-action="openTaskModal">Quick Task Creation</button>' : ""}
    </div>
    <div class="board">
      ${kanbanColumns(tasks)}
    </div>
  `;
}

function kanbanColumns(tasks) {
  return ["TODO", "IN_PROGRESS", "DONE"].map((status) => {
    const columnTasks = tasks.filter((task) => task.status === status);
    return `
      <article class="board-column">
        <h4>${statusLabels[status]} <span class="section-count">${columnTasks.length}</span></h4>
        ${columnTasks.length ? columnTasks.map((task) => taskCard(task)).join("") : '<p class="empty-column">No tasks here.</p>'}
      </article>
    `;
  }).join("");
}

function taskCard(task) {
  const assignee = state.users.find((user) => user.id === task.assignee_id);
  const attachments = state.attachments.filter((item) => item.task_id === task.id);
  const feedback = state.feedback.filter((item) => item.task_id === task.id);
  const completed = task.completed_at ? new Date(task.completed_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not completed";
  const canEdit = isSupervisor() || task.assignee_id === activeUser()?.id;
  return `
    <article class="task-card" data-priority="${escapeHtml(task.priority)}">
      <div class="task-card-header">
        <strong>${escapeHtml(task.title)}</strong>
        <span class="state-pill ${task.priority === "HIGH" ? "warning" : ""}">${escapeHtml(priorityLabels[task.priority])}</span>
      </div>
      <p>${escapeHtml(task.description)}</p>
      <div class="task-meta">
        <span>Due ${escapeHtml(task.due_date)}</span>
        <span>${escapeHtml(assignee?.name || "Unassigned")}</span>
        <span>completed_at: ${escapeHtml(completed)}</span>
      </div>
      <div class="task-controls">
        ${isSupervisor() ? `<select data-task-control="assignee" data-task-id="${escapeHtml(task.id)}">${assigneeOptions(task.assignee_id)}</select>` : ""}
        ${canEdit ? `<select data-task-control="status" data-task-id="${escapeHtml(task.id)}">${statusOptions(task.status)}</select>` : ""}
      </div>
      <div class="attachment-strip">
        ${attachments.map((item) => `<span>${escapeHtml(item.file_name)}</span>`).join("") || "<span>No attachments</span>"}
      </div>
      <div class="button-row compact-row">
        ${canEdit ? `<button class="ghost-button mini-button" data-action="openAttachmentModal" data-task-id="${escapeHtml(task.id)}">Attach file</button>` : ""}
        ${isSupervisor() ? `<button class="ghost-button mini-button" data-action="openFeedbackModal" data-task-id="${escapeHtml(task.id)}" ${task.status !== "DONE" ? "disabled" : ""}>Evaluate</button>` : ""}
        <button class="ghost-button mini-button" data-action="inspectTask" data-task-id="${escapeHtml(task.id)}">Inspect</button>
      </div>
      ${feedback.length ? `<div class="feedback-chip">${feedback.length} evaluation${feedback.length === 1 ? "" : "s"}</div>` : ""}
    </article>
  `;
}

function renderNotificationsChrome(user) {
  const unread = notificationsForUser(user.id).filter((item) => !item.is_read);
  el.notificationCount.textContent = String(unread.length);
  el.notificationPopover.innerHTML = `
    <div class="popover-header">
      <strong>Notification inbox</strong>
      <button class="ghost-button mini-button" data-action="markVisibleNotificationsRead">Mark read</button>
    </div>
    ${notificationsForUser(user.id).slice(0, 4).map(notificationRow).join("") || '<p class="empty-column">No notifications yet.</p>'}
  `;
}

function renderNotificationsSection() {
  const user = activeUser();
  el.notificationsView.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">In-app alerts</p>
        <h3>Notification center</h3>
      </div>
      <button class="secondary-button" data-action="markVisibleNotificationsRead">Mark all visible read</button>
    </div>
    <div class="notification-list">
      ${notificationsForUser(user.id).map(notificationRow).join("") || '<p class="empty-column">No notifications yet.</p>'}
    </div>
  `;
}

function notificationRow(item) {
  return `
    <article class="notification-row ${item.is_read ? "is-read" : ""}">
      <div>
        <strong>${item.is_read ? "Read" : "Unread"}</strong>
        <p>${escapeHtml(item.message)}</p>
        <small>${escapeHtml(new Date(item.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }))}</small>
      </div>
      ${item.is_read ? "" : `<button class="ghost-button mini-button" data-action="markNotificationRead" data-notification-id="${escapeHtml(item.id)}">Read</button>`}
    </article>
  `;
}

function renderAnalytics() {
  const user = activeUser();
  const report = reportingForUser(state, user.id);
  el.analyticsView.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Reporting data service</p>
        <h3>Analytics and recommendations</h3>
      </div>
      <span class="section-count">${report.visibleTaskCount} visible tasks</span>
    </div>
    <div class="analytics-grid">
      <article class="workload-card">
        <h4>Task volume by status</h4>
        ${Object.entries(report.pipeline).map(([status, count]) => `
          <div class="analytics-row">
            <span>${escapeHtml(statusLabels[status])}</span>
            <strong>${count}</strong>
          </div>
        `).join("")}
      </article>
      <article class="workload-card">
        <h4>Personal workflow tracking</h4>
        <div class="workflow-table">
          ${report.personalWorkflows.map((row) => `
            <div>
              <strong>${escapeHtml(row.name)}</strong>
              <span>${row.cleared} cleared</span>
              <span>${row.open} open</span>
              <span>${row.ratio}%</span>
            </div>
          `).join("")}
        </div>
      </article>
      <article class="workload-card">
        <h4>Predictive recommendations</h4>
        <div class="recommendation-list">
          ${report.recommendations.length ? report.recommendations.map((warning) => `<p>${escapeHtml(warning)}</p>`).join("") : "<p>No near-deadline warnings for this role.</p>"}
        </div>
      </article>
      <article class="workload-card schema-card">
        <h4>API router map</h4>
        <pre>${escapeHtml(apiRoutes.join("\n"))}</pre>
      </article>
    </div>
  `;
}

function renderAudit() {
  el.activityLog.innerHTML = state.auditLog.slice(-8).reverse().map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function metric(label, value, subtext) {
  return `
    <article class="metric">
      <span class="metric-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(subtext)}</small>
    </article>
  `;
}

function rosterRow(member) {
  const assigned = state.tasks.filter((task) => task.assignee_id === member.id);
  const open = assigned.filter((task) => task.status !== "DONE").length;
  return `
    <div class="member-row">
      <span class="avatar-chip">${initials(member.name)}</span>
      <div>
        <strong>${escapeHtml(member.name)}</strong>
        <small>${open} open task${open === 1 ? "" : "s"}</small>
      </div>
    </div>
  `;
}

function restrictedPanel() {
  return `
    <article class="workload-card">
      <h4>Route protected</h4>
      <p>This section is hidden from team members by the local restrictTo role guard.</p>
    </article>
  `;
}

function statusOptions(selected) {
  return Object.entries(statusLabels).map(([value, label]) => `
    <option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>
  `).join("");
}

function assigneeOptions(selected) {
  const teamUserIds = teamMembers(state, activeUser().id).map((user) => user.id);
  const users = state.users.filter((user) => user.role === "TEAM_MEMBER" && (teamUserIds.includes(user.id) || !user.team_id));
  return [
    `<option value="" ${!selected ? "selected" : ""}>Unassigned</option>`,
    ...users.map((user) => `<option value="${escapeHtml(user.id)}" ${selected === user.id ? "selected" : ""}>${escapeHtml(user.name)}</option>`),
  ].join("");
}

function notificationsForUser(userId) {
  return state.notifications
    .filter((item) => item.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function feedbackForUser(userId) {
  const taskIds = state.tasks.filter((task) => task.assignee_id === userId).map((task) => task.id);
  return state.feedback.filter((item) => taskIds.includes(item.task_id));
}

function addAudit(message) {
  state.auditLog.push(message);
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function daysUntil(dateValue) {
  const due = new Date(`${dateValue}T23:59:59.000Z`);
  const today = new Date("2026-06-02T08:00:00.000Z");
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function openModal(title, body) {
  el.modalTitle.textContent = title;
  el.modalBody.innerHTML = body;
  el.modalBackdrop.hidden = false;
}

function closeModal() {
  el.modalBackdrop.hidden = true;
  el.modalBody.innerHTML = "";
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("is-visible");
  window.setTimeout(() => el.toast.classList.remove("is-visible"), 2400);
}

function applyTheme() {
  el.body.dataset.theme = state.theme;
  el.themeToggle.textContent = state.theme === "dark" ? "Light Mode" : "Dark Mode";
}

function openTaskModal() {
  if (!isSupervisor()) return toast("Only supervisors can create tasks.");
  openModal("Quick Task Creation", `
    <form class="form-grid" id="taskForm">
      <label>Title<input name="title" value="Sprint risk review" required /></label>
      <label>Description<textarea name="description">Review open work, identify bottlenecks, and assign follow-up owners.</textarea></label>
      <label>Due date<input name="due_date" type="date" value="2026-06-05" required /></label>
      <label>Priority<select name="priority">
        <option value="LOW">Low</option>
        <option value="MEDIUM" selected>Medium</option>
        <option value="HIGH">High</option>
      </select></label>
      <label>Assignee<select name="assignee_id">${assigneeOptions("")}</select></label>
      <div class="button-row">
        <button class="primary-button" type="submit">Create task</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("taskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task = {
      id: `task-${Date.now()}`,
      title: form.get("title").trim(),
      description: form.get("description").trim(),
      due_date: form.get("due_date"),
      priority: form.get("priority"),
      status: "TODO",
      creator_id: activeUser().id,
      assignee_id: null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    state.tasks.push(task);
    if (form.get("assignee_id")) {
      assignTask(state, task.id, form.get("assignee_id"), activeUser().id);
    } else {
      addAudit(`${activeUser().name} created ${task.title} without an assignee.`);
    }
    closeModal();
    render();
    toast("Task created.");
  });
}

function openCreateProfileModal() {
  openModal("Create profile", `
    <form class="form-grid" id="createProfileForm">
      <label>Name<input name="name" value="Sara" required /></label>
      <label>Email<input name="email" type="email" value="sara@teamflow.local" required /></label>
      <label>Password<input name="password" type="password" value="demo12345" required /></label>
      <label>Role<select name="role">
        <option value="TEAM_MEMBER" selected>Team Member</option>
        <option value="SUPERVISOR">Supervisor</option>
      </select></label>
      <p class="quiet-copy">New profiles are local demo accounts stored in this browser only.</p>
      <div class="button-row">
        <button class="primary-button" type="submit">Create and sign in</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("createProfileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const user = createDemoUser(state, {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      });
      state.activeUserId = user.id;
      state.section = roleSectionsForUser(user)[0];
      closeModal();
      saveState();
      showApp();
      toast(`Created ${user.name}'s profile.`);
    } catch (error) {
      toast(error.message);
    }
  });
}

function openAttachmentModal(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  openModal(`Attach file to ${task.title}`, `
    <form class="form-grid" id="attachmentForm">
      <label>File<input name="file" type="file" /></label>
      <label>Fallback file name<input name="file_name" value="progress-evidence.png" /></label>
      <div class="button-row">
        <button class="primary-button" type="submit">Attach</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("attachmentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const fileName = file?.name || form.get("file_name").trim() || "attachment.bin";
    addAttachment(state, taskId, fileName, `uploads/${fileName}`);
    closeModal();
    render();
    toast("Attachment recorded.");
  });
}

function openFeedbackModal(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (task.status !== "DONE") return toast("Feedback unlocks after the task is DONE.");
  openModal(`Evaluate ${task.title}`, `
    <form class="form-grid" id="feedbackForm">
      <label>Rating<select name="rating">
        <option value="5">5 stars</option>
        <option value="4">4 stars</option>
        <option value="3">3 stars</option>
        <option value="2">2 stars</option>
        <option value="1">1 star</option>
      </select></label>
      <label>Comment<textarea name="comment">Strong completion evidence. Keep this linked in the final report.</textarea></label>
      <div class="button-row">
        <button class="primary-button" type="submit">Send feedback</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("feedbackForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addFeedback(state, taskId, activeUser().id, Number(form.get("rating")), form.get("comment"));
    closeModal();
    render();
    toast("Feedback sent.");
  });
}

function inspectTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  const attachments = state.attachments.filter((item) => item.task_id === taskId);
  const feedback = state.feedback.filter((item) => item.task_id === taskId);
  openModal(`Task detail: ${task.title}`, `
    <div class="detail-stack">
      <p>${escapeHtml(task.description)}</p>
      <div class="task-meta">
        <span>Status: ${escapeHtml(statusLabels[task.status])}</span>
        <span>Priority: ${escapeHtml(priorityLabels[task.priority])}</span>
        <span>Assignee: ${escapeHtml(userName(state, task.assignee_id))}</span>
        <span>completed_at: ${escapeHtml(task.completed_at || "Locked until DONE")}</span>
      </div>
      <h4>Attachments</h4>
      ${attachments.map((item) => `<p>${escapeHtml(item.file_name)} - ${escapeHtml(item.file_url)}</p>`).join("") || "<p>No attachments yet.</p>"}
      <h4>Feedback</h4>
      ${feedback.map((item) => `<p>${item.rating}/5 - ${escapeHtml(item.comment)}</p>`).join("") || "<p>Feedback module unlocks after DONE.</p>"}
    </div>
  `);
}

function markVisibleNotificationsRead() {
  notificationsForUser(activeUser().id).forEach((item) => {
    if (!item.is_read) markNotificationRead(state, item.id);
  });
  render();
  toast("Notifications marked read.");
}

function resetDemo() {
  state = createInitialDemoState();
  localStorage.removeItem(storageKey);
  renderLogin();
  showLogin();
  toast("Local demo reset.");
}

function handleAction(target) {
  const action = target.dataset.action;
  const taskId = target.dataset.taskId;
  const userId = target.dataset.userId;
  const notificationId = target.dataset.notificationId;
  const team = state.teams.find((item) => item.supervisor_id === activeUser()?.id);

  if (action === "openTaskModal") openTaskModal();
  if (action === "openCreateProfileModal") openCreateProfileModal();
  if (action === "openAttachmentModal") openAttachmentModal(taskId);
  if (action === "openFeedbackModal") openFeedbackModal(taskId);
  if (action === "inspectTask") inspectTask(taskId);
  if (action === "markNotificationRead") {
    markNotificationRead(state, notificationId);
    render();
  }
  if (action === "markVisibleNotificationsRead") markVisibleNotificationsRead();
  if (action === "addToTeam" && team) {
    addUserToTeam(state, userId, team.id, activeUser().id);
    render();
    toast("User assigned to team.");
  }
  if (action === "offboardUser") {
    offboardUser(state, userId, activeUser().id);
    render();
    toast("User offboarded.");
  }
}

el.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  login(el.loginEmail.value.trim(), el.loginPassword.value);
});

el.demoAccounts.addEventListener("click", (event) => {
  const button = event.target.closest("[data-demo-email]");
  if (!button) return;
  el.loginEmail.value = button.dataset.demoEmail;
  el.loginPassword.value = "demo12345";
  login(el.loginEmail.value, el.loginPassword.value);
});

el.navList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-section]");
  if (!button) return;
  state.section = button.dataset.section;
  render();
});

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  const jumpTarget = event.target.closest("[data-section-jump]");
  if (actionTarget) handleAction(actionTarget);
  if (jumpTarget) {
    state.section = jumpTarget.dataset.sectionJump;
    render();
  }
  if (event.target.matches("[data-close-modal]")) closeModal();
});

document.addEventListener("change", (event) => {
  const control = event.target.closest("[data-task-control]");
  if (!control) return;
  const taskId = control.dataset.taskId;
  if (control.dataset.taskControl === "status") {
    setTaskStatus(state, taskId, control.value, activeUser().id);
  }
  if (control.dataset.taskControl === "assignee") {
    const task = state.tasks.find((item) => item.id === taskId);
    if (control.value) {
      assignTask(state, taskId, control.value, activeUser().id);
    } else if (task) {
      task.assignee_id = null;
      task.status = "TODO";
      addAudit(`${activeUser().name} cleared the assignee for ${task.title}.`);
    }
  }
  render();
});

el.notificationToggle.addEventListener("click", () => {
  state.section = "notifications";
  el.notificationPopover.hidden = true;
  el.notificationToggle.setAttribute("aria-expanded", "false");
  render();
});

el.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  render();
});

el.logoutButton.addEventListener("click", showLogin);
el.resetDemo.addEventListener("click", resetDemo);
el.closeModal.addEventListener("click", closeModal);
el.modalBackdrop.addEventListener("click", (event) => {
  if (event.target === el.modalBackdrop) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.modalBackdrop.hidden) closeModal();
});

renderLogin();
if (activeUser()) {
  showApp();
} else {
  showLogin();
}
