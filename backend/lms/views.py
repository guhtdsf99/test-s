from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.contrib.admin.views.decorators import staff_member_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from courses.models import Course, Question
from accounts.models import Company, User
from .models import LMSCampaign, LMSCampaignUser, UserCourseProgress
from email_service.password_reset import generate_random_password, send_password_reset_email
from email_service.campaign_reminder import send_campaign_reminder_email
from django.utils import timezone
from django.db.models import Q, Avg, Count
import json
from collections import defaultdict

# PDF generation using lightweight fpdf2
try:
    from io import BytesIO
    from fpdf import FPDF  # type: ignore
except ImportError:  # pragma: no cover
    FPDF = None  # type: ignore
    BytesIO = None  # type: ignore


@staff_member_required
def get_courses_for_company(request):
    """AJAX view to get courses for a specific company"""
    company_id = request.GET.get('company_id')
    if not company_id:
        return JsonResponse([], safe=False)
    
    try:
        company = Company.objects.get(id=company_id)
        # Get courses available for this company
        courses = Course.objects.filter(companies=company)
        
        # Format data for JSON response
        data = [{'id': course.id, 'name': course.name} for course in courses]
        return JsonResponse(data, safe=False)
    except Company.DoesNotExist:
        return JsonResponse([], safe=False)


