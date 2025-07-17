import os
import logging
from django.conf import settings
from django.contrib.staticfiles import finders

def get_certificate_path():
    """
    Get the absolute path to the certificate background image,
    ensuring it works in both development and production environments.
    """
    # Log the current directory for debugging
    logging.info(f"Current directory: {os.getcwd()}")
    logging.info(f"BASE_DIR: {settings.BASE_DIR}")
    
    # Check multiple possible locations
    possible_paths = [
        # Django static finder paths
        finders.find('js/Certificate.png'),
        finders.find('Certificate.png'),
        
        # Absolute paths
        os.path.join(settings.BASE_DIR, 'static', 'js', 'Certificate.png'),
        os.path.join(settings.BASE_DIR, 'static', 'Certificate.png'),
        
        # Relative paths from BASE_DIR
        os.path.join(settings.BASE_DIR, '..', 'public', 'Certificate.png'),
        os.path.join(settings.BASE_DIR, 'public', 'Certificate.png'),
        
        # Railway-specific paths
        os.path.join(settings.BASE_DIR, '..', '..', 'public', 'Certificate.png'),
        os.path.join('/app/public', 'Certificate.png'),  # Railway container path
    ]
    
    # Return the first path that exists
    for path in possible_paths:
        if path and os.path.exists(path):
            logging.info(f"Found certificate at: {path}")
            return path
    
    # If no path exists, log the issue and return None
    logging.error("Certificate.png not found in any expected location")
    return None