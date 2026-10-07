# Project Title
TODO

## GitHub Repository (placeholder)
TODO

## Features
TODO

## Tech Stack
TODO

## Project Structure
TODO

## Prerequisites
TODO

## Database Setup
1. **Install MySQL Server**:
   ```bash
   sudo apt install mysql-server
   ```

2. **Create Database User & Grant Privileges**:
   Open MySQL prompt:
   ```bash
   sudo mysql
   ```
   Run the following SQL commands (replace `'your_password'` with your preferred password):
   ```sql
   CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON research_portal.* TO 'portal_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Import Schema**:
   ```bash
   mysql -u portal_user -p < database/schema.sql
   ```

4. **Verify Table Creation**:
   ```bash
   mysql -u portal_user -p -e "SHOW TABLES FROM research_portal;"
   ```

## Backend Setup
1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create a Virtual Environment**:
   ```bash
   python3 -m venv venv
   ```

3. **Activate the Virtual Environment**:
   ```bash
   source venv/bin/activate
   ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *(Update `DB_USER` and `DB_PASSWORD` with your MySQL credentials).*

6. **Run the Flask Server**:
   ```bash
   python app.py
   ```


## Frontend Setup
TODO

## API Documentation
TODO

## Testing with Postman
TODO

## Demo Video
TODO

## Author
TODO
