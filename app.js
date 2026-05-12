const storageKey = "smart-group-project-assistant-v4";

const members = [
  { name: "Faisal", initials: "FA", role: "Integration and demo", availability: "Available evenings", speed: 86 },
  { name: "Mohammed", initials: "MO", role: "Research and report", availability: "Needs clear scope", speed: 73 },
  { name: "Yousef", initials: "YO", role: "Programming", availability: "Can help with prototype", speed: 82 },
  { name: "Ahmed", initials: "AH", role: "Presentation and review", availability: "Free this week", speed: 78 }
];

const profiles = [
  { id: "supervisor", name: "Dr. Imran", initials: "DI", role: "Supervisor", kind: "supervisor", accent: "supervisor" },
  { id: "faisal", name: "Faisal", initials: "FA", role: "Team Member", kind: "member", member: "Faisal" },
  { id: "mohammed", name: "Mohammed", initials: "MO", role: "Team Member", kind: "member", member: "Mohammed" },
  { id: "yousef", name: "Yousef", initials: "YO", role: "Team Member", kind: "member", member: "Yousef" },
  { id: "ahmed", name: "Ahmed", initials: "AH", role: "Team Member", kind: "member", member: "Ahmed" }
];

const initialState = {
  section: "dashboard",
  theme: "light",
  activeProfileId: null,
  linked: false,
  recommendation: {
    status: "Open",
    message: "Assign the presentation to Ahmed and the report to Mohammed.",
    reason: "Ahmed is available for visual delivery, and Mohammed is best positioned for writing."
  },
  riskDecision: "Open",
  assistantBrief: "First clear the programming delay, then assign the remaining deliverables. Keep the team discussion short and evidence-based.",
  tasks: [
    { id: "presentation", title: "Prepare presentation", owner: "Unassigned", status: "backlog", points: 3, progress: 0, due: "May 7", risk: "normal", activity: "Not started" },
    { id: "report", title: "Write final report", owner: "Unassigned", status: "backlog", points: 4, progress: 0, due: "May 7", risk: "normal", activity: "Not started" },
    { id: "prototype", title: "Programming prototype", owner: "Yousef", status: "doing", points: 5, progress: 35, due: "May 6", risk: "delay", activity: "No upload for 4 days" },
    { id: "integration", title: "Integrate dashboard screens", owner: "Faisal", status: "doing", points: 3, progress: 55, due: "May 6", risk: "normal", activity: "Progress uploaded" },
    { id: "references", title: "Review Chapter 3 references", owner: "Mohammed", status: "done", points: 2, progress: 100, due: "May 3", risk: "normal", activity: "Submitted" },
    { id: "sketches", title: "Clean storyboard sketches", owner: "Yousef", status: "done", points: 2, progress: 100, due: "May 2", risk: "normal", activity: "Submitted" }
  ],
  feedback: [
    { id: "fb1", owner: "Faisal", from: "Dr. Imran", text: "Good dashboard direction. Make sure the demo flow is easy to explain.", task: "Integrate dashboard screens" },
    { id: "fb2", owner: "Yousef", from: "Dr. Imran", text: "Prototype risk is visible. Upload a small proof of progress before reassigning.", task: "Programming prototype" },
    { id: "fb3", owner: "Mohammed", from: "Dr. Imran", text: "Reference section is clear. Connect it to human-control justification.", task: "Review Chapter 3 references" },
    { id: "fb4", owner: "Ahmed", from: "Dr. Imran", text: "Presentation can be concise: problem, assistant suggestion, human decision.", task: "Prepare presentation" }
  ],
  supervisorTeams: [
    { id: "campus", name: "Campus Planner", state: "stable", progress: 88, balance: 91, risk: 0, note: "All members uploaded this week.", reviewed: false },
    { id: "lab", name: "Lab Scheduler", state: "watch", progress: 64, balance: 72, risk: 1, note: "Quiet for two days.", reviewed: false },
    { id: "clinic", name: "Clinic Queue", state: "risk", progress: 46, balance: 38, risk: 2, note: "Two members overloaded.", reviewed: false }
  ],
  log: [
    "Workspace created for CS1352.",
    "Delay risk detected privately for Programming prototype.",
    "Recommendation waiting for a human decision."
  ]
};

const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" }
];

let state = loadState();

