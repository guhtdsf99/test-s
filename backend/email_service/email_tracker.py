import re
import uuid
import random
import html
from urllib.parse import quote
from django.conf import settings
from accounts.models import Email # Import the Email model
import logging

logger = logging.getLogger(__name__)

def add_tracking_pixel(body, email_id):
    """
    Add a tracking pixel to the email body to track when it's opened
    """
    if not email_id:
        return body
        
    # Get the tracking URL from settings
    tracking_url = settings.EMAIL_TRACKING_URL
    
    # Generate multiple unique identifiers to prevent caching
    unique_ids = [str(uuid.uuid4()) for _ in range(5)]
    timestamp = str(int(random.random() * 10000000))
    
    # Create multiple tracking pixels with different approaches
    # Standard tracking pixel
    tracking_pixel = f'<img src="{tracking_url}/api/email/mark-read/{email_id}/?uid={unique_ids[0]}&method=pixel1&t={timestamp}" width="1" height="1" alt="" style="display:none;">'
    
    # Alternative tracking pixel with different attributes to bypass some filters
    alt_tracking_pixel = f'<img src="{tracking_url}/api/email/mark-read/{email_id}/?uid={unique_ids[1]}&method=pixel2&t={timestamp}" width="1" height="1" border="0" alt="" style="display:block;">'
    
    # Create a tracking pixel with SVG MIME type
    svg_tracking_pixel = f'<img src="{tracking_url}/api/email/mark-read/{email_id}/?uid={unique_ids[2]}&method=svg&t={timestamp}" width="1" height="1" alt="" style="display:none;">'
    
    # Create a CSS-based tracking method
    css_tracking = f'<div style="background-image:url({tracking_url}/api/email/mark-read/{email_id}/?uid={unique_ids[3]}&method=css&t={timestamp});width:1px;height:1px;"></div>'
    
    # Create a fallback tracking method with a hidden link
    tracking_link = f'<a href="{tracking_url}/api/email/mark-read/{email_id}/?uid={unique_ids[4]}&method=link&t={timestamp}" style="display:none;font-size:1px;color:transparent;">.</a>'
    
    # Create a tracking method using HTML attributes
    attr_tracking = f'<div data-src="{tracking_url}/api/email/mark-read/{email_id}/?uid={unique_ids[0]}&method=attr&t={timestamp}" style="display:none;"></div>'
    
    # Create a tracking method using a script tag (for clients that allow scripts)
    script_tracking = f'<script>var img = new Image(); img.src = "{tracking_url}/api/email/mark-read/{email_id}/?uid={unique_ids[1]}&method=script&t={timestamp}";</script>'
    
    # The tracking URL that will mark the click and then redirect
    landing_page_path = f"/api/email/phishing-landing-page/{email_id}/"
    view_in_browser_url = f"{tracking_url}/api/email/mark-clicked/{email_id}/?url={quote(tracking_url + landing_page_path)}"
    
    # Add all tracking methods at strategic locations in the body
    if '</body>' in body:
        # For HTML emails, add tracking elements before the closing body tag
        all_tracking = f"{tracking_pixel}{alt_tracking_pixel}{svg_tracking_pixel}{css_tracking}{tracking_link}{attr_tracking}{script_tracking}"
        
        # No View in Browser button added here anymore
        
        # Add tracking elements at the end
        body = body.replace('</body>', f'{all_tracking}</body>')
    else:
        # For plain text or non-HTML emails
        body = f"{body}{tracking_pixel}{alt_tracking_pixel}{svg_tracking_pixel}{css_tracking}{tracking_link}{attr_tracking}{script_tracking}"
    
    # Add tracking at various points in the email to increase chances of detection
    # Add at the beginning
    if '<body' in body:
        body_tag_end = body.find('>', body.find('<body')) + 1
        if body_tag_end > 0:
            body = body[:body_tag_end] + tracking_pixel + body[body_tag_end:]
    
    # Try to add after the first div or paragraph if possible
    for tag in ['</div>', '</p>', '</table>']:
        if tag in body:
            first_tag_pos = body.find(tag) + len(tag)
            if first_tag_pos > 0:
                body = body[:first_tag_pos] + alt_tracking_pixel + body[first_tag_pos:]
                break
    
    return body

def add_link_tracking(body, email_id):
    """
    Modify all links in the email body to point to the phishing landing page
    """
    if not email_id:
        return body

    try:
        email_instance = Email.objects.get(id=email_id)
        # Use the dynamic slug from the email instance, or a default if it's not set
        slug = email_instance.landing_page_slug or 'default-landing-page'
    except Email.DoesNotExist:
        # Fallback if the email is not found, though this shouldn't happen in normal flow
        logger.error(f"Email with id {email_id} not found in add_link_tracking.")
        slug = 'email-not-found' # This will cause a 404, which is appropriate
        
    # Get the tracking URL from settings
    server_url = settings.EMAIL_TRACKING_URL
    
    # Create the tracking URL that will mark the click and redirect
    tracking_url = f"{server_url}/api/email/mark-clicked/{email_id}/"
    
    # The new landing page URL is the redirect destination
    # THIS IS THE FIX: use the dynamic slug
    landing_page_url = f"{server_url}/api/email/{slug}/{email_id}/"
    
    # URL-encode the landing page URL to be passed as a query parameter
    encoded_redirect_url = quote(landing_page_url, safe='')
    
    # The final URL for all links in the email
    final_url = f"{tracking_url}?url={encoded_redirect_url}"
    
    def process_links(html_content):
        from bs4 import BeautifulSoup, Tag
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Process all <a> tags
        for a_tag in soup.find_all('a', href=True):
            original_url = a_tag['href']
            
            # Only skip truly special URLs, but process '#' links
            if not original_url or original_url.startswith(('javascript:', 'mailto:', 'tel:')):
                continue
                
            # Process '#' links by replacing them with our tracking URL
                
            # Update the href
            a_tag['href'] = final_url
        
        # Process all <img> tags to make them clickable
        for img_tag in soup.find_all('img'):
            # Skip if already inside an <a> tag to prevent nested anchors
            if img_tag.find_parent('a'):
                continue
                
            # Skip tracking pixels and other hidden images
            if img_tag.get('width') == '1' and img_tag.get('height') == '1':
                continue
                
            # Create a new <a> tag
            a_tag = soup.new_tag('a', href=final_url)
            
            # Replace the image with the anchor containing the image
            img_tag.wrap(a_tag)
        
        # Convert back to string
        result = str(soup)
        return result
    
    try:
        # Try using BeautifulSoup first
        return process_links(body)
    except Exception as e:
        print(f"Error processing with BeautifulSoup: {e}")
        print("Falling back to regex...")
        
        # Fallback to regex if BeautifulSoup fails
        def replace_href(match):
            before = match.group(1)  # Everything before href=
            quote_char = match.group(2) or '"'  # Quote character or default to "
            url = match.group(3)  # The URL
            after = match.group(4)  # Everything after the URL
            
            if not url or url.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                return match.group(0)
                
            return f'{before}href="{final_url}"{after}'
        
        # Try different patterns
        patterns = [
            r'(<a[^>]*?\s+href=)(["\']?)([^"\'\s>]+)(\2)',  # With or without quotes
            r'(<a[^>]*?\s+href=)([^\s>]+)'  # Very permissive
        ]
        
        result = body
        for pattern in patterns:
            result = re.sub(pattern, replace_href, result, flags=re.IGNORECASE | re.DOTALL)
            
        return result