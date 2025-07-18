import os
import pandas as pd
from django.conf import settings
from .ai_utils import (
    generate_analysis, get_kpi_analysis_prompt, get_department_analysis_prompt,
    get_trend_analysis_prompt, get_group_analysis_prompt, get_conclusion_prompt,
    get_recommendation_prompt, get_how_csword_helps_prompt, get_intro_prompt
)
from .visualizations import create_trend_chart, create_group_assessment_chart
from .pdf_generator import build_pdf
from .ai_report_utils import convert_campaigns_to_mockup_format
from .ai_report_config import *


def generate_ai_phishing_report(kpi_data, company_name, report_id):
    """
    Generate AI-powered phishing report with PDF output
    
    Args:
        kpi_data: Dictionary containing campaign data in mockup format
        company_name: Name of the company
        report_id: Unique identifier for the report
    
    Returns:
        tuple: (pdf_file_path, analysis_data)
    """
    
    try:
        print(f"Starting AI report generation for {company_name}...")
        
        # Create department stats DataFrame
        department_stats = pd.DataFrame.from_dict(kpi_data["dep_stats"])
        
        # Create weekly stats DataFrame
        weekly_stats = pd.DataFrame.from_dict(kpi_data["weekly_stats"])
        weekly_stats.index = pd.to_datetime(weekly_stats.index)
        
        # Create group stats DataFrame
        group_stats = pd.DataFrame.from_dict(kpi_data["group_stats"])
        
        # Generate visualizations
        print("Creating visualizations...")
        trend_chart_img = create_trend_chart(kpi_data["weekly_stats"])
        group_chart_img = create_group_assessment_chart(kpi_data["group_stats"])
        
        # Generate AI analysis
        print("Generating AI analysis...")
        
        # KPI Analysis
        kpi_analysis_prompt = get_kpi_analysis_prompt(kpi_data, company_name)
        kpi_analysis = generate_analysis(kpi_analysis_prompt, thinking=True)
        
        # Department Analysis
        department_analysis_prompt = get_department_analysis_prompt(department_stats, company_name)
        department_analysis = generate_analysis(department_analysis_prompt, thinking=True)
        
        # Trend Analysis
        trend_analysis_prompt = get_trend_analysis_prompt(company_name)
        analysis_trend = generate_analysis(trend_analysis_prompt, thinking=True, images=[trend_chart_img.getvalue()])
        
        # Group Analysis
        group_analysis_prompt = get_group_analysis_prompt(company_name)
        analysis_group = generate_analysis(group_analysis_prompt, thinking=True, images=[group_chart_img.getvalue()])
        
        # Conclusion
        conclusion_prompt = get_conclusion_prompt(kpi_analysis.text, analysis_trend.text, analysis_group.text, company_name)
        conclusion_ = generate_analysis(conclusion_prompt, thinking=True)
        
        # Recommendations
        recommendation_prompt = get_recommendation_prompt(conclusion_.text, kpi_analysis.text, analysis_trend.text, analysis_group.text, company_name)
        recomendation_ = generate_analysis(recommendation_prompt, thinking=True)
        
        # CSword Solutions
        how_csword_helps_prompt = get_how_csword_helps_prompt(recomendation_.text, company_name)
        how_csword_helps_ = generate_analysis(how_csword_helps_prompt, thinking=True)
        
        # Executive Summary
        intro_prompt = get_intro_prompt(conclusion_.text, recomendation_.text, how_csword_helps_.text, kpi_analysis.text, analysis_trend.text, analysis_group.text, company_name)
        intro = generate_analysis(intro_prompt, thinking=True, images=[trend_chart_img.getvalue(), group_chart_img.getvalue()])
        
        # Create output directory
        reports_dir = os.path.join(settings.MEDIA_ROOT, 'ai_reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        # Build PDF
        print("Building PDF report...")
        pdf_path = build_pdf(
            kpis=kpi_data,
            kpis_analysis=kpi_analysis.text,
            trend_chart_img=trend_chart_img,
            analysis_trend=analysis_trend.text,
            group_chart_img=group_chart_img,
            analysis_group=analysis_group.text,
            department_stats=department_stats,
            department_analysis=department_analysis.text,
            intro_summary=intro.text,
            conclusion=conclusion_.text,
            recomendation=recomendation_.text,
            how_csword_helps_text=how_csword_helps_.text,
            company_name=company_name,
            start_date=kpi_data["start_date"],
            end_date=kpi_data["end_date"],
            output_dir=reports_dir
        )
        
        # Prepare analysis data for storage
        analysis_data = {
            'kpi_analysis': kpi_analysis.text,
            'department_analysis': department_analysis.text,
            'trend_analysis': analysis_trend.text,
            'group_analysis': analysis_group.text,
            'conclusion': conclusion_.text,
            'recommendations': recomendation_.text,
            'csword_solutions': how_csword_helps_.text,
            'executive_summary': intro.text,
            'kpi_data': kpi_data
        }
        
        print(f"AI report generated successfully: {pdf_path}")
        return pdf_path, analysis_data
        
    except Exception as e:
        print(f"Error generating AI report: {str(e)}")
        raise e