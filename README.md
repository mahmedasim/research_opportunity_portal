# University Research Opportunity Portal

A full-stack web application designed for university academic departments, allowing faculty to publish, manage, update, close, and delete research opportunities. Built with a Python Flask REST API, MySQL relational database, and an intuitive, responsive frontend using Bootstrap 5.3 and vanilla JavaScript.

---

## GitHub Repository (placeholder)
**Repository URL**: `https://github.com/YOUR_USERNAME/research-opportunity-portal` *(Replace with your repository link)*

---

## Features

### Backend (REST API)
- **RESTful Endpoints**: Full CRUD endpoints (`POST`, `GET`, `PUT`, `DELETE`) for opportunity records under `/api/opportunities`.
- **Server-Side Validation**: Thorough input validation checking field lengths, positive integer constraints (`available_positions >= 1`), calendar date formats (`YYYY-MM-DD`), and status states (`Open` / `Closed`).
- **SQL Injection Prevention**: 100% parameterized SQL queries (`%s`) and fixed column whitelists for updates.
- **Unified Error Handling**: Structured JSON responses for HTTP `400` (Validation failed), `404` (Resource/Opportunity not found), `405` (Method not allowed), and `500` (Internal server error) without leaking server stack traces.
- **CORS Support**: Cross-Origin Resource Sharing enabled for frontend development.
- **System Health Endpoint**: Lightweight endpoint at `GET /api/health` for uptime checks.

### Frontend (SPA)
- **Responsive Layout**: Clean Bootstrap 5.3 design that adapts seamlessly from mobile screens (1 column) to desktops (2-3 columns).
- **Opportunity Cards**: Visual cards displaying research topic, faculty mentor, department, deadline, positions, and live status badges (`Open` in green, `Closed` in secondary grey).
- **Detailed Modal View**: Inspection modal displaying the full project description, required skills, and timestamp audit info.
- **Reusable Form Modal**: Single form modal supporting both opportunity creation and editing with automatic input pre-filling.
- **Client-Side Validation**: Immediate, interactive feedback with red border highlights and error messages beneath invalid inputs before network submission.
- **Action Confirmation Dialogs**: Double-check confirmation popups prior to closing or permanently deleting opportunities.
- **Dismissible Alerts**: Auto-dismissing success banners (4 seconds) and persistent error alerts.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend API** | Python 3.10+, Flask 3.1, Flask-CORS |
| **Database Driver** | MySQL Connector for Python (`mysql-connector-python`) |
| **Environment Config**| `python-dotenv` |
| **Database** | MySQL 8.0 (InnoDB, `utf8mb4`) |
| **Frontend** | HTML5, Bootstrap 5.3 (CDN), CSS3, Vanilla JavaScript (ES6+ `async/await`, `fetch`) |
| **Testing** | Postman Collection v2.1 |
| **Version Control** | Git |

---

## Project Structure

```text
research_opportunity_portal/
├── .gitignore                                           # Git ignored directories (.env, venv, cache)
├── README.md                                            # Comprehensive project documentation
├── backend/
│   ├── .env.example                                     # Environment variable template
│   ├── app.py                                           # Flask application entrypoint & API routes
│   ├── db.py                                            # MySQL database connection helper
│   ├── requirements.txt                                 # Python dependencies
│   └── validators.py                                    # Input validation and sanitization logic
├── database/
│   └── schema.sql                                       # MySQL 8 database schema & table definitions
├── docs/
│   ├── AGENT_RULES.md                                   # Operational rules and security boundaries
│   └── API_SPEC.md                                      # Authoritative REST API specification
├── frontend/
│   ├── css/
│   │   └── style.css                                    # Custom CSS overrides and animations
│   ├── index.html                                       # Single-page interface layout
│   └── js/
│       ├── api.js                                       # Fetch-based API client methods
│       ├── app.js                                       # DOM manipulation, forms, and event handling
│       └── config.js                                    # API base URL configuration
└── postman/
    └── Research_Opportunity_Portal.postman_collection.json # Automated API test collection
```

---

## Prerequisites

Before running the application on an Ubuntu Linux system, ensure the following are installed:

- **Ubuntu Linux** (20.04 LTS or 22.04+ LTS)
- **Python 3.10+** & `venv`:
  ```bash
  sudo apt update
  sudo apt install python3 python3-venv python3-pip -y
  ```
- **MySQL Server 8.0**:
  ```bash
  sudo apt install mysql-server -y
  ```
- **Git**:
  ```bash
  sudo apt install git -y
  ```
- **Postman** (optional, for running the test collection)

---

