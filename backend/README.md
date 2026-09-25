# Coconut Plucker - Backend

FastAPI-powered backend for the **Coconut Plucker** platform, supporting Customer, Professional, and Admin workflows with a PostgreSQL relational database managed by Alembic.

## Technology Stack

- **Language / Runtime:** Python 3.11+
- **Web Framework:** FastAPI
- **ASGI Server:** Uvicorn
- **ORM:** SQLAlchemy 2.0
- **Database Migrations:** Alembic
- **Database Engine:** PostgreSQL (UUID primary keys, TIMESTAMPTZ timestamps, CHECK constraints)
- **Validation & Serialization:** Pydantic v2 & Pydantic-Settings

## Project Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI entry point, CORS, exception handlers
│   ├── core/
│   │   ├── config.py               # Environment configuration
│   │   ├── database.py             # DB engine, session maker, get_db
│   │   └── security.py             # JWT token creation & decoding
│   ├── models/                     # SQLAlchemy models for all 9 core entities
│   │   ├── user.py                 # users table
│   │   ├── customer.py             # customer_profiles table
│   │   ├── professional.py         # professional_profiles table
│   │   ├── service.py              # services & professional_skills tables
│   │   ├── booking.py              # bookings table
│   │   ├── payment.py              # payments table
│   │   ├── review.py               # reviews table
│   │   └── incident.py             # incidents table
│   ├── schemas/                    # Pydantic request/response schemas
│   ├── routers/                    # API route handlers
│   │   └── health.py               # /health endpoint
│   ├── services/                   # Business logic services
│   └── utils/                      # Helper utilities and dependencies
├── alembic/                        # Alembic migration scripts
│   └── versions/
├── .env.example
├── .env
├── requirements.txt
└── README.md
```

## Setup & Running Locally

1. **Activate Virtual Environment:**
   ```bash
   cd backend
   .venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment:**
   Ensure `.env` contains your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coconut_plucker
   ```

4. **Run Database Migrations:**
   ```bash
   alembic upgrade head
   ```

5. **Start FastAPI Application:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. **Interactive Documentation:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
   - Health Check: `http://localhost:8000/health`
