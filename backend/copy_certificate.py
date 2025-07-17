#!/usr/bin/env python
"""
Script to copy the Certificate.png file to the correct location for Railway deployment.
This script should be run during the build process.
"""

import os
import shutil
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def copy_certificate():
    """Copy Certificate.png to multiple locations to ensure it's available."""
    # Define source and destination paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_path = os.path.join(base_dir, '..', 'public', 'Certificate.png')
    
    # Alternative source path if the first one doesn't exist
    if not os.path.exists(source_path):
        source_path = os.path.join(base_dir, 'public', 'Certificate.png')
    
    # If still not found, try absolute path
    if not os.path.exists(source_path):
        source_path = '/app/public/Certificate.png'
    
    if not os.path.exists(source_path):
        logger.error(f"Source certificate not found at {source_path}")
        return False
    
    # Define destination directories
    destinations = [
        os.path.join(base_dir, 'static'),
        os.path.join(base_dir, 'static', 'js'),
        os.path.join(base_dir, 'public'),
    ]
    
    success = False
    
    # Create directories if they don't exist and copy the file
    for dest_dir in destinations:
        try:
            os.makedirs(dest_dir, exist_ok=True)
            dest_path = os.path.join(dest_dir, 'Certificate.png')
            shutil.copy2(source_path, dest_path)
            logger.info(f"Successfully copied Certificate.png to {dest_path}")
            success = True
        except Exception as e:
            logger.error(f"Failed to copy to {dest_dir}: {str(e)}")
    
    return success

if __name__ == "__main__":
    if copy_certificate():
        logger.info("Certificate copying completed successfully")
    else:
        logger.error("Certificate copying failed")