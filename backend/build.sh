#!/bin/bash
# Install Python dependencies
pip install -r requirements.txt

# Run migrations and collect static files
python manage.py migrate
python manage.py collectstatic --noinput

# Copy certificate image to necessary locations
echo "Copying certificate image to necessary locations..."
python copy_certificate.py
