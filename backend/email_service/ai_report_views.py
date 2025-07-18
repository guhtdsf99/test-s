import os
import threading
from django.http import FileResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .ai_report_models import AIPhishingReport
from .ai_report_utils import (
    get_finished_campaigns_data, convert_campaigns_to_mockup_format,
    check_if_new_report_needed, generate_report_name
)
from .ai_report_generator import generate_ai_phishing_report


def generate_report_async(report_id, kpi_data, company_name):
    """Generate report asynchronously"""
    try:
        report = AIPhishingReport.objects.get(id=report_id)
        
        # Generate the AI report
        pdf_path, analysis_data = generate_ai_phishing_report(kpi_data, company_name, str(report_id))
        
        # Update the report with results
        report.analysis_data = analysis_data
        report.mark_completed(pdf_path)
        
        print(f"Report {report_id} generated successfully")
        
    except Exception as e:
        print(f"Error generating report {report_id}: {str(e)}")
        try:
            report = AIPhishingReport.objects.get(id=report_id)
            report.mark_failed()
        except:
            pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_ai_report(request):
    """Generate or retrieve existing AI report"""
    
    user = request.user
    company = user.company
    
    if not company:
        return Response(
            {"error": "User does not belong to any company"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        print(f"Generating AI report for company: {company.name}")
        
        # Check if new report is needed
        needs_new_report, data, message = check_if_new_report_needed(company)
        print(f"New report needed: {needs_new_report}, Message: {message}")
        
        if not needs_new_report:
            if isinstance(data, AIPhishingReport):
                # Return existing report
                print(f"Returning existing report: {data.report_name}")
                return Response({
                    "report_id": str(data.id),
                    "report_name": data.report_name,
                    "status": data.status,
                    "campaigns_count": data.campaigns_count,
                    "start_date": data.start_date,
                    "end_date": data.end_date,
                    "created_at": data.created_at,
                    "completed_at": data.completed_at,
                    "pdf_available": bool(data.pdf_file_path),
                    "message": message
                })
            else:
                return Response(
                    {"error": message}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get campaign data
        finished_campaigns, emails = get_finished_campaigns_data(company)
        if not finished_campaigns:
            return Response(
                {"error": emails}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"Found {finished_campaigns.count()} finished campaigns")
        
        # Convert to mockup format
        kpi_data = convert_campaigns_to_mockup_format(company, finished_campaigns, emails)
        
        print(f"KPI Data Summary:")
        print(f"- Total Campaigns: {kpi_data['total_campaigns']}")
        print(f"- Total Emails: {kpi_data['total_emails']}")
        print(f"- Click Rate: {kpi_data['avg_click_rate']:.2%}")
        print(f"- Report Rate: {kpi_data['avg_report_rate']:.2%}")
        
        # Generate report name
        start_date = finished_campaigns.first().start_date
        end_date = finished_campaigns.last().end_date
        report_name = generate_report_name(company, start_date, end_date)
        
        # Create report record
        report = AIPhishingReport.objects.create(
            company=company,
            report_name=report_name,
            campaigns_count=finished_campaigns.count(),
            start_date=start_date,
            end_date=end_date,
            status='generating'
        )
        
        print(f"Created report record: {report.report_name}")
        
        # Start async generation
        thread = threading.Thread(
            target=generate_report_async,
            args=(str(report.id), kpi_data, company.name)
        )
        thread.daemon = True
        thread.start()
        
        return Response({
            "report_id": str(report.id),
            "report_name": report.report_name,
            "status": report.status,
            "campaigns_count": report.campaigns_count,
            "start_date": report.start_date,
            "end_date": report.end_date,
            "created_at": report.created_at,
            "completed_at": report.completed_at,
            "pdf_available": bool(report.pdf_file_path),
            "message": "Report generation started"
        })
        
    except Exception as e:
        print(f"Error in generate_ai_report: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to generate report: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_status(request, report_id):
    """Get the status of a report generation"""
    
    user = request.user
    company = user.company
    
    if not company:
        return Response(
            {"error": "User does not belong to any company"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        report = AIPhishingReport.objects.get(
            id=report_id,
            company=company
        )
        
        return Response({
            "report_id": str(report.id),
            "status": report.status,
            "created_at": report.created_at,
            "completed_at": report.completed_at,
            "pdf_available": bool(report.pdf_file_path),
            "report_name": report.report_name
        })
        
    except AIPhishingReport.DoesNotExist:
        return Response(
            {"error": "Report not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_ai_report(request, report_id):
    """Download the generated AI report PDF"""
    
    user = request.user
    company = user.company
    
    if not company:
        return Response(
            {"error": "User does not belong to any company"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        report = AIPhishingReport.objects.get(
            id=report_id,
            company=company,
            status='completed'
        )
        
        if not report.pdf_file_path or not os.path.exists(report.pdf_file_path):
            return Response(
                {"error": "Report PDF not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return the PDF file
        response = FileResponse(
            open(report.pdf_file_path, 'rb'),
            content_type='application/pdf',
            filename=f"{report.report_name}.pdf"
        )
        
        return response
        
    except AIPhishingReport.DoesNotExist:
        return Response(
            {"error": "Report not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to download report: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_ai_reports(request):
    """List all AI reports for the company"""
    
    user = request.user
    company = user.company
    
    if not company:
        return Response(
            {"error": "User does not belong to any company"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    reports = AIPhishingReport.objects.filter(company=company).order_by('-created_at')
    
    reports_data = []
    for report in reports:
        reports_data.append({
            "report_id": str(report.id),
            "report_name": report.report_name,
            "status": report.status,
            "campaigns_count": report.campaigns_count,
            "start_date": report.start_date,
            "end_date": report.end_date,
            "created_at": report.created_at,
            "completed_at": report.completed_at,
            "pdf_available": bool(report.pdf_file_path)
        })
    
    return Response(reports_data)