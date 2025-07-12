from django.core.mail import send_mail, get_connection, EmailMultiAlternatives
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CSWordEmailServ, EmailTemplate, PhishingCampaign, LandingPageTemplate
from .serializers import CSWordEmailServSerializer, EmailTemplateSerializer, PhishingCampaignSerializer, LandingPageTemplateSerializer
from accounts.models import Company
from accounts.models import Email, User, Company, Department # Added Company and Department import
from django.db.models import Count, Q, Avg, F, ExpressionWrapper, FloatField, Case, When
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from django.utils import timezone
from .serializers import (CSWordEmailServSerializer, EmailTemplateSerializer, 
                          PhishingCampaignSerializer, PhishingSummaryStatsSerializer,
                          DepartmentPerformanceSerializer, TemporalTrendPointSerializer,
                          LandingPageTemplateSerializer)
import json
import logging
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class JsonResponseWithCors(JsonResponse):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('content_type', 'application/json')
        kwargs.setdefault('safe', False)  # Allow non-dict objects to be serialized
        super().__init__(*args, **kwargs)
        self['Access-Control-Allow-Origin'] = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else '*'
        self['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        self['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        self['Access-Control-Allow-Credentials'] = 'true'

@csrf_exempt
@require_http_methods(['GET', 'OPTIONS'])
def get_email_configurations(request):
    """
    API endpoint to get all email configurations for the frontend dropdown menu
    """
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = JsonResponseWithCors({}, status=200)
        return response
        
    try:
        email_configs = CSWordEmailServ.objects.all()
        serializer = CSWordEmailServSerializer(email_configs, many=True)
        return JsonResponseWithCors(serializer.data, safe=False)
    except Exception as e:
        return JsonResponseWithCors({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(['GET', 'OPTIONS'])
@csrf_exempt
@api_view(['GET', 'OPTIONS'])
@permission_classes([IsAuthenticated])
def get_email_templates(request):
    """
    API endpoint to get email templates based on global flag and company
    """
    if request.method == 'OPTIONS':
        return JsonResponseWithCors({}, status=200)
        
    try:
        # Get company slug from query parameters or user's company
        company_slug = request.query_params.get('company_slug')
        
        if company_slug:
            try:
                company = Company.objects.get(slug=company_slug)
                # Get templates that are either global or belong to the company
                templates = EmailTemplate.objects.filter(
                    Q(is_global=True) | Q(company=company)
                ).distinct()
            except Company.DoesNotExist:
                templates = EmailTemplate.objects.filter(is_global=True)
        else:
            # If no company_slug, return all templates (admin only)
            if not request.user.is_staff:
                return JsonResponseWithCors(
                    {'error': 'Not authorized to view all templates'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            templates = EmailTemplate.objects.all()
            
        serializer = EmailTemplateSerializer(templates, many=True)
        return JsonResponseWithCors(serializer.data, safe=False)
        
    except Exception as e:
        return JsonResponseWithCors(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_email_template(request):
    """
    API endpoint to create a new email template
    """
    try:
        data = request.data.copy()
        
        # Set the company from the user's company if not provided
        if 'company' not in data and hasattr(request.user, 'company'):
            data['company'] = request.user.company.id
        
        serializer = EmailTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponseWithCors(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        return JsonResponseWithCors(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return JsonResponseWithCors(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_email_template(request, template_id):
    """
    API endpoint to get, update, or delete a specific email template
    """
    try:
        try:
            template = EmailTemplate.objects.get(id=template_id)
        except EmailTemplate.DoesNotExist:
            return JsonResponseWithCors(
                {'error': 'Template not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions (user must be admin or template must belong to their company)
        if not request.user.is_staff and template.company != request.user.company:
            return JsonResponseWithCors(
                {'error': 'Not authorized to access this template'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'GET':
            serializer = EmailTemplateSerializer(template)
            return JsonResponseWithCors(serializer.data)
            
        elif request.method == 'PUT':
            serializer = EmailTemplateSerializer(template, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponseWithCors(serializer.data)
            return JsonResponseWithCors(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        elif request.method == 'DELETE':
            template.delete()
            return JsonResponseWithCors(
                {'message': 'Template deleted successfully'}, 
                status=status.HTTP_204_NO_CONTENT
            )
            
    except Exception as e:
        return JsonResponseWithCors(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST', 'OPTIONS'])
@permission_classes([IsAuthenticated])
def create_phishing_campaign_by_slug(request):
    if request.method == 'OPTIONS':
        return JsonResponseWithCors({}, status=200)

    try:
        data = request.data
        campaign_name = data.get('campaign_name')
        company_slug = data.get('company_slug')
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        email_template_id = data.get('email_template_id')
        landing_page_template_id = data.get('landing_page_template_id')
        recipient_ids = data.get('recipient_ids', [])
        department_ids = data.get('department_ids', [])
        send_to_all = data.get('send_to_all', False)
        email_service_config_id = data.get('email_service_config_id')

        # --- Validation ---
        required_fields = {
            'campaign_name': campaign_name,
            'company_slug': company_slug,
            'start_date': start_date_str,
            'end_date': end_date_str,
            'email_template_id': email_template_id,
            'email_service_config_id': email_service_config_id
        }
        missing_fields = [key for key, value in required_fields.items() if not value]
        if missing_fields:
            return JsonResponseWithCors({'error': f'Missing required fields: {", ".join(missing_fields)}'}, status=status.HTTP_400_BAD_REQUEST)

        if not send_to_all and not recipient_ids and not department_ids:
            return JsonResponseWithCors({'error': 'No recipients selected. Please select recipients, departments, or choose to send to all.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Fetch objects ---
        company = Company.objects.get(slug=company_slug)
        email_template = EmailTemplate.objects.get(id=email_template_id)
        email_service_config = CSWordEmailServ.objects.get(id=email_service_config_id)
        
        landing_page_template = None
        if landing_page_template_id:
            landing_page_template = LandingPageTemplate.objects.get(id=landing_page_template_id)

        # --- Date parsing ---
        start_datetime = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_datetime = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))

        # --- Create Campaign ---
        campaign = PhishingCampaign.objects.create(
            campaign_name=campaign_name,
            company=company,
            start_date=start_datetime.date(),
            end_date=end_datetime.date(),
            start_time=start_datetime.time(),
            end_time=end_datetime.time()
        )

        # --- Determine Recipients ---
        recipients = User.objects.none()
        if send_to_all:
            recipients = User.objects.filter(company=company, is_active=True)
        else:
            if recipient_ids:
                recipients = User.objects.filter(company=company, id__in=recipient_ids, is_active=True)
            if department_ids:
                users_in_depts = User.objects.filter(company=company, departments__id__in=department_ids, is_active=True)
                recipients = (recipients | users_in_depts).distinct()
        
        # --- Create Emails ---
        for recipient in recipients:
            Email.objects.create(
                subject=email_template.subject,
                content=email_template.content,
                landing_content=landing_page_template.content if landing_page_template else None,
                landing_page_slug=landing_page_template.slug if landing_page_template else None,
                sender=request.user,
                recipient=recipient,
                phishing_campaign=campaign,
                email_service_config=email_service_config
            )

        serializer = PhishingCampaignSerializer(campaign)
        return JsonResponseWithCors(serializer.data, status=status.HTTP_201_CREATED)

    except (Company.DoesNotExist, EmailTemplate.DoesNotExist, LandingPageTemplate.DoesNotExist, CSWordEmailServ.DoesNotExist) as e:
        logger.error(f"Object not found during campaign creation: {e}")
        return JsonResponseWithCors({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating phishing campaign: {e}", exc_info=True)
        return JsonResponseWithCors({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_campaign_analytics(request, campaign_id):
    """
    Get detailed analytics for a specific campaign
    """
    try:
        # Get the campaign
        campaign = PhishingCampaign.objects.get(id=campaign_id, company=request.user.company)
        
        # Get all emails for this campaign with related user data
        from django.db.models import Prefetch
        from accounts.models import User, Email
        
        emails = Email.objects.filter(
            phishing_campaign=campaign
        ).select_related('recipient').only(
            'id', 'recipient__email', 'recipient__first_name', 'recipient__last_name',
            'recipient__departments__name', 'read', 'clicked', 'sent_at'
        )
        
        # Prepare the response data
        email_analytics = []
        for email in emails:
            email_analytics.append({
                'id': email.id,
                'email': email.recipient.email,
                'name': f"{email.recipient.first_name or ''} {email.recipient.last_name or ''}".strip() or 'Unknown',
                'departments': [d.name for d in email.recipient.departments.all()] or ['No Department'],
                'opened': email.read,
                'clicked': email.clicked,
                'sent_at': email.sent_at.isoformat() if email.sent_at else None
            })
        
        return JsonResponseWithCors({
            'campaign_id': campaign.id,
            'campaign_name': campaign.campaign_name,
            'start_date': campaign.start_date.isoformat(),
            'end_date': campaign.end_date.isoformat(),
            'analytics': {
                'emailOpens': email_analytics
            },
            'metrics': {
                'total_emails': emails.count(),
                'read': emails.filter(read=True).count(),
                'clicked': emails.filter(clicked=True).count(),
                'open_rate': (emails.filter(read=True).count() / emails.count() * 100) if emails.count() > 0 else 0,
                'click_rate': (emails.filter(clicked=True).count() / emails.count() * 100) if emails.count() > 0 else 0
            }
        })
        
    except PhishingCampaign.DoesNotExist:
        return JsonResponseWithCors(
            {'error': 'Campaign not found or access denied'}, 
            status=404
        )
    except Exception as e:
        logger.error(f"Error fetching campaign analytics: {str(e)}", exc_info=True)
        return JsonResponseWithCors(
            {'error': 'Failed to fetch campaign analytics'}, 
            status=500
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_phishing_campaigns(request):
    """
    List all phishing campaigns for the current user's company with email statistics
    """
    try:
        # Get the current user's company
        company = request.user.company
        if not company:
            return JsonResponseWithCors(
                {'error': 'User is not associated with any company'}, 
                status=400
            )
        
        # Get all campaigns for the company
        campaigns = PhishingCampaign.objects.filter(company=company).order_by('-created_at')
        
        # Get the email stats for all campaigns in one query
        from django.db.models import Count, Q
        from accounts.models import Email
        
        # Get counts for all campaigns
        campaign_stats = Email.objects.filter(
            phishing_campaign__in=campaigns
        ).values('phishing_campaign').annotate(
            targets_count=Count('id'),
            sent_count=Count('id', filter=Q(sent=True)),
            opens_count=Count('id', filter=Q(read=True)),
            clicks_count=Count('id', filter=Q(clicked=True))
        )
        
        # Convert to a dictionary for easier lookup
        stats_dict = {
            stat['phishing_campaign']: stat 
            for stat in campaign_stats
        }
        
        # Serialize the campaigns
        serializer = PhishingCampaignSerializer(campaigns, many=True)
        data = serializer.data
        
        current_date = timezone.now().date()
        # Add stats to each campaign
        for campaign_data, campaign in zip(data, campaigns):
            stats = stats_dict.get(campaign.id, {
                'targets_count': 0,
                'sent_count': 0,
                'opens_count': 0,
                'clicks_count': 0
            })
            
            targets = stats['targets_count'] or 0
            sent_emails = stats['sent_count'] or 0
            opens = stats['opens_count'] or 0
            clicks = stats['clicks_count'] or 0

            status = ''
            if campaign.end_date < current_date:
                status = 'Completed'
            elif campaign.start_date > current_date:
                status = 'Upcoming'
            else:
                if sent_emails > 0:
                    status = 'Active'
                else:
                    status = 'Pending'
            
            campaign_data.update({
                'targets_count': targets,
                'sent_count': sent_emails,
                'opens_count': opens,
                'clicks_count': clicks,
                'open_rate': round((opens / targets * 100) if targets > 0 else 0, 2),
                'click_rate': round((clicks / targets * 100) if targets > 0 else 0, 2),
                'status': status,
            })
        
        return JsonResponseWithCors(data, safe=False)
        
    except Exception as e:
        logger.error(f"Error listing phishing campaigns: {str(e)}", exc_info=True)
        return JsonResponseWithCors(
            {'error': 'Failed to fetch phishing campaigns'}, 
            status=500
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def phishing_analytics_summary(request):
    company = request.user.company
    if not company:
        # Return empty data structure instead of error
        summary_data = {
            'total_campaigns': 0,
            'total_emails_sent': 0,
            'total_emails_clicked': 0,
            'total_emails_read': 0,
            'average_click_rate': 0,
            'average_read_rate': 0,
        }
        serializer = PhishingSummaryStatsSerializer(summary_data)
        return JsonResponseWithCors(serializer.data)

    # -------- New: optional date-range filtering --------
    from django.utils import timezone
    from datetime import timedelta

    time_range_param = request.GET.get('range', '6months')  # default 6 months
    end_date = timezone.now().date()

    if time_range_param == '3months':
        start_date = end_date - timedelta(days=3 * 30)
    elif time_range_param == '1year':
        start_date = end_date - timedelta(days=365)
    else:  # 6 months
        start_date = end_date - timedelta(days=6 * 30)

    # ----------------------------------------------------

    campaigns = PhishingCampaign.objects.filter(
        company=company,
        start_date__gte=start_date,
    )

    emails_qs = Email.objects.filter(
        phishing_campaign__company=company,
        sent=True,
        phishing_campaign__start_date__gte=start_date,
    )
    total_campaigns = campaigns.count()
    total_emails_sent = emails_qs.count()
    total_emails_clicked = emails_qs.filter(clicked=True).count()
    total_emails_read = emails_qs.filter(read=True).count()

    average_click_rate = (total_emails_clicked / total_emails_sent * 100) if total_emails_sent > 0 else 0
    average_read_rate = (total_emails_read / total_emails_sent * 100) if total_emails_sent > 0 else 0

    summary_data = {
        'total_campaigns': total_campaigns,
        'total_emails_sent': total_emails_sent,
        'total_emails_clicked': total_emails_clicked,
        'total_emails_read': total_emails_read,
        'average_click_rate': round(average_click_rate, 2),
        'average_read_rate': round(average_read_rate, 2),
    }
    serializer = PhishingSummaryStatsSerializer(summary_data)
    return JsonResponseWithCors(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def department_performance_analytics(request):
    company = request.user.company
    if not company:
        # Return empty array instead of error
        return JsonResponseWithCors([])

    # -------- New: optional date-range filtering --------
    from django.utils import timezone
    from datetime import timedelta

    time_range_param = request.GET.get('range', '6months')
    end_date = timezone.now().date()
    if time_range_param == '3months':
        start_date = end_date - timedelta(days=3 * 30)
    elif time_range_param == '1year':
        start_date = end_date - timedelta(days=365)
    else:
        start_date = end_date - timedelta(days=6 * 30)
    # ----------------------------------------------------

    departments = Department.objects.filter(company=company)
    # Include users with no department
    departments_data = []

    # Handle users with no department
    users_no_department = User.objects.filter(company=company, departments__isnull=True)
    emails_no_dept_qs = Email.objects.filter(
        phishing_campaign__company=company,
        phishing_campaign__start_date__gte=start_date,
        recipient__in=users_no_department,
        sent=True,
    )
    sent_no_dept = emails_no_dept_qs.count()
    clicked_no_dept = emails_no_dept_qs.filter(clicked=True).count()
    read_no_dept = emails_no_dept_qs.filter(read=True).count()

    if sent_no_dept > 0:
        departments_data.append({
            'department_id': None,
            'department_name': 'No Department',
            'emails_sent': sent_no_dept,
            'emails_clicked': clicked_no_dept,
            'emails_read': read_no_dept,
            'click_rate': round((clicked_no_dept / sent_no_dept * 100) if sent_no_dept > 0 else 0, 2),
            'read_rate': round((read_no_dept / sent_no_dept * 100) if sent_no_dept > 0 else 0, 2),
        })

    for dept in departments:
        users_in_dept = User.objects.filter(departments=dept)
        emails_qs = Email.objects.filter(
            phishing_campaign__company=company,
            phishing_campaign__start_date__gte=start_date,
            recipient__in=users_in_dept,
            sent=True,
        )
        sent_count = emails_qs.count()
        clicked_count = emails_qs.filter(clicked=True).count()
        read_count = emails_qs.filter(read=True).count()

        if sent_count > 0: # Only add department if emails were sent to them
            departments_data.append({
                'department_id': dept.id,
                'department_name': dept.name,
                'emails_sent': sent_count,
                'emails_clicked': clicked_count,
                'emails_read': read_count,
                'click_rate': round((clicked_count / sent_count * 100) if sent_count > 0 else 0, 2),
                'read_rate': round((read_count / sent_count * 100) if sent_count > 0 else 0, 2),
            })

    serializer = DepartmentPerformanceSerializer(departments_data, many=True)
    return JsonResponseWithCors(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def phishing_temporal_trend_analytics(request):
    """Return click/read rates aggregated either weekly or monthly based on the
    query-string parameter `range`.

    Accepted values for `range`:
    • `weekly`   – group by week (TruncWeek) for the last 6 months.
    • `monthly`  – group by month (TruncMonth) for the last 6 months.
    • `3months`, `6months`, `1year` – keep the old behaviour (group by month and
      use the specified time window).

    NOTE: the aggregation now uses the **end_date of the Phishing Campaign**
    instead of the individual e-mail `sent_at` timestamp so that completed
    campaigns appear in the correct period regardless of when each e-mail was
    sent.
    """
    company = request.user.company
    if not company:
        # Return empty array instead of error
        return JsonResponseWithCors([])

    range_param = request.GET.get('range', 'monthly').lower().strip()
    end_date = datetime.now()

    # Determine grouping and timeframe
    if range_param in ['weekly', 'monthly']:
        grouping = range_param  # control the Trunc function later
        # default window for new mode → last 6 months
        start_date = end_date - timedelta(days=6 * 30)
    else:
        grouping = 'monthly'  # legacy endpoints always grouped monthly
        if range_param == '3months':
            start_date = end_date - timedelta(days=3 * 30)
        elif range_param == '1year':
            start_date = end_date - timedelta(days=365)
        else:  # "6months" or anything else → 6 months
            start_date = end_date - timedelta(days=6 * 30)

    # Choose truncation function based on grouping
    from django.db.models.functions import TruncMonth, TruncWeek
    if grouping == 'weekly':
        trunc_fn = TruncWeek('phishing_campaign__end_date')
    else:
        trunc_fn = TruncMonth('phishing_campaign__end_date')

    emails_qs = (
        Email.objects.filter(
            phishing_campaign__company=company,
            sent=True,
            phishing_campaign__end_date__gte=start_date,
            phishing_campaign__end_date__lte=end_date,
        )
        .annotate(period=trunc_fn)
        .values('period')
        .annotate(
            total_sent=Count('id'),
            total_clicked=Count(Case(When(clicked=True, then=1))),
            total_read=Count(Case(When(read=True, then=1))),
        )
        .order_by('period')
    )

    # Get all departments for the company to iterate over them later
    departments = Department.objects.filter(company=company)

    trend_data = []
    for stat in emails_qs:
        period_label = stat['period'].strftime('%Y-%m') if grouping != 'weekly' else stat['period'].strftime('%Y-W%V')

        top_click_dept = {'name': 'N/A', 'rate': 0}
        top_read_dept = {'name': 'N/A', 'rate': 0}

        # For each period, find the best-performing department
        for dept in departments:
            dept_emails = Email.objects.filter(
                phishing_campaign__company=company,
                sent=True,
                recipient__isnull=False,  # Skip emails with no recipient
                phishing_campaign__end_date__gte=stat['period'],
                phishing_campaign__end_date__lt=stat['period'] + timedelta(days=31 if grouping == 'monthly' else 7),
                recipient__departments=dept
            )
            
            total_sent_dept = dept_emails.count()
            if total_sent_dept > 0:
                # Click Rate
                total_clicked_dept = dept_emails.filter(clicked=True).count()
                click_rate_dept = (total_clicked_dept / total_sent_dept) * 100
                if click_rate_dept > top_click_dept['rate']:
                    top_click_dept = {'name': dept.name, 'rate': click_rate_dept}

                # Read Rate
                total_read_dept = dept_emails.filter(read=True).count()
                read_rate_dept = (total_read_dept / total_sent_dept) * 100
                if read_rate_dept > top_read_dept['rate']:
                    top_read_dept = {'name': dept.name, 'rate': read_rate_dept}

        click_rate = (
            stat['total_clicked'] / stat['total_sent'] * 100 if stat['total_sent'] > 0 else 0
        )
        read_rate = (
            stat['total_read'] / stat['total_sent'] * 100 if stat['total_sent'] > 0 else 0
        )

        trend_data.append(
            {
                'period': period_label,
                'click_rate': round(click_rate, 2),
                'read_rate': round(read_rate, 2),
                'top_click_rate_department': { 'name': top_click_dept['name'], 'rate': round(top_click_dept['rate'], 2) },
                'top_read_rate_department': { 'name': top_read_dept['name'], 'rate': round(top_read_dept['rate'], 2) },
            }
        )

    return JsonResponseWithCors(trend_data)

@csrf_exempt
@api_view(['GET', 'OPTIONS'])
@permission_classes([IsAuthenticated])
def get_landing_page_templates(request):
    """
    API endpoint to get landing page templates based on global flag and company
    """
    if request.method == 'OPTIONS':
        return JsonResponseWithCors({}, status=200)
        
    try:
        company_slug = request.query_params.get('company_slug')
        
        if company_slug:
            try:
                company = Company.objects.get(slug=company_slug)
                templates = LandingPageTemplate.objects.filter(
                    Q(is_global=True) | Q(company=company)
                ).distinct()
            except Company.DoesNotExist:
                templates = LandingPageTemplate.objects.filter(is_global=True)
        else:
            if not request.user.is_staff:
                return JsonResponseWithCors(
                    {'error': 'Not authorized to view all templates'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            templates = LandingPageTemplate.objects.all()
            
        serializer = LandingPageTemplateSerializer(templates, many=True)
        return JsonResponseWithCors(serializer.data, safe=False)
        
    except Exception as e:
        return JsonResponseWithCors(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_landing_page_template(request):
    """
    API endpoint to create a new landing page template
    """
    try:
        data = request.data.copy()
        
        if 'company' not in data and hasattr(request.user, 'company'):
            data['company'] = request.user.company.id
        
        serializer = LandingPageTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponseWithCors(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        return JsonResponseWithCors(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return JsonResponseWithCors(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_landing_page_template(request, template_id):
    """
    API endpoint to get, update, or delete a specific landing page template
    """
    try:
        try:
            template = LandingPageTemplate.objects.get(id=template_id)
        except LandingPageTemplate.DoesNotExist:
            return JsonResponseWithCors(
                {'error': 'Template not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not request.user.is_staff and template.company != request.user.company:
            return JsonResponseWithCors(
                {'error': 'Not authorized to access this template'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == 'GET':
            serializer = LandingPageTemplateSerializer(template)
            return JsonResponseWithCors(serializer.data)
            
        elif request.method == 'PUT':
            serializer = LandingPageTemplateSerializer(template, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponseWithCors(serializer.data)
            return JsonResponseWithCors(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        elif request.method == 'DELETE':
            template.delete()
            return JsonResponseWithCors(
                {'message': 'Template deleted successfully'}, 
                status=status.HTTP_204_NO_CONTENT
            )
            
    except Exception as e:
        return JsonResponseWithCors(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
