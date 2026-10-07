# API Specification

## Database
- **Database Name**: `research_portal`
- **Table Name**: `research_opportunities`

## Fields (JSON uses snake_case)
- `id`: integer, auto-generated, unique, primary key
- `title`: string, required, max 200 characters
- `description`: string, required
- `research_area`: string, required, max 100 characters
- `faculty_name`: string, required, max 100 characters
- `department`: string, required, max 100 characters
- `required_skills`: string, required, max 500 characters, comma-separated text
- `available_positions`: integer, required, must be >= 1
- `application_deadline`: string, required, format `YYYY-MM-DD`, must be a real date
- `status`: string, "Open" or "Closed", default "Open"
- `created_at`: timestamp, read-only
- `updated_at`: timestamp, read-only

---

## Endpoints (Base Path: `/api`)

### 1. Create Research Opportunity
- **Method**: `POST`
- **URL**: `/api/opportunities`
- **Success Response**: `201 Created`
  ```json
  {
    "message": "Opportunity created successfully",
    "data": { ... }
  }
  ```

### 2. List Research Opportunities
- **Method**: `GET`
- **URL**: `/api/opportunities`
- **Ordering**: Newest first (ordered by `created_at` DESC)
- **Success Response**: `200 OK`
  ```json
  {
    "count": 0,
    "data": [ ... ]
  }
  ```

### 3. Get Single Research Opportunity
- **Method**: `GET`
- **URL**: `/api/opportunities/<id>`
- **Success Response**: `200 OK`
  ```json
  {
    "data": { ... }
  }
  ```
- **Error Response**: `404 Not Found` if opportunity does not exist.

### 4. Update Research Opportunity
- **Method**: `PUT`
- **URL**: `/api/opportunities/<id>`
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Opportunity updated successfully",
    "data": { ... }
  }
  ```
- **Error Responses**: `400 Bad Request` | `404 Not Found`

### 5. Delete Research Opportunity
- **Method**: `DELETE`
- **URL**: `/api/opportunities/<id>`
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Opportunity deleted successfully"
  }
  ```
- **Error Response**: `404 Not Found`

### 6. Health Check
- **Method**: `GET`
- **URL**: `/api/health`
- **Success Response**: `200 OK`
  ```json
  {
    "status": "ok"
  }
  ```

---

## Business & Validation Rules
- **POST**: Requires ALL required fields. On `POST`, `status` is optional and defaults to `"Open"`.
- **PUT**: Accepts a partial JSON body (only the fields being changed, e.g., `{"status": "Closed"}`). Every field that IS sent is validated by the same validation rules. An empty body or a body with no valid fields returns `400 Bad Request`. Changing status from `"Open"` to `"Closed"` is performed through this `PUT` endpoint.
- **String Sanitization**: Strings are trimmed; blank or whitespace-only strings count as missing/invalid.

---

## Error Format (Always JSON)

- **400 Bad Request**:
  Used for validation failures or malformed/non-JSON bodies.
  ```json
  {
    "error": "Validation failed",
    "details": {
      "field_name": "message"
    }
  }
  ```

- **404 Not Found**:
  Used when an opportunity id does not exist, or for unknown routes and non-numeric ids.
  ```json
  {
    "error": "Opportunity with id <id> not found"
  }
  ```

- **500 Internal Server Error**:
  Used for unexpected server errors. Never leak stack traces or SQL details to the client.
  ```json
  {
    "error": "Internal server error"
  }
  ```
