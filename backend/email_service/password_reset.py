import os
import json
import random
import string
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import send_mail, get_connection, EmailMultiAlternatives
from bs4 import BeautifulSoup
import logging
from .models import CSWordEmailServ
from .email_tracker import add_tracking_pixel, add_link_tracking

logger = logging.getLogger(__name__)

def generate_random_password(length=12):
    """
    Generate a random password of specified length with a mix of letters, numbers, and special characters
    
    Args:
        length: Length of the password to generate (default: 12)
        
    Returns:
        str: A random password
    """
    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = '!@#$%^&*()'
    
    # Ensure at least one character from each set
    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
        random.choice(special)
    ]
    
    # Fill the rest with random characters from all sets
    all_chars = lowercase + uppercase + digits + special
    password.extend(random.choice(all_chars) for _ in range(length - 4))
    
    # Shuffle the password characters
    random.shuffle(password)
    
    # Convert list to string
    return ''.join(password)

def send_password_reset_email(user, password, company_slug):
    """
    Send a password reset email to a newly created user
    
    Args:
        user: The User object for the newly created user
        password: The temporary password for the user
        company_slug: The company slug for generating the login URL
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Get the user's information
        to_email = user.email
        first_name = user.first_name
        company_name = user.company.name if user.company else "Phish Aware Academy"
        
        # Generate the login URL based on environment
        # Check if we're in production or development
        is_production = not getattr(settings, 'DEBUG', False)
        # Initialize base_url
        base_url = None
        
        # For production environment
        if is_production:
            # First try environment variable
            if os.environ.get('FRONTEND_URL'):
                base_url = os.environ.get('FRONTEND_URL')
            # Then try Railway URL if available
            elif os.environ.get('RAILWAY_STATIC_URL'):
                base_url = os.environ.get('RAILWAY_STATIC_URL')
            # Then try settings
            elif hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL and 'localhost' not in settings.FRONTEND_URL:
                base_url = settings.FRONTEND_URL
            # Fallback to production URL
            else:
                base_url = 'https://www.cbulwark.tech'
        # For development environment
        else:
            # First check environment variable
            if os.environ.get('FRONTEND_URL'):
                base_url = os.environ.get('FRONTEND_URL')
            # Then check settings
            elif hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL:
                base_url = settings.FRONTEND_URL
            # Fallback to localhost
            else:
                base_url = 'http://localhost:3000'
                
        # Ensure the URL doesn't have a trailing slash
        if base_url.endswith('/'):
            base_url = base_url[:-1]
            
        login_url = f"{base_url}/{company_slug}/login"
        
        # Get the template path
        if not user.activated:
         template_path = os.path.join(os.path.dirname(__file__), 'templates', 'password_reset_email.html')
        else:
         template_path = os.path.join(os.path.dirname(__file__), 'templates', 'password_reset_request_email.html')   
        # Read the template file
        with open(template_path, 'r') as template_file:
            template_content = template_file.read()
        
        # Replace template variables
        template_content = template_content.replace('{{first_name}}', first_name)
        template_content = template_content.replace('{{company_name}}', company_name)
        template_content = template_content.replace('{{email}}', to_email)
        template_content = template_content.replace('{{password}}', password)
        template_content = template_content.replace('{{login_url}}', login_url)
        
        # Email subject
        subject = f"Welcome to Phish Aware Academy - Your Account Details"
        
        # Get active email configuration from database
        email_config = CSWordEmailServ.objects.filter(is_active=True).first()
        
        if not email_config:
            logger.error("No active email configuration found in database")
            return False
            
        # Create connection with database settings
        connection = get_connection(
            host=email_config.host,
            port=email_config.port,
            username=email_config.host_user,
            password=email_config.host_password,
            use_tls=settings.EMAIL_USE_TLS,
        )
        
        # Use the host_user from database as the sender email
        from_email = email_config.host_user
        
        # Create a plain text version of the message (fallback for email clients that don't support HTML)
        plain_text_message = template_content.replace('<br>', '\n').replace('<p>', '').replace('</p>', '\n\n')
        plain_text_message = ''.join(BeautifulSoup(plain_text_message, 'html.parser').findAll(text=True))
        
        # Create email message with both text and HTML versions
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_text_message,
            from_email=from_email,
            to=[to_email],
            connection=connection,
        )
        
        # Attach HTML version
        email.attach_alternative(template_content, "text/html")
        
        # Send the email
        email.send(fail_silently=False)
        
        return True
        
    except Exception as e:
        logger.error(f"Error sending password reset email: {str(e)}")
        return False
