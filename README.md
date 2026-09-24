# AELMAS

Automated Employee Leave Management System (AELMAS) for **Confluence University of Science and Technology, Osara, Kogi State (CUSTECH)**. The application manages staff leave applications from submission through HOD review and Registrar final approval.

## What the system does

- Staff register, sign in, see their leave balance, submit leave applications, track decisions, and download final approval letters.
- HODs see pending applications and recommend or reject them.
- Registrars see HOD-recommended applications, give the final decision, and enter final remarks.
- Final approval deducts the requested days from the staff member’s leave balance.
- Registrar registration requires an official PNG/JPEG signature. That signature is stored with the Registrar account and placed on the CUSTECH-branded PDF issued for approvals they finalise.

## Technology

| Layer | Technology |
| --- | --- |
| Web client | React 19, Vite, React Router, Tailwind CSS, Axios |
| PDF generation | jsPDF |
| API | Node.js, Express 5, CORS, bcrypt |
| Database | MySQL via mysql2 |

## Repository layout

```text
client/                 React/Vite web client
server/                 Express API
server/index.js         API routes and startup migration
docs/database-schema.sql Database migration for approval-letter support
docs/DIAGRAM_PROMPTS.md Prompts for architecture and ER diagrams
```

## Prerequisites

- Node.js 18 or later
- MySQL 8+ (or a compatible MySQL/MariaDB installation)
- An existing database named `aelmas_db` containing the base `users` and `leave_requests` tables

## Move the project to a Windows PC

Use this checklist to move both the application files and its data. The project files alone are **not** enough: the MySQL database contains the user accounts, leave applications, and Registrar signatures.

### 1. Export the database on the current computer

Export `aelmas_db` before moving the project. This produces a single backup file that includes the tables and their data.

```bash
mysqldump -u root -p --databases aelmas_db > aelmas_db_backup.sql
```

Enter the MySQL password when prompted. With the usual local XAMPP setup, the password is blank: press Enter when prompted. Alternatively, open phpMyAdmin, select `aelmas_db`, choose **Export** → **Quick** → **SQL**, then save the downloaded file as `aelmas_db_backup.sql`.

Keep this SQL backup private. It contains account data and registrar signatures.

### 2. Copy the project and backup file

Copy the project folder and `aelmas_db_backup.sql` to the Windows computer using a USB drive, cloud storage, or Git. Do not copy `client/node_modules` or `server/node_modules`; Windows will install its own compatible dependencies from each `package-lock.json` file.

If creating a ZIP file, exclude the two `node_modules` folders. Keep `client`, `server`, `docs`, `signature.jpeg`, and the root `README.md`.

### 3. Install the Windows prerequisites

1. Install Node.js 18 or later (the current LTS release is a good choice).
2. Install XAMPP, then open the XAMPP Control Panel and start **MySQL**. Apache is optional for this development setup.
3. Open PowerShell in the copied project folder.
4. Install the project dependencies:

```powershell
cd server
npm ci
cd ..\client
npm ci
```

`npm ci` uses the locked dependency versions supplied with this project. If it reports that the lock file is incompatible, use `npm install` in the affected folder instead.

### 4. Restore the database on Windows

With MySQL running, use either of the following methods.

**phpMyAdmin method (recommended)**

1. Visit `http://localhost/phpmyadmin`.
2. Select the **Import** tab.
3. Choose `aelmas_db_backup.sql` and click **Import**.
4. Confirm that `aelmas_db` appears in the left sidebar and contains `users` and `leave_requests`.

**PowerShell method**

Run this from the folder that contains the backup (change the path if XAMPP was installed elsewhere):

```powershell
Get-Content .\aelmas_db_backup.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root -p
```

Press Enter at the password prompt if the local XAMPP `root` account has no password. The backup was exported with `--databases`, so it creates and selects `aelmas_db` during import.

> This repository includes only the two later approval-letter migrations, not a clean-database definition of the original `users` and `leave_requests` tables. For a complete working copy, restore the backup from the current computer instead of creating an empty `aelmas_db` database.

### 5. Verify the database connection and start the app

The development credentials are in `server/index.js`:

```js
host: 'localhost',
user: 'root',
password: '',
database: 'aelmas_db'
```

If your Windows MySQL account has a password or uses a different host/user/database, update these values before starting the API. Then open two PowerShell windows in the project folder:

```powershell
cd server
node index.js
```

```powershell
cd client
npm run dev
```

The API should report `Connected to AELMAS MySQL Database.` Open the Vite address shown by the client (normally `http://localhost:5173`), register or sign in, and submit a test request to confirm both the client and database work.

## Database configuration

The current development connection is configured in `server/index.js` for local XAMPP defaults: host `localhost`, user `root`, blank password, database `aelmas_db`. Change these values before using another environment. Never commit production passwords.

On startup, the API adds the two columns needed by the official letter: `users.registrar_signature` and `leave_requests.registrar_id`. If the database user cannot alter tables, run [docs/database-schema.sql](docs/database-schema.sql) once as a database administrator.

## Run locally

Install dependencies in both `server` and `client` with `npm ci`, then use two terminals:

```bash
cd server
node index.js
```

```bash
cd client
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`). The client expects the API at `http://localhost:5000`.

## User workflow

1. Register as Staff, HOD, or Registrar. A Registrar must upload a clear PNG or JPEG signature up to 1.5 MB.
2. Staff submit a leave request. New requests start at status `0` (Pending HOD).
3. HOD recommends (status `1`) or rejects (status `3`) the request.
4. Registrar finally approves (status `2`) or rejects (status `3`) it. Approval saves the Registrar ID and deducts the leave days.
5. The Staff portal enables **PDF Letter** only for a final approval. The generated letter includes the CUSTECH letterhead, application/leave/resumption dates, official wording, and the signing Registrar’s signature.

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/register` | Create a user; Registrar registration accepts `signature_data` |
| POST | `/api/login` | Authenticate and return user details |
| POST | `/api/leave-request` | Submit a staff leave application |
| GET | `/api/my-requests/:userId` | Get a staff member’s requests and linked Registrar signature |
| GET | `/api/leave-requests/pending` | Get HOD review queue |
| POST | `/api/leave-requests/approve-hod` | Recommend an application |
| GET | `/api/leave-requests/recommended` | Get Registrar final-approval queue |
| GET | `/api/leave-requests/report` | Get the complete leave register for HOD/Registrar analytics and PDF reports |
| POST | `/api/leave-requests/approve-final` | Finalise approval and deduct balance |
| POST | `/api/leave-requests/reject` | Reject as HOD or Registrar |

## Official approval letter

The downloadable PDF bears this letterhead:

```text
CONFLUENCE UNIVERSITY OF SCIENCE AND TECHNOLOGY, OSARA, KOGI STATE
OFFICIAL LEAVE MANAGEMENT SYSTEM
OFFICIAL APPROVAL LETTER
```

The document formally acknowledges the application, lists leave commencement/end and resumption dates, requests a proper handover of responsibilities, and carries the `REGISTRAR` signature block.

## Diagrams

Copy the ready-to-use architecture and entity-relationship diagram prompts from [docs/DIAGRAM_PROMPTS.md](docs/DIAGRAM_PROMPTS.md) into your preferred diagram-generation tool.

## Important production notes

- This project currently uses direct database credentials in code and has no token/session protection on API routes. Use environment variables, authentication middleware, role verification, HTTPS, and server-side authorisation before deployment.
- Restrict Registrar account creation in production; an open Registrar signup route is only appropriate for a demo.
- Store signatures in protected object storage rather than a database data URL for a large-scale deployment, and retain an audit trail for approvals.
