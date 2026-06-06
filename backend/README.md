# School ERP — Backend API

A REST API for a School ERP system built with Node.js, Express, Prisma, and PostgreSQL (NeonDB).

---

## Tech Stack

- **Node.js + Express** — REST API
- **Prisma ORM** — database access
- **NeonDB** — serverless PostgreSQL
- **JWT** — authentication
- **Multer** — file uploads
- **bcrypt** — password hashing

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@host/school_erp?sslmode=require"
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secret_key_at_least_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

### 3. Push schema & generate client

```bash
npx prisma db push
npx prisma generate
```

### 4. Seed the database

```bash
npm run seed
```

### 5. Start the server

```bash
npm run dev      # Development (auto-reload)
npm start        # Production
```

Server runs at → **http://localhost:5000**

---

## Login Credentials

| Role    | Email                   | Password     |
|---------|-------------------------|--------------|
| Admin   | admin@schoolerp.com     | Admin@123    |
| Teacher | rajesh@schoolerp.com    | Teacher@123  |
| Student | aarav@school.com        | Student@123  |

---

## API Endpoints

### Auth
| Method | Endpoint                    | Description       |
|--------|-----------------------------|-------------------|
| POST   | `/api/auth/login`           | Login             |
| GET    | `/api/auth/me`              | Get current user  |
| POST   | `/api/auth/logout`          | Logout            |
| PUT    | `/api/auth/change-password` | Change password   |

### Dashboard
| Method | Endpoint                          | Description         |
|--------|-----------------------------------|---------------------|
| GET    | `/api/dashboard/stats`            | Analytics & stats   |
| GET    | `/api/dashboard/announcements`    | Get announcements   |
| POST   | `/api/dashboard/announcements`    | Create announcement |
| DELETE | `/api/dashboard/announcements/:id`| Delete announcement |

### Students
| Method | Endpoint                      | Description          |
|--------|-------------------------------|----------------------|
| GET    | `/api/students`               | List (search, filter, paginate) |
| GET    | `/api/students/:id`           | Get one              |
| POST   | `/api/students`               | Create               |
| PUT    | `/api/students/:id`           | Update               |
| DELETE | `/api/students/:id`           | Delete               |
| GET    | `/api/students/:id/attendance`| Student attendance   |
| GET    | `/api/students/:id/grades`    | Student grades       |

### Teachers
| Method | Endpoint                    | Description     |
|--------|-----------------------------|-----------------|
| GET    | `/api/teachers`             | List            |
| GET    | `/api/teachers/:id`         | Get one         |
| POST   | `/api/teachers`             | Create          |
| PUT    | `/api/teachers/:id`         | Update          |
| DELETE | `/api/teachers/:id`         | Delete          |
| POST   | `/api/teachers/:id/subjects`| Assign subjects |

### Classes
| Method | Endpoint                   | Description     |
|--------|----------------------------|-----------------|
| GET    | `/api/classes`             | List            |
| GET    | `/api/classes/:id`         | Get one         |
| POST   | `/api/classes`             | Create          |
| PUT    | `/api/classes/:id`         | Update          |
| DELETE | `/api/classes/:id`         | Delete          |
| POST   | `/api/classes/:id/subjects`| Assign subjects |

### Subjects
| Method | Endpoint             | Description |
|--------|----------------------|-------------|
| GET    | `/api/subjects`      | List        |
| POST   | `/api/subjects`      | Create      |
| PUT    | `/api/subjects/:id`  | Update      |
| DELETE | `/api/subjects/:id`  | Delete      |

### Attendance
| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| GET    | `/api/attendance`         | List (filter by class/date/status) |
| POST   | `/api/attendance`         | Mark bulk attendance  |
| PUT    | `/api/attendance/:id`     | Update one record     |
| GET    | `/api/attendance/summary` | Monthly summary       |

### Grades
| Method | Endpoint             | Description    |
|--------|----------------------|----------------|
| GET    | `/api/grades`        | List           |
| GET    | `/api/grades/report` | Report by student |
| POST   | `/api/grades`        | Record grade   |
| PUT    | `/api/grades/:id`    | Update grade   |
| DELETE | `/api/grades/:id`    | Delete grade   |

### Files
| Method | Endpoint                  | Description   |
|--------|---------------------------|---------------|
| GET    | `/api/files`              | List files    |
| POST   | `/api/files/upload`       | Upload file   |
| GET    | `/api/files/:id/download` | Download file |
| DELETE | `/api/files/:id`          | Delete file   |

---

## Query Parameters

All list endpoints support:

```
?search=term&page=1&limit=10
```

Examples:
```
GET /api/students?search=aarav&page=1&limit=10&gender=MALE&classId=xxx
GET /api/attendance?classId=xxx&date=2024-10-15&status=PRESENT
GET /api/grades?studentId=xxx&subjectId=xxx&examType=MIDTERM
```

---

## Authentication

Include the token in every protected request:

```
Authorization: Bearer <your_jwt_token>
```

---

## Scripts

```bash
npm run dev          # Start dev server with nodemon
npm start            # Start production server
npm run seed         # Seed database with sample data
npx prisma studio    # Open Prisma database GUI
npx prisma db push   # Push schema changes to DB
npx prisma generate  # Regenerate Prisma client
```
