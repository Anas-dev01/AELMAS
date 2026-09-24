# Diagram prompts

## System architecture diagram

```text
Create a clean, professional system architecture diagram for “AELMAS — Automated Employee Leave Management System” at Confluence University of Science and Technology, Osara, Kogi State. Use a left-to-right layout with clear labelled arrows. Show three web users: Staff, Head of Department (HOD), and Registrar. All use a React + Vite single-page web client. The client calls an Express.js REST API over HTTPS/JSON. The API uses bcrypt for password hashing, CORS, validation, approval workflow rules, and PDF letter generation. The API persists users and leave requests in a MySQL database. Show the Registrar signature uploaded during Registrar registration and stored in MySQL; when the Registrar gives final approval, the API links the Registrar and signature to the leave request. Show the approved Staff downloading a branded CUSTECH official approval-letter PDF containing that signature. Include the workflow: Staff submits → HOD recommends/rejects → Registrar approves/rejects → leave balance is deducted only on final approval. Use CUSTECH-inspired maroon (#672A0C), dark grey, and restrained blue/green status accents. Do not include vendor logos or fictional services.
```

## Entity relationship diagram

```text
Create a crow’s-foot entity relationship diagram for the AELMAS MySQL database. Include USERS, LEAVE_REQUESTS, and DEPARTMENTS. USERS fields: user_id PK, staff_id, full_name, email, password (bcrypt hash), role (Staff/HOD/Registrar), dept_id FK, leave_balance, registrar_signature (nullable MEDIUMTEXT data URL, only for Registrar accounts). LEAVE_REQUESTS fields: request_id PK, user_id FK to USERS, leave_type, start_date, end_date, requested_days, status_stage (0 Pending HOD, 1 Recommended, 2 Final Approved, 3 Rejected), hod_remarks, registrar_remarks, registrar_id FK nullable to USERS, created_at. DEPARTMENTS fields: dept_id PK, department_name. Relationships: one Department has many Users; one Staff User submits many Leave Requests; one Registrar User can finalise many Leave Requests, while a Leave Request has zero or one finalising Registrar until approved. Make optionality explicit: registrar_id is nullable before final approval. Explain that the signing Registrar’s stored signature is retrieved through registrar_id for the official approval letter. Use a legible, publication-ready database-diagram style.
```
