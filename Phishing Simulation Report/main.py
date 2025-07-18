# main.py

from dotenv import load_dotenv
import pandas as pd
import json

# Import functions from our new modules
from data_processing import generate_dummy_data, calculate_kpis, calculate_departmental_stats
from visualizations import create_trend_chart, create_group_assessment_chart
from pdf_generator import build_pdf
# Import the AI and prompt functions
from ai_utils import (
    generate_analysis, get_kpi_analysis_prompt, get_department_analysis_prompt,
    get_trend_analysis_prompt, get_group_analysis_prompt, get_conclusion_prompt,
    get_recommendation_prompt, get_how_csword_helps_prompt, get_intro_prompt
)
# Import the separate config file
import config
import os
import sys
# Load environment variables (e.g., for GEMINI_API_KEY)
load_dotenv()

if __name__ == '__main__':
    # main_df = pd.read_json("Data/data.json", orient='records')
    # kpi_results = calculate_kpis(main_df)
    # department_stats = calculate_departmental_stats(main_df)
    
    # start_date_obj = main_df['Date'].min()
    # end_date_obj = main_df['Date'].max()

    # # 3. Format the dates into nice strings for the report title
    # report_start_date = start_date_obj.strftime("%B %d, %Y") # e.g., "May 03, 2025"
    # report_end_date = end_date_obj.strftime("%B %d, %Y")   # e.g., "June 28, 2025"
    
    # print("Creating charts with new design...")
    # trend_chart_img = create_trend_chart(main_df)
    # group_chart_img = create_group_assessment_chart(main_df)
    
    
    with open("Data/data.json", 'r') as f:
        kpi_results = json.load(f)
        
    target_company_name = kpi_results["org_name"]
    
    
    report_start_date = kpi_results["start_date"]
    report_end_date = kpi_results["end_date"]
    
    start_date_ = report_start_date.replace(" ","_")
    start_date_ = start_date_.replace(",","")
    end_date_ = report_end_date.replace(" ","_")
    end_date_ = end_date_.replace(",","")
    
    file_name = f"{target_company_name}_Reports/{target_company_name}_{start_date_}_{end_date_}.pdf"
    
    if os.path.exists(file_name):
        # Print a helpful message showing which file was found
        print(f"Report '{target_company_name}_{start_date_}_{end_date_}' already exists. Exiting script.")
        # Exit the program
        sys.exit()
    else:
        print(f"File: {file_name} doesn't exist, creating report")
        
    department_stats = pd.DataFrame.from_dict(kpi_results["dep_stats"])
    
    
    weekly_stats = pd.DataFrame.from_dict(kpi_results["weekly_stats"])
    # 2. Convert the index to a proper DatetimeIndex
    weekly_stats.index = pd.to_datetime(weekly_stats.index)
    
    group_stats = pd.DataFrame.from_dict(kpi_results["group_stats"])
    
    trend_chart_img = create_trend_chart(weekly_stats)
    group_chart_img = create_group_assessment_chart(group_stats)

    print("Generating AI analysis...")
    
    # Get prompts from ai_utils and generate content
    kpi_analysis_prompt = get_kpi_analysis_prompt(kpi_results, target_company_name)
    kpi_analysis = generate_analysis(kpi_analysis_prompt, thinking=True)
    
    department_analysis_prompt = get_department_analysis_prompt(department_stats, target_company_name)
    department_analysis = generate_analysis(department_analysis_prompt, thinking=True)
    
    trend_analysis_prompt = get_trend_analysis_prompt(target_company_name)
    analysis_trend = generate_analysis(trend_analysis_prompt, thinking=True, images=[trend_chart_img.getvalue()])

    group_analysis_prompt = get_group_analysis_prompt(target_company_name)
    analysis_group = generate_analysis(group_analysis_prompt, thinking=True, images=[group_chart_img.getvalue()])
    
    conclusion_prompt = get_conclusion_prompt(kpi_analysis.text, analysis_trend.text, analysis_group.text, target_company_name)
    conclusion_ = generate_analysis(conclusion_prompt, thinking=True)

    recommendation_prompt = get_recommendation_prompt(conclusion_.text, kpi_analysis.text, analysis_trend.text, analysis_group.text, target_company_name)
    recomendation_ = generate_analysis(recommendation_prompt, thinking=True)
    
    
    how_csword_helps_prompt = get_how_csword_helps_prompt(recomendation_.text, target_company_name)
    how_csword_helps_ = generate_analysis(how_csword_helps_prompt, thinking=True)
    
    intro_prompt = get_intro_prompt(conclusion_.text, recomendation_.text, how_csword_helps_.text, kpi_analysis.text, analysis_trend.text, analysis_group.text, target_company_name)
    intro = generate_analysis(intro_prompt, thinking=True, images=[trend_chart_img.getvalue(), group_chart_img.getvalue()])
    
    print("\nAssembling the final PDF report with new design...")
    build_pdf(
        kpis=kpi_results,
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
        company_name=target_company_name,
        start_date=report_start_date,
        end_date=report_end_date
    )

    print(f"\nSuccessfully created Report")