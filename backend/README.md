# Phish Aware Academy - Backend

This is the Django backend for the Phish Aware Academy application.

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- SQLite (included with Python)

## Setup Instructions

1. **Create and activate a virtual environment** (recommended):
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Apply database migrations**:
   ```bash
   python manage.py migrate
   ```

4. **Create a superuser** (admin account):
   ```bash
   python manage.py createsuperuser
   ```
   Follow the prompts to create an admin account.

5. **Run the development server**:
   ```bash
   python manage.py runserver
   ```

6. **Access the admin interface**:
   - Open your browser and go to: http://127.0.0.1:8000/admin/
   - Log in with your superuser credentials

## API Endpoints

- **Authentication**
  - `POST /api/auth/token/` - Obtain JWT token (login)
  - `POST /api/auth/token/refresh/` - Refresh JWT token
  - `POST /api/auth/register/` - Register a new user
  - `GET /api/auth/profile/` - Get current user profile

## User Roles

1. **SUPER_ADMIN**: Full access to all features and user management
2. **COMPANY_ADMIN**: Can manage users within their company
3. **USER**: Regular user with basic access

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Running Tests

```bash
python manage.py test
```

## Production Deployment

For production, make sure to:
1. Set `DEBUG=False` in `.env`
2. Set a strong `SECRET_KEY`
3. Configure a production database (PostgreSQL recommended)
4. Set up proper CORS settings
5. Use a production-ready web server (e.g., Gunicorn with Nginx)