const el = {
  body: document.body,
  welcomeScreen: document.getElementById("welcomeScreen"),
  appShell: document.getElementById("appShell"),
  profileGrid: document.getElementById("profileGrid"),
  nav: document.querySelectorAll(".nav-item"),
  sections: document.querySelectorAll(".section"),
  themeToggle: document.getElementById("themeToggle"),
  linkPlatform: document.getElementById("linkPlatform"),
  switchProfile: document.getElementById("switchProfile"),
  addTask: document.getElementById("addTask"),
  resetDemo: document.getElementById("resetDemo"),
  activeProfileName: document.getElementById("activeProfileName"),
  activeProfileRole: document.getElementById("activeProfileRole"),
  deadlineDays: document.getElementById("deadlineDays"),
  deadlineLabel: document.getElementById("deadlineLabel"),
  balanceScore: document.getElementById("balanceScore"),
  balanceLabel: document.getElementById("balanceLabel"),
  pendingChoices: document.getElementById("pendingChoices"),
  automationState: document.getElementById("automationState"),
  automationLabel: document.getElementById("automationLabel"),
  briefTitle: document.getElementById("briefTitle"),
  briefText: document.getElementById("briefText"),
  suggestionText: document.getElementById("suggestionText"),
  presentationOwner: document.getElementById("presentationOwner"),
  reportOwner: document.getElementById("reportOwner"),
  reasonFast: document.getElementById("reasonFast"),
  reasonBalance: document.getElementById("reasonBalance"),
  reasonCalendar: document.getElementById("reasonCalendar"),
  recommendationStatus: document.getElementById("recommendationStatus"),
  riskText: document.getElementById("riskText"),
  riskPrivacyText: document.getElementById("riskPrivacyText"),
  taskBoard: document.getElementById("taskBoard"),
  supervisorBoard: document.getElementById("supervisorBoard"),
  supervisorGrid: document.getElementById("supervisorGrid"),
  decisionCount: document.getElementById("decisionCount"),
  decisionList: document.getElementById("decisionList"),
  memberList: document.getElementById("memberList"),
  riskList: document.getElementById("riskList"),
  activityLog: document.getElementById("activityLog"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  closeModal: document.getElementById("closeModal"),
  toast: document.getElementById("toast")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? { ...clone(initialState), ...JSON.parse(saved) } : clone(initialState);
  } catch {
    return clone(initialState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function activeProfile() {
  return profiles.find((profile) => profile.id === state.activeProfileId) || null;
}

function isSupervisor() {
  return activeProfile()?.kind === "supervisor";
}

function visibleSectionsForProfile() {
  return isSupervisor()
    ? ["dashboard", "supervisor", "tasks", "decisions", "insights", "storyboards"]
    : ["dashboard", "tasks", "insights", "storyboards"];
}

function renderProfiles() {
  el.profileGrid.innerHTML = profiles.map((profile) => `
    <button class="profile-card ${profile.kind === "supervisor" ? "profile-supervisor" : ""}" data-profile-id="${escapeHtml(profile.id)}">
      <span class="profile-avatar">${escapeHtml(profile.initials)}</span>
      <strong>${escapeHtml(profile.name)}</strong>
      <small>${escapeHtml(profile.role)}</small>
    </button>
  `).join("");
}

function renderNavigation() {
  const allowed = visibleSectionsForProfile();
  el.nav.forEach((item) => {
    const visible = allowed.includes(item.dataset.section);
    item.hidden = !visible;
    item.disabled = !visible;
    item.classList.toggle("is-active", item.dataset.section === state.section);
  });
}

function openProfile(profileId) {
  state.activeProfileId = profileId;
  const profile = activeProfile();
  const allowed = visibleSectionsForProfile();
  state.section = profile.kind === "supervisor" ? "supervisor" : "dashboard";
  el.welcomeScreen.hidden = true;
  el.appShell.hidden = false;
  el.body.dataset.role = profile.kind;
  renderNavigation();
  showSection(allowed.includes(state.section) ? state.section : allowed[0]);
  render();
  showToast(`Opened ${profile.name}'s workspace.`);
}

function switchProfile() {
  state.activeProfileId = null;
  saveState();
  el.appShell.hidden = true;
  el.welcomeScreen.hidden = false;
  renderProfiles();
}

function showSection(id) {
  const allowed = visibleSectionsForProfile();
  state.section = allowed.includes(id) ? id : allowed[0];
  el.sections.forEach((section) => section.classList.toggle("is-visible", section.id === state.section));
  renderNavigation();
  saveState();
}

function applyTheme() {
  el.body.dataset.theme = state.theme;
  el.themeToggle.textContent = state.theme === "dark" ? "Light Mode" : "Dark Mode";
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme();
  addLog(`${state.theme === "dark" ? "Dark" : "Light"} mode enabled.`);
  showToast(`${state.theme === "dark" ? "Dark" : "Light"} mode enabled.`);
}

function getTask(id) {
  return state.tasks.find((task) => task.id === id);
}

function activeTasks() {
  return state.tasks.filter((task) => task.status !== "done");
}

function visibleTasks() {
  const profile = activeProfile();
  if (!profile || profile.kind === "supervisor") {
    return state.tasks;
  }
  return state.tasks.filter((task) => task.owner === profile.member);
}

function visibleActiveTasks() {
  return visibleTasks().filter((task) => task.status !== "done");
}

function memberStats() {
  return members.map((member) => {
    const owned = state.tasks.filter((task) => task.owner === member.name);
    const active = owned.filter((task) => task.status !== "done");
    const done = owned.filter((task) => task.status === "done");
    return {
      ...member,
      activeTasks: active.length,
      doneTasks: done.length,
      load: active.reduce((sum, task) => sum + task.points, 0),
      completed: done.reduce((sum, task) => sum + task.points, 0),
      risks: active.filter((task) => task.risk === "delay" || task.risk === "watch").length
    };
  });
}

function balanceScore() {
  const loads = memberStats().map((member) => member.load);
  const max = Math.max(...loads, 1);
  const min = Math.min(...loads);
  return Math.round(Math.max(0, 100 - ((max - min) / max) * 100));
}

function overallProgress() {
  const total = state.tasks.reduce((sum, task) => sum + task.points, 0);
  const done = state.tasks.reduce((sum, task) => sum + (task.points * task.progress) / 100, 0);
  return total ? Math.round((done / total) * 100) : 0;
}

function riskTask() {
  return state.tasks.find((task) => task.risk === "delay") || state.tasks.find((task) => task.risk === "watch");
}

function suggestedOwners() {
  const stats = memberStats();
  const availableFast = stats
    .filter((member) => member.risks === 0)
    .sort((a, b) => b.speed - a.speed || a.load - b.load)[0];
  const lightest = stats
    .filter((member) => member.name !== availableFast?.name)
    .sort((a, b) => a.load - b.load || b.speed - a.speed)[0];
  return {
    presentation: availableFast?.name || "Sarah",
    report: lightest?.name || "Ahmed"
  };
}

function openDecisionCount() {
  if (!isSupervisor()) {
    const profile = activeProfile();
    return profile ? visibleActiveTasks().filter((task) => task.risk === "delay" || task.risk === "watch").length : 0;
  }
  let count = 0;
  if (state.recommendation.status === "Open") count++;
  if (state.riskDecision === "Open" && riskTask()) count++;
  count += state.tasks.filter((task) => task.status === "done" && !task.approved).length;
  return count;
}

function personalProgress(memberName) {
  const tasks = state.tasks.filter((task) => task.owner === memberName);
  const total = tasks.reduce((sum, task) => sum + task.points, 0);
  const progress = tasks.reduce((sum, task) => sum + (task.points * task.progress) / 100, 0);
  return total ? Math.round((progress / total) * 100) : 0;
}

function memberBrief(memberName) {
  const tasks = state.tasks.filter((task) => task.owner === memberName);
  const stuck = tasks.find((task) => task.risk === "delay" || task.risk === "watch");
  const active = tasks.filter((task) => task.status !== "done");
  if (stuck) {
    return `Update ${stuck.title} first. If you are blocked, mark it stuck so the supervisor sees the right signal.`;
  }
  if (active.length) {
    return `Focus on ${active[0].title}. A small progress update is enough to keep the team aligned.`;
  }
  return "You have no active tasks. Check supervisor feedback or offer help on a team risk.";
}

function setRecommendationControls(showSupervisorControls) {
  ["acceptSuggestion", "modifySuggestion", "rejectSuggestion", "sendReminder", "reassignRisk", "ignoreRisk"].forEach((id) => {
    const button = document.getElementById(id);
    button.hidden = !showSupervisorControls;
  });
  document.getElementById("explainSuggestion").hidden = false;
}

function renderDashboard() {
  const profile = activeProfile();
  const balance = balanceScore();
  const risk = riskTask();
  const suggested = suggestedOwners();
  const presentation = getTask("presentation");
  const report = getTask("report");
  const myTasks = visibleTasks();
  const myActive = visibleActiveTasks();
  const myDone = myTasks.filter((task) => task.status === "done");
  const myRisk = profile?.kind === "member" ? myActive.find((task) => task.risk === "delay" || task.risk === "watch") : risk;

  el.activeProfileName.textContent = profile ? `${profile.name}'s workspace` : "TeamFlow Workspace";
  el.activeProfileRole.textContent = profile ? `${profile.role} profile` : "Choose a profile";
  el.linkPlatform.hidden = profile?.kind !== "supervisor";
  el.addTask.hidden = profile?.kind !== "supervisor";
  el.resetDemo.hidden = profile?.kind !== "supervisor";

  el.deadlineDays.textContent = myActive.some((task) => task.due === "May 6") ? "1 day" : "3 days";
  el.deadlineLabel.textContent = myRisk ? `${myRisk.title} is closest` : profile?.kind === "member" ? "Your visible deadline window" : "Final submission window";
  el.balanceScore.textContent = profile?.kind === "member" ? `${personalProgress(profile.member)}%` : `${balance}%`;
  el.balanceLabel.textContent = profile?.kind === "member" ? "Your milestone progress" : balance >= 75 ? "Healthy spread of active work" : "One member is carrying too much";
  el.pendingChoices.textContent = openDecisionCount();
  el.automationState.textContent = state.linked ? "Linked" : "Demo";
  el.automationLabel.textContent = state.linked ? "Course tasks imported" : "Blackboard is optional in this prototype";
  el.briefTitle.textContent = profile?.kind === "member" ? "Your focus" : risk ? "Protect the deadline" : "Keep momentum";
  el.briefText.textContent = profile?.kind === "member" ? memberBrief(profile.member) : state.assistantBrief;

  const proposedPresentation = presentation.owner === "Unassigned" ? suggested.presentation : presentation.owner;
  const proposedReport = report.owner === "Unassigned" ? suggested.report : report.owner;
  el.presentationOwner.textContent = proposedPresentation;
  el.reportOwner.textContent = proposedReport;
  el.suggestionText.textContent = profile?.kind === "member"
    ? `You have ${myActive.length} active task${myActive.length === 1 ? "" : "s"} and ${myDone.length} completed task${myDone.length === 1 ? "" : "s"}.`
    : state.recommendation.message;
  el.reasonFast.textContent = profile?.kind === "member" ? "Use status when you are stuck" : `${proposedPresentation} is the best fit for visual delivery`;
  el.reasonBalance.textContent = profile?.kind === "member" ? "Only your assigned work appears in Team Board" : `${proposedReport} keeps the active workload fair`;
  el.reasonCalendar.textContent = profile?.kind === "member" ? "Supervisor feedback appears in Insights" : state.linked ? "Checked against imported course dates" : "Calendar sync is not required for this demo";
  el.recommendationStatus.textContent = profile?.kind === "member" ? "Personal" : state.recommendation.status;
  el.recommendationStatus.className = `confidence ${profile?.kind === "member" || state.recommendation.status !== "Open" ? "done" : ""}`;

  setRecommendationControls(profile?.kind === "supervisor");

  if (myRisk) {
    el.riskText.textContent = profile?.kind === "member"
      ? `You marked attention needed on ${myRisk.title}: ${myRisk.activity}.`
      : `${myRisk.owner} needs attention on ${myRisk.title}: ${myRisk.activity}.`;
    el.riskPrivacyText.textContent = profile?.kind === "member"
      ? "Use Team Board to update progress or change status to Stuck."
      : state.riskDecision === "Open" ? "Private to the team leader until an action is chosen." : `Handled: ${state.riskDecision}.`;
  } else {
    el.riskText.textContent = "No active delay risk. The assistant stays quiet.";
    el.riskPrivacyText.textContent = "No intervention needed.";
  }
}

function renderTeamBoard() {
  el.taskBoard.innerHTML = columns.map((column) => {
    const tasks = visibleTasks().filter((task) => task.status === column.id);
    const cards = tasks.map((task) => `
      <article class="task-card" data-risk="${escapeHtml(task.risk)}">
        <div class="task-card-header">
          <strong>${escapeHtml(task.title)}</strong>
          <span class="state-pill ${task.risk === "delay" ? "warning" : ""}">${task.risk === "delay" ? "Risk" : task.progress + "%"}</span>
        </div>
        <div class="task-progress"><span style="width: ${task.progress}%"></span></div>
        <div class="task-meta">
          <span>${escapeHtml(task.owner)}</span>
          <span>${escapeHtml(task.due)}</span>
          <span>${task.points} pts</span>
          <span>${escapeHtml(task.activity)}</span>
        </div>
        <div class="task-controls">
          ${isSupervisor() ? `<select data-task-control="owner" data-task-id="${escapeHtml(task.id)}">${ownerOptions(task.owner)}</select>` : ""}
          <select data-task-control="status" data-task-id="${escapeHtml(task.id)}">${statusOptions(task.status)}</select>
          <button class="ghost-button mini-button" data-action="progress" data-task-id="${escapeHtml(task.id)}">Log +25%</button>
          ${!isSupervisor() ? `<button class="ghost-button mini-button" data-action="stuck" data-task-id="${escapeHtml(task.id)}">Stuck</button>` : ""}
        </div>
      </article>
    `).join("");

    return `
      <div class="board-column">
        <h4>${escapeHtml(column.title)}<span class="section-count">${tasks.length}</span></h4>
        ${cards || '<p class="empty-column">No tasks here.</p>'}
      </div>
    `;
  }).join("");
}

function currentTeamForSupervisor() {
  const risks = state.tasks.filter((task) => task.status !== "done" && (task.risk === "delay" || task.risk === "watch")).length;
  const balance = balanceScore();
  const progress = overallProgress();
  return {
    id: "smart",
    name: "Smart Assistant Team",
    state: risks > 0 ? "risk" : balance < 70 ? "watch" : "stable",
    progress,
    balance,
    risk: risks,
    note: risks > 0 ? "Needs intervention on delayed work." : "No urgent intervention.",
    reviewed: false,
    current: true
  };
}

function renderSupervisorBoard() {
  const teams = [currentTeamForSupervisor(), ...state.supervisorTeams];
  const groups = [
    { id: "risk", title: "Needs action" },
    { id: "watch", title: "Watch" },
    { id: "stable", title: "Stable" }
  ];

  el.supervisorBoard.innerHTML = groups.map((group) => {
    const groupTeams = teams.filter((team) => team.state === group.id);
    const cards = groupTeams.map((team) => `
      <article class="supervisor-team-card" data-state="${escapeHtml(team.state)}">
        <div class="task-card-header">
          <strong>${escapeHtml(team.name)}</strong>
          <span class="state-pill ${team.state === "stable" ? "done" : "warning"}">${team.progress}%</span>
        </div>
        <p>${escapeHtml(team.note)}</p>
        <div class="task-meta">
          <span>${team.balance}% balance</span>
          <span>${team.risk} risks</span>
          <span>${team.reviewed ? "Reviewed" : "Not reviewed"}</span>
        </div>
        <div class="supervisor-actions">
          <button class="ghost-button mini-button" data-action="${team.current ? "openTeamBoard" : "requestUpdate"}" data-team-id="${escapeHtml(team.id)}">${team.current ? "Open Team Board" : "Request Update"}</button>
          <button class="ghost-button mini-button" data-action="checkIn" data-team-id="${escapeHtml(team.id)}">Check-in</button>
          <button class="ghost-button mini-button" data-action="reviewed" data-team-id="${escapeHtml(team.id)}">Reviewed</button>
        </div>
      </article>
    `).join("");

    return `
      <div class="supervisor-column">
        <h4>${escapeHtml(group.title)}<span class="section-count">${groupTeams.length}</span></h4>
        ${cards || '<p class="empty-column">No teams here.</p>'}
      </div>
    `;
  }).join("");
}

function renderSupervisorSummary() {
  const team = currentTeamForSupervisor();
  el.supervisorGrid.innerHTML = `
    <article class="team-card">
      <span class="state-pill ${team.state === "stable" ? "done" : "warning"}">${team.state === "stable" ? "Stable" : "Watch"}</span>
      <h4>${escapeHtml(team.name)}</h4>
      <p>${team.risk} risks, ${team.balance}% balance, ${team.progress}% overall progress.</p>
      <meter min="0" max="100" value="${team.progress}"></meter>
    </article>
    <article class="team-card">
      <span class="state-pill">Supervisor need</span>
      <h4>Best next action</h4>
      <p>${team.risk > 0 ? "Ask the leader to resolve the delay before grading-week pressure builds." : "No direct intervention. Keep monitoring quietly."}</p>
      <meter min="0" max="100" value="${team.balance}"></meter>
    </article>
    <article class="team-card">
      <span class="state-pill done">HCAI fit</span>
      <h4>Human control</h4>
      <p>The assistant suggests and explains. Students and supervisors still make the decision.</p>
      <meter min="0" max="100" value="92"></meter>
    </article>
  `;
}

function renderDecisions() {
  if (!isSupervisor()) {
    el.decisionCount.textContent = "Personal";
    el.decisionList.innerHTML = `
      <article class="decision-row">
        <div>
          <h4>How to use your workspace</h4>
          <p>Update progress, mark a task stuck when blocked, and read supervisor feedback in Insights.</p>
        </div>
        <span class="state-pill done">Team member</span>
      </article>
    `;
    return;
  }
  const risk = riskTask();
  const items = [
    {
      title: "Task assignment recommendation",
      copy: state.recommendation.reason,
      status: state.recommendation.status,
      actions: [
        ["Accept", "accept"],
        ["Modify", "modify"],
        ["Reject", "reject"]
      ]
    },
    {
      title: "Delay risk response",
      copy: risk ? `${risk.title} needs a leader decision.` : "No active delay risk.",
      status: risk ? state.riskDecision : "Clear",
      actions: risk ? [
        ["Reminder", "reminder"],
        ["Reassign", "reassignRisk"],
        ["Ignore", "ignore"]
      ] : []
    },
    {
      title: "Reference suggestion",
      copy: "Chapter 3 is useful for the HCAI justification section.",
      status: "Accepted",
      actions: [["Why?", "reference"]]
    }
  ];

  el.decisionCount.textContent = `${openDecisionCount()} open`;
  const approvalTasks = state.tasks.filter((task) => task.status === "done" && !task.approved);
  const decisionMarkup = items.map((item) => `
    <article class="decision-row ${item.status !== "Open" ? "muted-row" : ""}">
      <div>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.copy)}</p>
      </div>
      <div class="decision-actions">
        <span class="state-pill ${item.status === "Open" ? "warning" : "done"}">${escapeHtml(item.status)}</span>
        ${item.actions.map(([label, action]) => `<button class="ghost-button mini-button" data-action="${action}">${escapeHtml(label)}</button>`).join("")}
      </div>
    </article>
  `).join("");
  const approvalMarkup = approvalTasks.map((task) => `
    <article class="decision-row">
      <div>
        <h4>Approve ${escapeHtml(task.title)}</h4>
        <p>${escapeHtml(task.owner)} marked this complete. Review it before final submission.</p>
      </div>
      <div class="decision-actions">
        <span class="state-pill warning">Review</span>
        <button class="ghost-button mini-button" data-action="approve" data-task-id="${escapeHtml(task.id)}">Approve</button>
        <button class="ghost-button mini-button" data-action="feedback" data-task-id="${escapeHtml(task.id)}">Feedback</button>
      </div>
    </article>
  `).join("");
  el.decisionList.innerHTML = `${decisionMarkup}${approvalMarkup || ""}`;
}

function renderMembers() {
  const profile = activeProfile();
  const stats = isSupervisor() ? memberStats() : memberStats().filter((member) => member.name === profile?.member);
  const maxLoad = Math.max(...stats.map((member) => member.load), 1);
  el.memberList.innerHTML = stats.map((member) => `
    <div class="member-row">
      <div class="avatar">${escapeHtml(member.initials)}</div>
      <div>
        <strong>${escapeHtml(member.name)}</strong>
        <p>${member.activeTasks} active | ${member.doneTasks} done | ${escapeHtml(member.availability)}</p>
        <div class="bar"><span style="width: ${Math.round((member.load / maxLoad) * 100)}%"></span></div>
      </div>
      <strong>${member.load} pts</strong>
    </div>
  `).join("");
}

function renderRisks() {
  const profile = activeProfile();
  const risks = visibleTasks().filter((task) => task.status !== "done" && (task.risk === "delay" || task.risk === "watch"));
  const riskMarkup = risks.length ? risks.map((task) => `
    <article class="risk-row">
      <strong>${escapeHtml(task.title)}</strong>
      <span>${escapeHtml(task.owner)}</span>
      <p>${escapeHtml(task.activity)}</p>
      ${isSupervisor() ? `<button class="ghost-button mini-button" data-action="reassignTask" data-task-id="${escapeHtml(task.id)}">Reassign</button>` : ""}
    </article>
  `).join("") : '<p class="empty-column">No active risks.</p>';
  const feedback = profile?.kind === "member" ? state.feedback.filter((item) => item.owner === profile.member) : [];
  const feedbackMarkup = feedback.map((item) => `
    <article class="risk-row feedback-row">
      <strong>${escapeHtml(item.task)}</strong>
      <span>${escapeHtml(item.from)}</span>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join("");
  el.riskList.innerHTML = profile?.kind === "member" ? `${riskMarkup}${feedbackMarkup}` : riskMarkup;
}

function renderLog() {
  el.activityLog.innerHTML = state.log.slice().reverse().map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function render() {
  renderDashboard();
  renderTeamBoard();
  renderSupervisorBoard();
  renderSupervisorSummary();
  renderDecisions();
  renderMembers();
  renderRisks();
  renderLog();
  saveState();
}

function ownerOptions(selected) {
  return ["Unassigned", ...members.map((member) => member.name)]
    .map((name) => `<option value="${escapeHtml(name)}" ${name === selected ? "selected" : ""}>${escapeHtml(name)}</option>`)
    .join("");
}

function statusOptions(selected) {
  return columns
    .map((column) => `<option value="${escapeHtml(column.id)}" ${column.id === selected ? "selected" : ""}>${escapeHtml(column.title)}</option>`)
    .join("");
}

function memberOptions(selected) {
  return members
    .map((member) => `<option value="${escapeHtml(member.name)}" ${member.name === selected ? "selected" : ""}>${escapeHtml(member.name)}</option>`)
    .join("");
}

function addLog(message) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  state.log.push(`${time} - ${message}`);
  state.log = state.log.slice(-50);
  renderLog();
  saveState();
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => el.toast.classList.remove("is-visible"), 2400);
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

function acceptRecommendation() {
  const suggested = suggestedOwners();
  Object.assign(getTask("presentation"), {
    owner: suggested.presentation,
    status: "doing",
    progress: Math.max(getTask("presentation").progress, 20),
    activity: "Assigned by team decision"
  });
  Object.assign(getTask("report"), {
    owner: suggested.report,
    status: "doing",
    progress: Math.max(getTask("report").progress, 20),
    activity: "Assigned by team decision"
  });
  state.recommendation.status = "Accepted";
  state.recommendation.message = `Presentation assigned to ${suggested.presentation}; report assigned to ${suggested.report}.`;
  addLog("Recommendation accepted and tasks assigned.");
  render();
  showToast("Recommendation applied.");
}

function modifyRecommendation() {
  const presentation = getTask("presentation");
  const report = getTask("report");
  openModal("Modify assignment", `
    <form class="form-grid" id="modifyForm">
      <label>Presentation owner<select name="presentation">${memberOptions(presentation.owner === "Unassigned" ? suggestedOwners().presentation : presentation.owner)}</select></label>
      <label>Report owner<select name="report">${memberOptions(report.owner === "Unassigned" ? suggestedOwners().report : report.owner)}</select></label>
      <div class="button-row">
        <button class="primary-button" type="submit">Save</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("modifyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    presentation.owner = form.get("presentation");
    presentation.status = "doing";
    presentation.progress = Math.max(presentation.progress, 20);
    presentation.activity = "Modified by team";
    report.owner = form.get("report");
    report.status = "doing";
    report.progress = Math.max(report.progress, 20);
    report.activity = "Modified by team";
    state.recommendation.status = "Modified";
    state.recommendation.message = `Team modified the plan: presentation to ${presentation.owner}, report to ${report.owner}.`;
    closeModal();
    addLog("Recommendation modified by the team.");
    render();
    showToast("Assignment modified.");
  });
}

function rejectRecommendation() {
  openModal("Reject recommendation", `
    <form class="form-grid" id="rejectForm">
      <label>Reason<textarea name="reason">The suggested assignment does not fit this week's availability.</textarea></label>
      <div class="button-row">
        <button class="danger-button" type="submit">Reject</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("rejectForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const reason = new FormData(event.currentTarget).get("reason").trim();
    state.recommendation.status = "Rejected";
    state.recommendation.message = "The team rejected this recommendation. Generate a focus plan or modify manually.";
    state.recommendation.reason = reason || "No reason provided.";
    closeModal();
    addLog(`Recommendation rejected: ${state.recommendation.reason}`);
    render();
    showToast("Recommendation rejected.");
  });
}

function explainRecommendation() {
  const suggested = suggestedOwners();
  openModal("Recommendation evidence", `
    <div class="explanation-box">
      <div><strong>For the team</strong><p>The recommendation reduces discussion time and gives each task a clear owner.</p></div>
      <div><strong>Why ${escapeHtml(suggested.presentation)}</strong><p>This member has the best speed score and no active risk.</p></div>
      <div><strong>Why ${escapeHtml(suggested.report)}</strong><p>This keeps workload points closer across members.</p></div>
    </div>
    <div class="button-row"><button class="primary-button" data-close-modal>Close</button></div>
  `);
}

function sendReminder() {
  const task = riskTask();
  if (!task) return showToast("No risk to remind.");
  task.risk = "watch";
  task.activity = "Private reminder sent";
  state.riskDecision = "Reminder sent";
  addLog(`Private reminder sent to ${task.owner} for ${task.title}.`);
  render();
  showToast("Reminder sent.");
}

function reassignRisk(taskId = null) {
  const task = taskId ? getTask(taskId) : riskTask();
  if (!task) return showToast("No task to reassign.");
  const lightest = memberStats().sort((a, b) => a.load - b.load)[0];
  openModal(`Reassign ${task.title}`, `
    <form class="form-grid" id="reassignForm">
      <label>New owner<select name="owner">${memberOptions(lightest.name)}</select></label>
      <div class="button-row">
        <button class="primary-button" type="submit">Reassign</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("reassignForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const oldOwner = task.owner;
    task.owner = new FormData(event.currentTarget).get("owner");
    task.risk = "normal";
    task.status = "doing";
    task.progress = Math.max(task.progress, 45);
    task.activity = `Reassigned from ${oldOwner}`;
    state.riskDecision = "Reassigned";
    closeModal();
    addLog(`${task.title} reassigned from ${oldOwner} to ${task.owner}.`);
    render();
    showToast("Task reassigned.");
  });
}

function ignoreRisk() {
  const task = riskTask();
  if (task) {
    task.risk = "watch";
    task.activity = "Leader reviewed and chose to wait";
  }
  state.riskDecision = "Ignored";
  addLog("Risk reviewed and ignored.");
  render();
  showToast("Risk ignored.");
}

function setTaskOwner(id, owner) {
  const task = getTask(id);
  if (!task) return;
  const oldOwner = task.owner;
  task.owner = owner;
  if (owner !== "Unassigned" && task.status === "backlog") task.status = "doing";
  if (task.risk === "delay") {
    task.risk = "normal";
    state.riskDecision = "Reassigned";
  }
  task.activity = `Owner changed from ${oldOwner}`;
  addLog(`${task.title} owner changed to ${owner}.`);
  render();
}

function setTaskStatus(id, status) {
  const task = getTask(id);
  if (!task) return;
  task.status = status;
  if (status === "done") {
    task.progress = 100;
    task.risk = "normal";
    task.activity = "Completed";
  } else if (status === "backlog") {
    task.progress = 0;
    task.activity = "Waiting";
  } else if (task.progress === 0) {
    task.progress = 25;
    task.activity = "Started";
  }
  addLog(`${task.title} moved to ${columns.find((column) => column.id === status).title}.`);
  render();
}

function logProgress(id) {
  const task = getTask(id);
  if (!task) return;
  task.progress = Math.min(100, task.progress + 25);
  task.status = task.progress >= 100 ? "done" : "doing";
  task.risk = task.progress >= 50 ? "normal" : task.risk;
  task.activity = task.progress >= 100 ? "Completed" : "Progress uploaded";
  addLog(`${task.owner} logged progress on ${task.title}.`);
  render();
  showToast("Progress updated.");
}

function markStuck(id) {
  const task = getTask(id);
  if (!task) return;
  task.risk = "watch";
  task.activity = "Marked stuck by team member";
  task.status = "doing";
  addLog(`${task.owner} marked ${task.title} as stuck.`);
  render();
  showToast("Marked stuck. Supervisor can see it.");
}

function approveTask(id) {
  const task = getTask(id);
  if (!task) return;
  task.approved = true;
  task.activity = "Approved by supervisor";
  addLog(`${task.title} approved by supervisor.`);
  render();
  showToast("Work approved.");
}

function leaveFeedback(id) {
  const task = getTask(id);
  if (!task) return;
  openModal(`Feedback for ${task.title}`, `
    <form class="form-grid" id="feedbackForm">
      <label>Comment<textarea name="feedback">Good work. Please add one sentence connecting this to the HCAI design justification.</textarea></label>
      <div class="button-row">
        <button class="primary-button" type="submit">Send feedback</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("feedbackForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const text = new FormData(event.currentTarget).get("feedback").trim();
    state.feedback.push({
      id: `fb-${Date.now()}`,
      owner: task.owner,
      from: "Dr. Imran",
      text,
      task: task.title
    });
    closeModal();
    addLog(`Feedback sent to ${task.owner} for ${task.title}.`);
    render();
    showToast("Feedback sent.");
  });
}

function addTask() {
  if (!isSupervisor()) {
    showToast("Only the supervisor can create and delegate tasks.");
    return;
  }
  openModal("Add task", `
    <form class="form-grid" id="addTaskForm">
      <label>Task name<input name="title" value="Prepare demo script" /></label>
      <label>Owner<select name="owner">${ownerOptions("Unassigned")}</select></label>
      <label>Workload points<input name="points" type="number" min="1" max="8" value="2" /></label>
      <label>Due date<input name="due" value="May 7" /></label>
      <div class="button-row">
        <button class="primary-button" type="submit">Add task</button>
        <button class="ghost-button" type="button" data-close-modal>Cancel</button>
      </div>
    </form>
  `);
  document.getElementById("addTaskForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.tasks.push({
      id: `task-${Date.now()}`,
      title: form.get("title").trim() || "Untitled task",
      owner: form.get("owner"),
      status: form.get("owner") === "Unassigned" ? "backlog" : "doing",
      points: Number(form.get("points")) || 1,
      progress: form.get("owner") === "Unassigned" ? 0 : 20,
      due: form.get("due").trim() || "May 7",
      risk: "normal",
      activity: "Added manually"
    });
    closeModal();
    addLog(`Task added: ${form.get("title")}.`);
    render();
    showToast("Task added.");
  });
}

function focusPlan() {
  const risk = riskTask();
  const balance = balanceScore();
  const suggested = suggestedOwners();
  state.assistantBrief = risk
    ? `Supervisor view: ask the leader to handle ${risk.title}. Team view: reassign or send one private reminder, then ask for a small upload by tonight.`
    : balance < 75
      ? `Move one small task to ${suggested.report}, then keep ${suggested.presentation} on presentation. This should improve balance without adding meetings.`
      : "The team is balanced. Keep the assistant quiet and only ask for a short progress upload before the deadline.";
  addLog("Assistant generated a practical focus plan.");
  render();
  showToast("Focus plan updated.");
}

function requestUpdate(teamId) {
  const team = state.supervisorTeams.find((item) => item.id === teamId);
  if (!team) return showSection("tasks");
  team.note = "Supervisor requested a short update.";
  team.reviewed = true;
  addLog(`Supervisor requested update from ${team.name}.`);
  render();
}

function checkIn(teamId) {
  const team = state.supervisorTeams.find((item) => item.id === teamId);
  if (team) {
    team.note = "Check-in scheduled.";
    team.reviewed = true;
    if (team.state === "risk") team.state = "watch";
    addLog(`Supervisor scheduled check-in with ${team.name}.`);
  } else {
    addLog("Supervisor scheduled check-in with Smart Assistant Team.");
  }
  render();
  showToast("Check-in scheduled.");
}

function markReviewed(teamId) {
  const team = state.supervisorTeams.find((item) => item.id === teamId);
  if (team) {
    team.reviewed = true;
    team.note = team.state === "stable" ? "Reviewed. No action needed." : "Reviewed. Monitoring continues.";
    addLog(`${team.name} marked reviewed.`);
  } else {
    addLog("Smart Assistant Team marked reviewed.");
  }
  render();
}

function linkPlatform() {
  if (state.linked) return showToast("Already linked.");
  state.linked = true;
  state.tasks.push({ id: "rubric", title: "Check Blackboard rubric", owner: "Khalid", status: "doing", points: 1, progress: 20, due: "May 6", risk: "normal", activity: "Imported from Blackboard" });
  el.linkPlatform.textContent = "Blackboard Linked";
  el.linkPlatform.disabled = true;
  addLog("Blackboard linked and rubric task imported.");
  render();
}

function resetDemo() {
  state = clone(initialState);
  localStorage.removeItem(storageKey);
  el.linkPlatform.textContent = "Link Blackboard";
  el.linkPlatform.disabled = false;
  applyTheme();
  el.appShell.hidden = true;
  el.welcomeScreen.hidden = false;
  renderProfiles();
  showToast("Demo reset.");
}

function action(name, taskId = null, teamId = null) {
  const actions = {
    accept: acceptRecommendation,
    modify: modifyRecommendation,
    reject: rejectRecommendation,
    explain: explainRecommendation,
    reference: explainRecommendation,
    reminder: sendReminder,
    reassignRisk: () => reassignRisk(),
    reassignTask: () => reassignRisk(taskId),
    ignore: ignoreRisk,
    progress: () => logProgress(taskId),
    stuck: () => markStuck(taskId),
    approve: () => approveTask(taskId),
    feedback: () => leaveFeedback(taskId),
    openTeamBoard: () => showSection("tasks"),
    requestUpdate: () => requestUpdate(teamId),
    checkIn: () => checkIn(teamId),
    reviewed: () => markReviewed(teamId)
  };
  actions[name]?.();
}

el.nav.forEach((item) => item.addEventListener("click", () => showSection(item.dataset.section)));
el.profileGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-profile-id]");
  if (card) openProfile(card.dataset.profileId);
});
el.themeToggle.addEventListener("click", toggleTheme);
el.linkPlatform.addEventListener("click", linkPlatform);
el.switchProfile.addEventListener("click", switchProfile);
document.getElementById("generateFocusPlan").addEventListener("click", focusPlan);
document.getElementById("acceptSuggestion").addEventListener("click", acceptRecommendation);
document.getElementById("modifySuggestion").addEventListener("click", modifyRecommendation);
document.getElementById("rejectSuggestion").addEventListener("click", rejectRecommendation);
document.getElementById("explainSuggestion").addEventListener("click", explainRecommendation);
document.getElementById("sendReminder").addEventListener("click", sendReminder);
document.getElementById("reassignRisk").addEventListener("click", () => reassignRisk());
document.getElementById("ignoreRisk").addEventListener("click", ignoreRisk);
document.getElementById("addTask").addEventListener("click", addTask);
document.getElementById("resetDemo").addEventListener("click", resetDemo);
el.closeModal.addEventListener("click", closeModal);
el.modalBackdrop.addEventListener("click", (event) => {
  if (event.target === el.modalBackdrop || event.target.matches("[data-close-modal]")) closeModal();
});
document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) action(actionTarget.dataset.action, actionTarget.dataset.taskId || null, actionTarget.dataset.teamId || null);
  if (event.target.matches("[data-close-modal]")) closeModal();
});
document.addEventListener("change", (event) => {
  const control = event.target.closest("[data-task-control]");
  if (!control) return;
  if (control.dataset.taskControl === "owner") setTaskOwner(control.dataset.taskId, control.value);
  if (control.dataset.taskControl === "status") setTaskStatus(control.dataset.taskId, control.value);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.modalBackdrop.hidden) closeModal();
});

if (state.linked) {
  el.linkPlatform.textContent = "Blackboard Linked";
  el.linkPlatform.disabled = true;
}
applyTheme();
renderProfiles();
if (activeProfile()) {
  el.welcomeScreen.hidden = true;
  el.appShell.hidden = false;
  el.body.dataset.role = activeProfile().kind;
  renderNavigation();
  showSection(state.section);
  render();
} else {
  el.appShell.hidden = true;
  el.welcomeScreen.hidden = false;
}