## Step-by-Step Setup from a Fresh Clone

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/research-opportunity-portal.git
cd research_opportunity_portal
```

---

### 2. Database Setup

1. **Start MySQL Service**:
   ```bash
   sudo systemctl start mysql
   sudo systemctl status mysql
   ```

2. **Create the Database User & Grant Privileges**:
   Open the MySQL shell:
   ```bash
   sudo mysql
   ```
   Execute the following SQL commands (replace `'your_password'` with your desired secure password):
   ```sql
   CREATE USER IF NOT EXISTS 'portal_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON research_portal.* TO 'portal_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Import Database Schema**:
   Run the schema script to create the `research_portal` database and `research_opportunities` table:
   ```bash
   mysql -u portal_user -p < database/schema.sql
   ```
   *(Enter your password when prompted).*

4. **Verify Table Creation**:
   ```bash
   mysql -u portal_user -p -e "SHOW TABLES FROM research_portal;"
   ```
   *Expected output: `research_opportunities`.*

---

### 3. Backend Setup

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create & Activate Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Update `.env` with your MySQL user credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=portal_user
   DB_PASSWORD=your_password
   DB_NAME=research_portal
   FLASK_PORT=5000
   ```
   *(Save and exit nano with `Ctrl + O`, `Enter`, then `Ctrl + X`).*

5. **Start the Flask Backend API**:
   ```bash
   python app.py
   ```
   *The server starts listening on `http://127.0.0.1:5000`.*

---

### 4. Frontend Setup

In a **new terminal tab or window**:

