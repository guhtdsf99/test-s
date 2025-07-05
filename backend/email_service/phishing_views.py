from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404
from accounts.models import Email

def phishing_landing_page(request, landing_page_slug, email_id):
    """
    Renders a phishing landing page.
    This page is shown to users after they click a tracked link.
    """
    email_instance = get_object_or_404(Email, id=email_id)
    
    # Security check: Ensure the slug from the URL matches the one in the database
    if email_instance.landing_page_slug != landing_page_slug:
        raise Http404("Landing page not found.")
    
    # If custom landing page content exists, render it directly
    if email_instance.landing_content:
        return HttpResponse(email_instance.landing_content)
    
    # Otherwise, fall back to the default template
    return render(request, 'email_service/phishing_landing.html', {'email_id': email_id})
