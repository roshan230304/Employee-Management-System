# StaffSync Employee Management System

Existing React/Vite frontend and Express API connected to the existing MySQL
database `react_db`. The app reuses the database's existing `employees`, `tasks`,
and `attendance` tables; it does not recreate or reseed them.

## Inspected schema

- `employees`: primary key `id`; `name`, `email`, `phone`, `department`, `salary`
- `tasks`: primary key `id`; `employee_id` references `employees.id`; includes task
  title, description, enum status/priority, assigned/due dates, completion timestamp
- `attendance`: primary key `id`; `employee_id` references `employees.id`; includes
  date, enum status, `check_in`, and the legacy nullable `check_out` column
- The existing attendance unique index covers `(employee_id, attendance_date)`.
- Existing task/attendance foreign keys cascade when an employee is deleted. The
  new account foreign key also cascades, so employee deletion removes that login.

The new employee attendance flow only records UTC entry time. It never asks for,
returns, or writes a check-out value; the existing `check_out` column and its
historical values are left untouched.

## One-time additive migration

Apply [`backend/migrations/001_user_accounts.sql`](./backend/migrations/001_user_accounts.sql)
once to `react_db` in MySQL Workbench. This creates only the additional
`user_accounts` table for hashed-password login, role, and employee linkage.
It does not alter existing tables or employee/task/attendance records. The backend
checks for this table and the existing attendance uniqueness/foreign keys at startup.

## Configure and start

Requirements: Node.js and the MySQL server already hosting `react_db`.

1. From the project root, install frontend dependencies:

   ```powershell
   npm install
   ```

2. Configure backend settings. Preserve the existing `backend\.env` if present;
   otherwise copy `backend\.env.example` to `backend\.env`. Enter your real
   MySQL password as the value of `DB_PASSWORD` in `backend\.env` (not in the
   React frontend or this README). Ensure `DB_NAME=react_db` and set a random
   `JWT_SECRET` of at least 32 characters.
   You can generate a secret with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Add `ADMIN_USERNAME` and your own unique `ADMIN_PASSWORD` to
   `backend\.env` for the one-time initial administrator setup. The password
   must be at least 12 characters and no more than 72 UTF-8 bytes. The example
   file contains placeholders only. Do not commit `backend\.env`.

3. Install backend dependencies and create the initial admin account:

   ```powershell
   cd backend
   npm install
   npm run bootstrap-admin
   ```

   The setup command bcrypt-hashes the password and refuses to overwrite an
   existing account. After it succeeds, remove `ADMIN_PASSWORD` from
   `backend\.env`. Keep the credentials you chose in your password manager. No
   public registration endpoint exists.

4. Start the API from `backend`:

   ```powershell
   npm start
   ```

   The API verifies the database connection, schema, and `JWT_SECRET` before it
   listens on the configured `PORT` (this workspace uses
   `http://localhost:5001` because another process already occupies port 5000).

5. In a second terminal, from the project root:

   ```powershell
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The root `.env.local`
   points the frontend to `http://localhost:5001/api`; update `VITE_API_URL`
   there if the backend port changes, and set `CLIENT_URL` to the exact frontend
   origin if it differs. Restart Vite after changing frontend environment values.
   The frontend does not receive MySQL or JWT secrets.

## Role and data access

- Admin login is configured through the one-time bootstrap script. Admins can
  manage employee records and login credentials, tasks, attendance history, and
  dashboard totals.
- Creating an employee creates a linked login with the provided initial password.
  Existing employee rows have no login until an admin uses **Set Password**.
- Employees sign in with their email and admin-provided password. They can access
  only their own profile/dashboard, assigned tasks, and attendance history.
- Employee attendance uses MySQL `UTC_DATE()` and `UTC_TIME()` on the server, and
  the unique database index rejects a second mark on the same UTC day.
- Employee task status can progress to **In Progress** or **Completed**; employees
  cannot reassign or delete tasks, and completed tasks cannot be reopened.
- JWTs are sent in HTTP-only, SameSite cookies (8-hour expiry), not localStorage.
  Production deployments must use HTTPS so the cookie is Secure.
- Employee deletion preserves the database's existing cascade behavior and also
  deletes the employee's login account.

## API

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | Public, rate limited |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/auth/me` | Authenticated |
| GET/POST | `/api/employees` | Admin |
| GET/PUT/DELETE | `/api/employees/:id` | Admin |
| POST | `/api/employees/:id/reset-password` | Admin |
| GET/POST | `/api/tasks` | Admin |
| GET/PUT/DELETE | `/api/tasks/:id` | Admin |
| GET | `/api/tasks/my?status=Pending` | Employee; own tasks |
| PATCH | `/api/tasks/:id/status` | Employee; own task only |
| GET | `/api/attendance` | Admin |
| GET | `/api/attendance/today` | Admin |
| GET | `/api/attendance/my` | Employee; own history |
| POST | `/api/attendance/mark` | Employee; server-generated UTC entry |
| GET | `/api/dashboard/admin` | Admin |
| GET | `/api/dashboard/employee` | Employee; own data |

All modifying and data-reading routes require backend role authorization except
login and the health check. SQL values are parameterized; role and employee
ownership are derived from the verified account, not client-submitted IDs.

## Validation and troubleshooting

```powershell
npm run build
```

- `ECONNREFUSED`: Start MySQL and verify `DB_HOST`/`DB_PORT` in `backend\.env`.
- `ER_ACCESS_DENIED_ERROR`: Correct the MySQL credentials in the backend-only
  environment file.
- Unknown database/table or startup schema error: Verify the pre-existing
  `react_db` schema and apply the additive account migration once. No existing
  business tables are created automatically.
- `JWT_SECRET` startup error: Set a unique secret of at least 32 characters.
- `EADDRINUSE`: Another process already owns the configured port. Inspect it
  before stopping anything:

  ```powershell
  Get-NetTCPConnection -LocalPort 5001 -State Listen
  Get-Process -Id <PID>
  ```

  Stop only a process you have identified as an old StaffSync server with
  `Stop-Process -Id <PID>`. This workspace currently uses port 5001 because a
  Python `app.main` process was observed on port 5000; it was left untouched.
- Login returns 401: Check the username/password and run `npm run bootstrap-admin`
  only if no initial admin account exists. For older employees, set a password
  from the admin employee page.
- CORS/browser cookie issue: Use the configured `CLIENT_URL`, keep the frontend
  at `http://localhost:3000`, and use HTTPS in production.
