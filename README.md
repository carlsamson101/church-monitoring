# Command Center Christian Church Monitoring and Management System

<img width="1919" height="988" alt="image" src="https://github.com/user-attachments/assets/8d52707e-0045-44fb-a93a-83c6eb7973f7" />

# ⛪ Church Discipleship & Cell Group Monitoring System

A responsive web application that helps a church monitor leaders, cell groups, disciples, invitees, attendance, discipleship activities, training, encounters, and events, all in one secure place.

Built with **React + Vite + TypeScript + Tailwind CSS** on the frontend and **Supabase** (Auth, PostgreSQL, Row Level Security) on the backend.

> **Status:** 🚧 In development, built in phases (see [Roadmap](#-roadmap)).

---

## 📑 Table of Contents

- [Features](#-features)
- [User Roles & Permissions](#-user-roles--permissions)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Overview](#-database-overview)
- [Security](#-security)
- [Getting Started](#-getting-started)
- [Creating the First Developer Account](#-creating-the-first-developer-account)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

**People & Groups**
- Manage leaders, cell groups, disciples, and new invitees
- Assign disciples to leaders and transfer them between groups
- One-click **Convert Invitee → Disciple** (information is preserved, no retyping)

**Attendance & Events**
- Fully customizable events and event types (nothing hard-coded)
- Sunday Service, Weekly Fellowship, Training, Encounter, Outreach, Conference, Bible Study, and more
- Leaders record attendance only for their own disciples
- Event attendance automatically appears in each disciple's profile

**Discipleship Monitoring**
- Custom checklist categories and items (e.g., One-on-One Discipleship, Read Bible, Baptized)
- Daily/weekly/monthly frequency, with automatic completion percentages
- Disciple profile with full timeline and notes

**Dashboards & Reports**
- Pastor dashboard: totals, attendance stats, and charts (Recharts)
- Leader dashboard: "This Week" snapshot for their own group only
- Reports for attendance, cell groups, leaders, disciples, invitees, events, discipleship, and checklist completion
- Filters by date, leader, cell group, event, and status
- Export to CSV/Excel

**Security & Administration**
- Database-enforced access control with Supabase Row Level Security
- Audit logs for key actions
- Developer-only settings area

**Responsive UI**
- Desktop sidebar navigation, mobile bottom navigation/menu
- Tables on desktop, cards on mobile
- Modals, confirmation dialogs, toast notifications, loading/empty/error states

---

## 👥 User Roles & Permissions

There are exactly three primary roles.

| Capability | Developer | Pastor | Leader |
|---|:---:|:---:|:---:|
| Manage all users / change roles | ✅ | ❌ | ❌ |
| Create Pastor & Leader accounts | ✅ | ❌ | ❌ |
| Access developer settings | ✅ | ❌ | ❌ |
| View audit logs | ✅ (all) | ✅ (operational, optional) | ❌ |
| View all cell groups, leaders, disciples, invitees | ✅ | ✅ | ❌ (own group only) |
| Add / edit disciples & invitees | ✅ | ✅ | ✅ (own group only) |
| Assign / transfer disciples | ✅ | ✅ | ❌ |
| Create events & event types | ✅ | ✅ | ❌ |
| Create checklist categories & items | ✅ | ✅ | ❌ |
| Record attendance & complete checklists | ✅ | ✅ | ✅ (own disciples only) |
| View reports | ✅ | ✅ (all) | ✅ (own group only) |
| Export data | ✅ | ✅ | Own group only |

**Important rules**
- The **Developer** role can never be assigned through public registration.
- Public sign-ups are created as a **pending Leader** that requires approval.
- Users can never change their own role.
- Pastors cannot create or modify Developer accounts.
- The role is always read from the secured database profile, never trusted from the frontend.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router |
| Icons | Lucide React |
| Charts | Recharts |
| Backend | Supabase (Auth, PostgreSQL, RLS, Storage, DB functions) |
| Deployment | Vercel or Netlify |

> Excel/CSV is used **only for exporting reports**, never as the primary database.

---

## 🗂 Project Structure

```
src/
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── disciples/
│   ├── leaders/
│   ├── cell-groups/
│   ├── events/
│   ├── attendance/
│   ├── checklists/
│   ├── invitees/
│   ├── reports/
│   ├── admin/
│   └── developer/
├── layouts/
├── lib/
│   └── supabase.ts
├── hooks/
├── services/
│   ├── auth.ts
│   ├── profiles.ts
│   ├── leaders.ts
│   ├── cellGroups.ts
│   ├── disciples.ts
│   ├── invitees.ts
│   ├── events.ts
│   ├── attendance.ts
│   ├── checklists.ts
│   └── reports.ts
└── types/
```

All database queries live in `services/`, not scattered across components.

---

## 🗄 Database Overview

PostgreSQL (via Supabase) with UUID primary keys, foreign keys, indexes, and `created_at` / `updated_at` timestamps.

| Table | Purpose |
|---|---|
| `profiles` | User profile and role (`developer`, `pastor`, `leader`) |
| `cell_groups` | Cell groups and their assigned leader |
| `disciples` | Disciples (`invitee`, `new_disciple`, `active`, `inactive`, `transferred`, `completed`) |
| `invitees` | New invitees (`new`, `contacted`, `attended`, `joined`, `converted`, `no_response`) |
| `events` | Customizable events with dynamic event types |
| `attendance` | Per-disciple attendance (`present`, `absent`, `late`, `excused`) |
| `checklist_categories` | Admin-defined checklist groupings |
| `checklist_items` | Admin-defined monitoring items |
| `checklist_records` | Dated completion records per disciple |
| `audit_logs` | Activity trail for key actions |

---

## 🔐 Security

Security is enforced **in the database**, not only in the React UI.

- **Row Level Security (RLS)** is enabled on every table.
- Secure helper functions are used in policies:
  `get_current_user_role()`, `is_developer()`, `is_pastor()`, `is_leader()`, `get_current_leader_id()`, `get_current_cell_group_id()`
- A Leader can only access their own cell group, disciples, and attendance, even if they edit IDs in the browser or send direct API requests.
- Role changes are blocked for self-updates.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used in the frontend.
- **Never** expose or commit the Supabase `service_role` key.
- `.env` is excluded from Git via `.gitignore`.

---

## 🌐 Deployment

### Vercel

1. Push the project to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Vite**.
4. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy.

### Netlify

1. Push the project to GitHub.
2. Import the repo in Netlify.
3. Build command: `npm run build` · Publish directory: `dist`.
4. Add the same environment variables.
5. Add a `public/_redirects` file with `/* /index.html 200` so React Router works on refresh.

### After deploying

Add your production URL (for example `https://church-monitoring.vercel.app`) in Supabase:

**Authentication → URL Configuration**
- Set **Site URL** to your production URL
- Add it to **Redirect URLs**

---

## 📄 License

Add your preferred license here (for example, MIT). If this project is private to your church, you may mark it as **All Rights Reserved**.

---

## 🙏 Acknowledgments

Built to support churches in making disciples and caring well for every member of the flock.
