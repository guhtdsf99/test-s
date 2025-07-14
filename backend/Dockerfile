FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies including honcho
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install honcho

# Copy project files
COPY . .

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV DJANGO_LOG_LEVEL=INFO

# Run migrations and collect static files
RUN python manage.py collectstatic --noinput

# Command to run migrations, test the job, then start both processes
CMD python manage.py migrate && \
    python manage.py run_email_scheduler --run-now && \
    honcho start