@staff_member_required
def get_users_for_company(request):
    """AJAX view to get users for a specific company"""
    company_id = request.GET.get('company_id')
    if not company_id:
        return JsonResponse([], safe=False)
    
    try:
        company = Company.objects.get(id=company_id)
        # Get users for this company
        users = User.objects.filter(company=company)
        
        # Format data for JSON response
        data = [{'id': user.id, 'name': f"{user.email} ({user.username})"} for user in users]
        return JsonResponse(data, safe=False)
    except Company.DoesNotExist:
        return JsonResponse([], safe=False)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lms_campaigns(request):
    """API endpoint to get LMS campaigns for the current user's company"""
    user = request.user
    
    # Check if user is a Super Admin
    is_super_admin = False
    if hasattr(user, 'role'):
        # Check for 'SUPER_ADMIN' (correct case from User model)
        is_super_admin = user.role == 'SUPER_ADMIN'
    elif hasattr(user, 'is_superuser'):
        is_super_admin = user.is_superuser
    
    # Get the user's company
    company = user.company
    
    # Handle Super Admins differently
    if is_super_admin:
        # For Super Admins, return all campaigns or an empty list
        if not company:
            # Return all campaigns for Super Admins without a company
            campaigns = LMSCampaign.objects.all()
        else:
            # Return campaigns for the Super Admin's company if they have one
            campaigns = LMSCampaign.objects.filter(company=company)
    else:
        # For regular users, require a company
        if not company:
            return Response({"error": "User does not belong to any company"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get campaigns for this company
        campaigns = LMSCampaign.objects.filter(company=company)
    
    # Format data for response
    data = []
    for campaign in campaigns:
        # Get stats for this campaign
        total_users = LMSCampaignUser.objects.filter(campaign=campaign).count()
        completed_users = LMSCampaignUser.objects.filter(campaign=campaign, completed=True).count()
        in_progress_users = LMSCampaignUser.objects.filter(campaign=campaign, started=True, completed=False).count()
        not_started_users = total_users - completed_users - in_progress_users
        
        # Calculate average completion percentage
        avg_completion = "0%"
        if total_users > 0:
            avg_completion = f"{int((completed_users / total_users) * 100)}%"
        
        # Format campaign data
        campaign_data = {
            "id": campaign.id,
            "title": campaign.name,
            "course": ", ".join([course.name for course in campaign.courses.all()]) if campaign.courses.exists() else "",
            "audience": "All Employees",  # This could be more specific based on your requirements
            "videoCount": 1,  # This could be calculated based on course content
            "startDate": campaign.start_date.strftime("%Y-%m-%d") if campaign.start_date else "",
            "endDate": campaign.end_date.strftime("%Y-%m-%d") if campaign.end_date else "",
            "stats": {
                "totalEnrolled": total_users,
                "completed": completed_users,
                "inProgress": in_progress_users,
                "notStarted": not_started_users,
                "averageCompletion": avg_completion
            }
        }
        data.append(campaign_data)
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_lms_campaign(request):
    """API endpoint to create a new LMS campaign"""
    user = request.user
    
    # Check if user has permission to create campaigns
    if not user.is_staff:
        return Response({"error": "You do not have permission to create campaigns"}, status=status.HTTP_403_FORBIDDEN)
    
    # Get the user's company
    company = user.company
    if not company:
        return Response({"error": "User does not belong to any company"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get request data
    try:
        data = request.data
        name = data.get('name')
        course_ids = data.get('course_ids', [])  # Changed from course_id to course_ids
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        selected_users = data.get('selected_users', [])
        
        # Validate required fields
        if not name or not course_ids:  # Check for course_ids instead of course_id
            return Response({"error": "Name and at least one course are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the campaign
        campaign = LMSCampaign.objects.create(
            name=name,
            company=company,
            created_by=user,
            start_date=start_date,
            end_date=end_date
        )
        
        # Add courses to the campaign
        for course_id in course_ids:
            try:
                course = Course.objects.get(id=course_id)
                # Verify course belongs to company
                if not course.companies.filter(id=company.id).exists():
                    return Response({"error": f"Course {course.name} does not belong to your company"}, status=status.HTTP_400_BAD_REQUEST)
                campaign.courses.add(course)
            except Course.DoesNotExist:
                return Response({"error": f"Course with ID {course_id} not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Add selected users to the campaign
        for user_id in selected_users:
            try:
                user = User.objects.get(id=user_id, company=company)
                LMSCampaignUser.objects.create(campaign=campaign, user=user)
                # ---- Email logic ----
                try:
                    company_slug = user.company.slug if user.company else ''
                    if user.activated:
                        # Active user – just send campaign reminder
                        send_campaign_reminder_email(user, campaign, company_slug)
                    else:
                        # Inactive user – generate temp password, set it, send reset email then reminder
                        temp_pwd = generate_random_password()
                        send_password_reset_email(user, temp_pwd, company_slug)
                        send_campaign_reminder_email(user, campaign, company_slug)
                        user.set_password(temp_pwd)
                        user.activated = True
                        user.save()
                except Exception as email_err:
                    import logging
                    logging.exception("Error sending campaign emails for user %s: %s", user.id, email_err)
            except User.DoesNotExist:
                # Skip users that don't exist or don't belong to the company
                continue
        
        # Return success response
        return Response({
            "success": True,
            "campaign_id": campaign.id,
            "message": "Campaign created successfully"
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_campaigns(request):
    """API endpoint to get LMS campaigns assigned to the current user"""
    user = request.user
    
    # Get the user's company
    company = user.company
    if not company:
        return Response({"error": "User does not belong to any company"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get current date for filtering campaigns
    current_date = timezone.now().date()
    
    try:
        # Get campaigns assigned to this user that are in the same company
        user_campaign_relations = LMSCampaignUser.objects.filter(
            user=user,
            campaign__company=company
        ).select_related('campaign').prefetch_related('campaign__courses')
        
        # Include campaigns that have already started. We exclude only those that
        # are scheduled for the future (start_date > today).  This ensures that
        # campaigns whose end_date has already passed are still returned so the
        # frontend can list them under the "Completed" tab.
        filtered_campaigns = []
        for relation in user_campaign_relations:
            campaign = relation.campaign
            
            # Skip campaigns where the start date is in the future
            if campaign.start_date and campaign.start_date > current_date:
                continue
            
            filtered_campaigns.append({
                "relation": relation,
                "campaign": campaign
            })
        
        # Format data for response
        data = []
        for item in filtered_campaigns:
            campaign = item["campaign"]
            relation = item["relation"]
            
            # Get all courses for this campaign
            campaign_courses = list(campaign.courses.all())
            
            # If no courses, skip this campaign
            if not campaign_courses:
                continue
                
            # Prepare list of course data and track completion
            courses_data = []
            completed_courses_count = 0

            for course in campaign_courses:
                # Check course completion status from UserCourseProgress
                try:
                    progress_record = UserCourseProgress.objects.get(
                        campaign_user=relation,
                        course=course
                    )
                    is_completed = progress_record.completed
                except UserCourseProgress.DoesNotExist:
                    is_completed = False
                
                if is_completed:
                    completed_courses_count += 1

                # Get course details
                course_data = {
                    "id": str(course.id),
                    "title": course.name,
                    "description": course.description or "",
                    "thumbnail": request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else "",
                    "video": request.build_absolute_uri(course.video.url) if course.video else "",
                    "completed": is_completed
                }
                courses_data.append(course_data)
            
            # Calculate campaign progress
            total_courses_count = len(campaign_courses)
            campaign_progress = 0
            if total_courses_count > 0:
                campaign_progress = int((completed_courses_count / total_courses_count) * 100)

            # The campaign is considered completed if:
            #   1. All courses are completed, OR
            #   2. The campaign has expired (end_date < today)
            is_fully_completed = total_courses_count > 0 and completed_courses_count == total_courses_count
            is_expired = campaign.end_date is not None and campaign.end_date < current_date

            campaign_completed = is_fully_completed or is_expired

            # Certificate should be available only when fully completed.
            certificate_available = is_fully_completed
            
            # Format campaign data with multiple courses
            campaign_data = {
                "id": str(campaign.id),
                "title": campaign.name,
                "description": courses_data[0]["description"] if courses_data else "",
                "dueDate": campaign.end_date.strftime("%Y-%m-%d") if campaign.end_date else "",
                "progress": campaign_progress,
                "completed": campaign_completed,
                "certificateAvailable": certificate_available,
                "courses": courses_data,
                "totalCourses": total_courses_count,
                "completedCourses": completed_courses_count,
            }
            data.append(campaign_data)
        
        return Response(data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_course_completed(request):
    """API endpoint to mark a course as completed for the current user."""
    user = request.user
    
    try:
        data = request.data
        campaign_id = data.get('campaign_id')
        course_id = data.get('course_id')
        
        if not campaign_id or not course_id:
            return Response({"error": "Campaign ID and Course ID are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the specific campaign-user relation
        campaign_user = LMSCampaignUser.objects.get(user=user, campaign_id=campaign_id)
        
        # Get the course
        course = Course.objects.get(id=course_id)
        
        # Create or update the progress record
        progress, created = UserCourseProgress.objects.update_or_create(
            campaign_user=campaign_user,
            course=course,
            defaults={'completed': True, 'completed_at': timezone.now()}
        )

        # Mark campaign as started on first completed course
        if not campaign_user.started:
            campaign_user.started = True
            campaign_user.started_at = timezone.now()
            campaign_user.save(update_fields=['started', 'started_at'])

        # After marking a course as complete, check if the whole campaign is complete
        all_courses_in_campaign = campaign_user.campaign.courses.all()
        
        # Count completed courses for this user in this campaign
        completed_courses_count = UserCourseProgress.objects.filter(
            campaign_user=campaign_user,
            completed=True
        ).count()

        if all_courses_in_campaign.count() > 0 and all_courses_in_campaign.count() == completed_courses_count:
            campaign_user.completed = True
            campaign_user.completed_at = timezone.now()
            campaign_user.save()

        return Response({"success": True, "message": "Course marked as completed."}, status=status.HTTP_200_OK)
        
    except LMSCampaignUser.DoesNotExist:
        return Response({"error": "You are not enrolled in this campaign."}, status=status.HTTP_404_NOT_FOUND)
    except Course.DoesNotExist:
        return Response({"error": "Course not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lms_analytics_overview(request):
    """API endpoint to provide aggregated LMS analytics data for the current user's company."""
    user = request.user
    company = user.company

    # -------- New: optional date-range filtering --------
    from django.utils import timezone
    from datetime import timedelta

    time_range_param = request.GET.get('range', '6months')
    end_date = timezone.now().date()

    if time_range_param == '3months':
        start_date = end_date - timedelta(days=3 * 30)
    elif time_range_param == '1year':
        start_date = end_date - timedelta(days=365)
    else:  # default 6 months
        start_date = end_date - timedelta(days=6 * 30)
    # ---------------------------------------------------

    try:
        # All campaigns for this company
        campaigns_qs = LMSCampaign.objects.filter(company=company, start_date__gte=start_date)

        # Build list of course counts per campaign
        campaign_course_counts = [
            {
                'campaign_id': str(campaign.id),
                'campaign_name': campaign.name,
                'courses_count': campaign.courses.count(),
            }
            for campaign in campaigns_qs
        ]

        # Progress records for this company
        progress_qs = UserCourseProgress.objects.filter(
            campaign_user__campaign__company=company,
            campaign_user__campaign__start_date__gte=start_date,
        )

        # Restrict to completed progress records
        progress_completed_qs = progress_qs.filter(completed=True)
        
        # Total number of progress records and number of completed ones
        total_progress = progress_qs.count()
        completed_progress = progress_completed_qs.count()

        # Total views equals number of COMPLETED progress records as requested
        total_views = completed_progress

        # Average completion = completed progress / total progress (%). Avoid divide-by-zero.
        average_completion_value = 0
        if total_progress > 0:
            average_completion_value = round((completed_progress / total_progress) * 100, 2)

        # Total distinct enrolled users across campaigns (for dashboard)
        participants_count = (
            LMSCampaignUser.objects
            .filter(
                campaign__company=company,
                campaign__start_date__gte=start_date,
            )
            .values('user')
            .distinct()
            .count()
        )

        # Top videos with new completion metric (completed progress / total progress per course)
        top_course_stats = (
            progress_completed_qs
            .values('course__id', 'course__name')
            .annotate(views=Count('id'))
            .order_by('-views')[:3]
        )

        top_videos = []
        for stat in top_course_stats:
            course_id = stat['course__id']
            completed_views = stat['views']  # from progress_completed_qs
            total_course_progress = progress_qs.filter(course_id=course_id).count()

            percentage = 0
            if total_course_progress > 0:
                percentage = round((completed_views / total_course_progress) * 100, 2)

            top_videos.append({
                'title': stat['course__name'],
                'views': completed_views,
                'completion': percentage,
            })

        data = {
            'campaign_course_counts': campaign_course_counts,
            'campaigns_count': campaigns_qs.count(),
            'enrolled_users': participants_count,
            'total_views': total_views,
            'average_completion': average_completion_value,
            'top_videos': top_videos,
            'participation_total': total_progress,
        }
        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lms_training_results(request):
    """API endpoint to get aggregated training results by campaign."""
    user = request.user
    company = user.company
    if not company:
        return Response({"error": "User does not belong to any company"}, status=status.HTTP_400_BAD_REQUEST)

    # Get all campaigns for the company
    campaigns = LMSCampaign.objects.filter(company=company)

    chart_data = []
    for campaign in campaigns:
        # Get all users for this campaign
        campaign_users = LMSCampaignUser.objects.filter(campaign=campaign)
        
        total_users = campaign_users.count()
        if total_users == 0:
            continue

        completed_count = campaign_users.filter(completed=True).count()
        in_progress_count = campaign_users.filter(started=True, completed=False).count()
        not_started_count = total_users - completed_count - in_progress_count

        chart_data.append({
            "campaign": campaign.name,
            "completed": completed_count,
            "inProgress": in_progress_count,
            "notStarted": not_started_count,
        })

    return Response(chart_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_certificates(request):
    """Return certificates (completed campaign-user relations) for the current company.

    Each item in the response corresponds to a user who has completed an LMS
    campaign, meaning a certificate can be issued.  Super-admins may pass a
    ?company_id=<id> query param to fetch certificates for any company; regular
    users are limited to their own company.
    """
    user = request.user

    # Determine company context
    company = user.company
    is_super_admin = False
    if hasattr(user, 'role'):
        is_super_admin = user.role == 'SUPER_ADMIN'
    elif hasattr(user, 'is_superuser'):
        is_super_admin = bool(user.is_superuser)

    if is_super_admin and request.GET.get('company_id'):
        try:
            company = Company.objects.get(id=request.GET['company_id'])
        except Company.DoesNotExist:
            company = None

    # Without a valid company we return an empty list (avoids leaking data)
    if not company:
        return Response([], status=status.HTTP_200_OK)

    # Fetch all completed campaign↔user relations for this company
    relations_qs = LMSCampaignUser.objects.filter(
        campaign__company=company,
        completed=True
    ).select_related('user', 'campaign')

    certificates = [
        {
            'id': str(rel.id),
            'title': rel.campaign.name,
            'userName': rel.user.get_full_name() or rel.user.username or rel.user.email,
            'completionDate': rel.completed_at.date().isoformat() if rel.completed_at else '',
        }
        for rel in relations_qs
    ]

    return Response(certificates, status=status.HTTP_200_OK)


# ------------------ Certificate Download ------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_certificate(request, certificate_id):
    """Generate a simple PDF certificate for the given completed campaign-user relation (certificate)."""
    # Ensure ReportLab is available
    if FPDF is None or BytesIO is None:
        return Response({'error': 'PDF library not installed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        cert = LMSCampaignUser.objects.select_related('user', 'campaign').get(id=certificate_id, completed=True)
    except LMSCampaignUser.DoesNotExist:
        return Response({'error': 'Certificate not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Authorization: Only the owner or company staff/super admin can download
    user = request.user
    is_super_admin = getattr(user, 'role', '') == 'SUPER_ADMIN' or getattr(user, 'is_superuser', False)
    if not (is_super_admin or cert.user == user or (user.company and user.company == cert.campaign.company)):
        return Response({'error': 'Not authorized to download this certificate.'}, status=status.HTTP_403_FORBIDDEN)

    pdf = FPDF(orientation='P', unit='pt', format='letter')
    pdf.add_page()

    page_width = pdf.w
    page_height = pdf.h
    # Background fill (light gradient substitute)
    pdf.set_fill_color(245, 248, 255)  # light bluish background
    pdf.rect(30, 30, page_width-60, page_height-60, 'F')
    # Border line
    pdf.set_draw_color(200, 200, 200)
    pdf.rect(30, 30, page_width-60, page_height-60)

    # Logo image (if exists)
    import os
    from django.conf import settings
    logo_path = os.path.normpath(os.path.join(settings.BASE_DIR, '..', 'public', 'lovable-uploads', '876a553e-d478-4016-a8f0-1580f492ca19.png'))
    if os.path.exists(logo_path):
        pdf.image(logo_path, x=(page_width/2)-25, y=60, w=50)

    # Platform name & tagline under logo
    pdf.set_y(120)
    pdf.set_font('helvetica', 'B', 18)
    pdf.cell(0, 24, 'CSWORD', 0, 1, 'C')
    pdf.set_font('helvetica', '', 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 16, 'Security Awareness Platform', 0, 1, 'C')
    pdf.set_text_color(0,0,0)

    current_y = pdf.get_y() + 30

    # Helper to strip/replace characters not supported by standard PDF-14 fonts (Latin-1 only)
    def _latin1_safe(txt: str) -> str:
        try:
            txt.encode('latin-1')
            return txt
        except UnicodeEncodeError:
            return txt.encode('latin-1', 'replace').decode('latin-1')

    full_name_safe = _latin1_safe(cert.user.get_full_name() or cert.user.username or cert.user.email)
    campaign_name_safe = _latin1_safe(cert.campaign.name)

    # Title
    pdf.set_y(current_y)
    pdf.set_font('helvetica', 'B', 24)
    pdf.cell(0, 30, 'Certificate of Completion', 0, 1, 'C')
    pdf.set_line_width(0.3)
    pdf.set_draw_color(210,210,210)
    pdf.line(60, pdf.get_y(), page_width-60, pdf.get_y())
    pdf.ln(10)

    # Subtitle
    pdf.set_font('helvetica', '', 14)
    pdf.cell(0, 30, 'This certifies that', 0, 1, 'C')

    # Recipient name
    pdf.set_font('helvetica', 'B', 18)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(0, 36, full_name_safe, 0, 1, 'C')
    pdf.set_text_color(0,0,0)

    # Course title
    pdf.set_font('helvetica', '', 14)
    pdf.cell(0, 30, 'has successfully completed the', 0, 1, 'C')

    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(50,50,50)
    pdf.multi_cell(0, 28, campaign_name_safe, 0, 'C')
    pdf.set_text_color(0,0,0)

    # Completion date
    completed_date = cert.completed_at.date().strftime('%B %d, %Y') if cert.completed_at else ''
    pdf.set_font('helvetica', '', 14)
    pdf.ln(5)
    pdf.set_x(0)
    pdf.multi_cell(0, 20, f'Completed on {completed_date}', 0, 'C')



    # Footer lines (signature placeholders)
    pdf.ln(30)
    pdf.set_draw_color(180,180,180)
    start_x = 120
    sig_width = 120
    pdf.line(start_x, pdf.get_y(), start_x+sig_width, pdf.get_y())
    pdf.line(page_width-start_x-sig_width, pdf.get_y(), page_width-start_x, pdf.get_y())

    pdf.set_y(pdf.get_y()+4)
    pdf.set_font('helvetica','',10)
    pdf.cell(start_x)
    pdf.cell(sig_width,5,'Director Signature',0,0,'C')
    pdf.cell(page_width-2*start_x-2*sig_width)
    pdf.cell(sig_width,5,'Date',0,1,'C')

    # --- Export PDF bytes (after all drawing) ---
    try:
        pdf_raw = pdf.output(dest='S')
    except Exception as pdf_err:
        import logging
        logging.exception("FPDF generation failed: %s", pdf_err)
        return Response({'error': 'Certificate generation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Convert to bytes if needed

    if isinstance(pdf_raw, str):
        pdf_raw = pdf_raw.encode('latin1')
    elif isinstance(pdf_raw, bytearray):
        pdf_raw = bytes(pdf_raw)

    from django.http import FileResponse
    response = FileResponse(BytesIO(pdf_raw), content_type='application/pdf', as_attachment=True, filename=f'certificate_{certificate_id}.pdf')
    return response