1. **Navigate to the Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Verify API Base URL**:
   Ensure [`frontend/js/config.js`](file:///home/mahmedasim/University/CN/assingments/research_opportunity_portal/frontend/js/config.js) matches the backend URL:
   ```javascript
   const API_BASE_URL = "http://127.0.0.1:5000/api";
   ```

3. **Start the Development Web Server**:
   ```bash
   python3 -m http.server 5500
   ```

4. **Open in Web Browser**:
   Open your browser and visit:
   ```text
   http://localhost:5500
   ```

---

## Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DB_HOST` | Hostname of the MySQL database server | `localhost` |
| `DB_PORT` | Port number of the MySQL server | `3306` |
| `DB_USER` | MySQL user with privileges on `research_portal` | `portal_user` |
| `DB_PASSWORD` | Password for the MySQL user | *(configured during database setup)* |
| `DB_NAME` | Relational database schema name | `research_portal` |
| `FLASK_PORT` | Local network port for the Flask server | `5000` |

---

## API Documentation

Base Path: `http://127.0.0.1:5000/api`

### Endpoints Table

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Service health check | `200` |
| **POST** | `/api/opportunities` | Create a new research opportunity | `201`, `400`, `500` |
| **GET** | `/api/opportunities` | Retrieve all opportunities (newest first) | `200`, `500` |
| **GET** | `/api/opportunities/<id>` | Retrieve a single opportunity by ID | `200`, `404`, `500` |
| **PUT** | `/api/opportunities/<id>` | Update specific fields or status | `200`, `400`, `404`, `500` |
| **DELETE**| `/api/opportunities/<id>` | Delete an opportunity by ID | `200`, `404`, `500` |

---

### Example Request Body (POST /api/opportunities)
```json
{
  "title": "Autonomous Drone Navigation",
  "description": "Researching computer vision algorithms for indoor UAV obstacle avoidance.",
  "research_area": "Robotics",
  "faculty_name": "Dr. Sarah Ahmed",
  "department": "Computer Science",
  "required_skills": "Python, ROS, OpenCV",
  "available_positions": 2,
  "application_deadline": "2026-11-30",
  "status": "Open"
}
```

---

### Example Success Responses

#### 201 Created (POST /api/opportunities)
```json
{
  "message": "Opportunity created successfully",
  "data": {
    "id": 1,
    "title": "Autonomous Drone Navigation",
    "description": "Researching computer vision algorithms for indoor UAV obstacle avoidance.",
    "research_area": "Robotics",
    "faculty_name": "Dr. Sarah Ahmed",
    "department": "Computer Science",
    "required_skills": "Python, ROS, OpenCV",
    "available_positions": 2,
    "application_deadline": "2026-11-30",
    "status": "Open",
    "created_at": "2026-10-10 12:00:00",
    "updated_at": "2026-10-10 12:00:00"
  }
}
```

#### 200 OK (GET /api/opportunities)
```json
{
  "count": 1,
  "data": [
    {
      "id": 1,
      "title": "Autonomous Drone Navigation",
      "description": "Researching computer vision algorithms for indoor UAV obstacle avoidance.",
      "research_area": "Robotics",
      "faculty_name": "Dr. Sarah Ahmed",
      "department": "Computer Science",
      "required_skills": "Python, ROS, OpenCV",
      "available_positions": 2,
      "application_deadline": "2026-11-30",
      "status": "Open",
      "created_at": "2026-10-10 12:00:00",
      "updated_at": "2026-10-10 12:00:00"
    }
  ]
}
```

#### 200 OK (DELETE /api/opportunities/1)
```json
{
  "message": "Opportunity deleted successfully"
}
```

---

### Example Error Responses

#### 400 Bad Request (Validation Failure)
```json
{
  "error": "Validation failed",
  "details": {
    "title": "Research Title is required",
    "available_positions": "Available positions must be at least 1",
    "application_deadline": "Application deadline must be a valid date in YYYY-MM-DD format"
  }
}
```

#### 404 Not Found (Missing Resource / Unknown ID)
```json
{
  "error": "Opportunity with id 999 not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Validation Rules Summary

| Field | Type | Validation Constraints |
| :--- | :--- | :--- |
| `title` | String | Required, trimmed, max 200 characters |
| `description` | Text | Required, trimmed |
| `research_area` | String | Required, trimmed, max 100 characters |
| `faculty_name` | String | Required, trimmed, max 100 characters |
| `department` | String | Required, trimmed, max 100 characters |
| `required_skills` | String | Required, trimmed, max 500 characters (comma-separated) |
| `available_positions` | Integer | Required, integer only (no decimals/booleans), minimum `1` |
| `application_deadline` | String | Required, format `YYYY-MM-DD`, valid calendar date |
| `status` | String | Optional on POST (default `"Open"`), must be exactly `"Open"` or `"Closed"` |

---

## Testing with Postman

An automated Postman collection covering all CRUD and edge cases is included at [`postman/Research_Opportunity_Portal.postman_collection.json`](file:///home/mahmedasim/University/CN/assingments/research_opportunity_portal/postman/Research_Opportunity_Portal.postman_collection.json).

### Steps to Run:
1. Ensure the backend is active on `http://127.0.0.1:5000`.
2. Open Postman on Ubuntu and click **Import**.
3. Select `postman/Research_Opportunity_Portal.postman_collection.json`.
4. The collection uses the variable `base_url = http://127.0.0.1:5000`.
5. **Run Order**:
   - `1. Health Check` (200)
   - `2. Create Opportunity 1` (201, auto-captures `opp_id_1`)
   - `3. Create Opportunity 2` (201, auto-captures `opp_id_2`)
   - `4. Create Opportunity 3` (201, auto-captures `opp_id_3`)
   - `5. Get All Opportunities` (200)
   - `6. Get One Opportunity` (200, checks `opp_id_1`)
   - `7. Update Opportunity` (200, updates fields on `opp_id_1`)
   - `8. Close Opportunity` (200, sets status `"Closed"` on `opp_id_2`)
   - `9. Delete Opportunity` (200, deletes `opp_id_3`)
   - `10. Get Deleted Opportunity` (404, verifies `opp_id_3` was deleted)
   - `11. Invalid Data` (400, verifies validation failure)
6. To run all tests at once, click on the **Research Opportunity Portal** collection and select **Run Collection**.

---

## Troubleshooting

### 1. MySQL "Access Denied" Error
- **Cause**: Incorrect username/password in `.env` or missing privileges.
- **Fix**: Re-grant database privileges in MySQL:
  ```bash
  sudo mysql -e "GRANT ALL PRIVILEGES ON research_portal.* TO 'portal_user'@'localhost'; FLUSH PRIVILEGES;"
  ```

### 2. "Port 5000 / 5500 Already in Use"
- **Cause**: A previous server instance is still occupying the port.
- **Fix**: Locate and terminate the process:
  ```bash
  sudo lsof -i :5000
  kill -9 <PID>
  ```

### 3. "Cannot connect to the server. Is the backend running?"
- **Cause**: The frontend cannot reach `http://127.0.0.1:5000`.
- **Fix**:
  - Verify that the Flask API is running (`cd backend && source venv/bin/activate && python app.py`).
  - Verify `http://127.0.0.1:5000/api/health` returns `{"status": "ok"}` in your browser or with `curl`.

### 4. `ModuleNotFoundError: No module named 'flask'`
- **Cause**: Python virtual environment is not activated or dependencies were not installed.
- **Fix**:
  ```bash
  cd backend
  source venv/bin/activate
  pip install -r requirements.txt
  ```

### 5. Postman Snap File Picker Displays Squares (`□□□□`)
- **Cause**: Ubuntu Snap fontconfig cache corruption.
- **Fix**:
  ```bash
  rm -rf ~/snap/postman/common/.cache/fontconfig
  ```
  Restart Postman afterwards.

---

## Demo Video
- **Video Link**: `[Watch Project Demo Video](https://youtu.be/YOUR_DEMO_VIDEO_LINK)` *(Replace with your link)*

---

## Author

- **Name**: Muhammad Ahmed Asim
- **Registration Number**: 24P-0740
- **Class / Section**: BS Computer Science
