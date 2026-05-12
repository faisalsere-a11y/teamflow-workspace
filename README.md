# TeamFlow Workspace

A static role-based project management prototype for CS1352 group work. It gives supervisors a high-level command center for task assignment, approvals, workload balance, and feedback, while team members only see the work and notes that belong to them.

## Open Locally

Open `index.html` in a browser. The app stores demo state in `localStorage`, so changes persist on the same device.

## Publish With GitHub Pages

1. Push this repository to GitHub.
2. In the GitHub repo, open `Settings` > `Pages`.
3. Set the source to `Deploy from a branch`.
4. Choose the `main` branch and `/ (root)` folder.
5. Save, then open the Pages URL GitHub gives you.

## What Is Included

- Profile-based welcome screen with supervisor and team-member access.
- Supervisor board for team overview, workload, assignments, approvals, and feedback.
- Team-member board for personal tasks, status updates, blockers, feedback, and milestones.
- Deep-black dark mode and light mode.
- Static deployment support for GitHub Pages with no backend required.

## Notes

This is a front-end prototype. It uses browser storage instead of a database, so it is suitable for demos and coursework presentation. A production version should add authentication, a backend, and real role permissions.
