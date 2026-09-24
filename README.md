# AELMAS

Automated Employee Leave Management System (AELMAS) is a web application for the **Confluence University of Science and Technology, Osara, Kogi State (CUSTECH)**. It supports a staff leave application from submission through HOD recommendation to the Registrar's final decision.

## Features

- Role-specific registration and sign-in for Staff, HOD, and Registrar accounts.
- Staff leave-balance display, application submission, status tracking, and approved-letter download.
- HOD queue for recommending or rejecting pending requests.
- Registrar queue for final approval or rejection, including remarks.
- Automatic leave-balance deduction after final approval.
- CUSTECH-branded PDF approval letters with the approving Registrar's uploaded PNG/JPEG signature.
- Management leave register for dashboard analytics and PDF reports.

## Technology

| Layer | Technology |
| --- | --- |
| Client | React 19, Vite, React Router, Tailwind CSS, Axios |
| PDF | jsPDF |
| API | Node.js, Express, CORS, bcrypt |
| Database | MySQL/MariaDB via mysql2 |

## Repository layout

```text
client/                     React/Vite client
server/                     Express API
server/index.js             API routes and database startup migration
aelmas_db.sql               Development database schema and sample data
docs/database-schema.sql    Migration for existing databases
docs/DIAGRAM_PROMPTS.md     Architecture and ER-diagram prompts
```

`aelmas_db_backup.sql` is currently an identical copy of `aelmas_db.sql`. Keep either database dump private: it contains sample account records and a Registrar signature image.

## Prerequisites

- A current Node.js LTS release (Node 22 was used to verify this project)
- MySQL 8+ or MariaDB 10.4+
- npm (included with Node.js)

## Run locally

### 1. Create and import the database

The included dump creates the application tables and includes development sample data. Create the database first, then import the dump:

```bash
mysql -u root -p -e "CREATE DATABASE aelmas_db"
mysql -u root -p aelmas_db < aelmas_db.sql
```

If `aelmas_db` already exists and you want a fresh development copy, drop it yourself only after confirming that its data is disposable, then repeat the commands above. In phpMyAdmin, create/select `aelmas_db`, choose **Import**, and select `aelmas_db.sql`.

For an existing AELMAS database, do not re-import the full dump. The API adds `users.registrar_signature` and `leave_requests.registrar_id` at startup. If its database account cannot alter tables, run [docs/database-schema.sql](docs/database-schema.sql) once as a database administrator.

### 2. Configure the database connection

The development connection is currently hard-coded in [server/index.js](server/index.js):

```js
host: 'localhost',
user: 'root',
password: '',
database: 'aelmas_db'
```

Update these values for your local MySQL/MariaDB account before starting the API. Do not commit real passwords.

### 3. Install dependencies

Run the following from the repository root:

```bash
npm --prefix server ci
npm --prefix client ci
```

### 4. Start the application

Use two terminals:

```bash
node server/index.js
```

```bash
npm --prefix client run dev
```

The API runs at `http://localhost:5000`. Open the Vite URL printed by the client—normally `http://localhost:5173`—in a browser.

## User workflow

1. Register as Staff, HOD, or Registrar. Registrar registration requires a PNG/JPEG signature image no larger than 1.5 MB.
2. A Staff user submits a leave request, which starts as **Pending HOD**.
3. The HOD recommends it to the Registrar or rejects it with remarks.
4. The Registrar grants final approval or rejects it with remarks. Final approval deducts the requested days from the staff member’s leave balance.
5. For approved requests, the Staff portal provides a downloadable official PDF letter bearing the approving Registrar’s signature.

| `status_stage` | Meaning |
| --- | --- |
| `0` | Pending HOD |
| `1` | Recommended by HOD / awaiting Registrar |
| `2` | Finally approved |
| `3` | Rejected |

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/register` | Create a user; Registrars must provide `signature_data` |
| POST | `/api/login` | Authenticate and return user details |
| POST | `/api/leave-request` | Submit a staff leave application |
| GET | `/api/my-requests/:userId` | Get a staff member’s requests and approval-signature data |
| GET | `/api/leave-requests/pending` | Get the HOD review queue |
| POST | `/api/leave-requests/approve-hod` | Recommend an application |
| POST | `/api/leave-requests/reject` | Reject an application as HOD or Registrar |
| GET | `/api/leave-requests/recommended` | Get the Registrar approval queue |
| POST | `/api/leave-requests/approve-final` | Finalise approval and deduct leave balance |
| GET | `/api/leave-requests/report` | Get the leave register for reports/analytics |
| GET | `/api/user-data/:userId` | Get a user’s current leave balance |

## Move to another computer

Copy the repository and **one** database dump (`aelmas_db.sql` or a freshly exported backup). Do not copy either `node_modules` directory; run the dependency-install commands above on the destination computer. Install Node.js and MySQL/MariaDB there, import the database, update `server/index.js` if its MySQL credentials differ, and start the two services.

To preserve live data rather than the bundled sample data, export it from the source computer first:

```bash
mysqldump -u root -p --databases aelmas_db > aelmas_db_backup.sql
```

On Windows with XAMPP, you can import the backup through phpMyAdmin or run:

```powershell
Get-Content .\aelmas_db_backup.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root -p
```

## Quality checks

After installing client dependencies, run:

```bash
npm --prefix client run lint
npm --prefix client run build
```

The server package does not currently include automated tests.

## Diagrams

Use the ready-to-copy prompts in [docs/DIAGRAM_PROMPTS.md](docs/DIAGRAM_PROMPTS.md) with your preferred diagram-generation tool.

## Production considerations

This repository is suitable for local development or demonstration. Before deployment, implement environment-based secrets, authentication/session handling, role-based server-side authorisation, input validation, HTTPS, transactional approval/balance updates, audit logging, and protected signature storage. Registrar self-registration should also be restricted in production.
