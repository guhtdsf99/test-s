import datetime
import markdown
import os
from pathlib import Path
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, Flowable, PageBreak,
    PageTemplate, BaseDocTemplate, Frame, NextPageTemplate
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.tables import TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib import colors
import pandas as pd

# Configuration constants - matching original system
BRAND_COLOR = colors.Color(54/255, 75/255, 130/255)  # #364b82
ACCENT_RED = colors.Color(230/255, 57/255, 70/255)  # #E63946
ACCENT_GREEN = colors.Color(42/255, 157/255, 143/255)  # #2A9D8F
TEXT_COLOR_DARK = colors.Color(34/255, 34/255, 34/255)  # #222222
TEXT_COLOR_LIGHT = colors.Color(102/255, 102/255, 102/255)  # #666666
BACKGROUND_COLOR_LIGHT = colors.Color(244/255, 246/255, 247/255)  # #F4F6F7
BORDER_COLOR = colors.Color(221/255, 221/255, 221/255)  # #DDDDDD


def add_markdown_to_story(text_content, story_list, base_style):
    """Add markdown content to story list"""
    bullet_style = ParagraphStyle(
        name='BulletBody',
        parent=base_style,
        leftIndent=20,
        firstLineIndent=0,
    )
    nested_bullet_style = ParagraphStyle(
        name='NestedBulletBody',
        parent=bullet_style,
        leftIndent=40,
    )
    lines = [line for line in text_content.strip().split('\n') if line.strip()]
    for line in lines:
        stripped_line = line.lstrip()
        content = markdown.markdown(stripped_line).strip().replace('<p>', '').replace('</p>', '')
        if stripped_line.startswith(('* ', '- ', '+ ')):
            bullet_content = "• " + markdown.markdown(stripped_line[2:]).strip().replace('<p>', '').replace('</p>', '')
            indent_level = len(line) - len(stripped_line)
            p = Paragraph(bullet_content, nested_bullet_style if indent_level > 1 else bullet_style)
            story_list.append(p)
        else:
            p = Paragraph(content, base_style)
            story_list.append(p)


class HRFlowable(Flowable):
    """Horizontal rule flowable"""
    def __init__(self, width, thickness=1, color=colors.black):
        Flowable.__init__(self)
        self.width = width
        self.thickness = thickness
        self.color = color
    
    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)


class ReportDocTemplate(BaseDocTemplate):
    """Custom document template for reports"""
    def __init__(self, filename, **kw):
        self.allowSplitting = 0
        BaseDocTemplate.__init__(self, filename, **kw)
        
        cover_frame = Frame(1 * inch, 1 * inch, 6.5*inch, 9*inch, id='cover_frame')
        cover_template = PageTemplate(id='cover', frames=[cover_frame], onPage=kw["onPage_cover"])
        
        frame_width = (8.5 * inch) - (2 * inch)
        frame_height = (11 * inch) - (1 * inch) - (1 * inch)
        main_frame = Frame(1 * inch, 1 * inch, frame_width, frame_height, id='main_frame')
        main_template = PageTemplate(id='main', frames=[main_frame], onPage=kw['onPage'])
        self.addPageTemplates([cover_template, main_template])
    
    def afterFlowable(self, flowable):
        if flowable.__class__.__name__ == 'Paragraph':
            text = flowable.getPlainText()
            style = flowable.style.name
            if style == 'Heading2':
                self.notify('TOCEntry', (0, text, self.page))


def build_pdf(kpis, kpis_analysis, trend_chart_img, analysis_trend, group_chart_img, analysis_group, 
              department_stats, department_analysis, intro_summary, conclusion, recomendation, 
              how_csword_helps_text, company_name, start_date, end_date, output_dir):
    """Build the PDF report"""
    
    def cover_page(canvas, doc):
        y_pos_header = (doc.pagesize[1]/2) + 2.05 * inch
        
        # Try to add CSword logo
        try:
            # Look for logo in static directory first
            logo_paths = [
                os.path.join(os.path.dirname(__file__), '..', 'static', 'images', 'cs-logo.png'),
                'backend/static/images/cs-logo.png',
                os.path.join(output_dir, 'cs-logo.png'),
                'backend/media/cs-logo.png',
                'backend/static/cs-logo.png'
            ]
            logo_path = None
            for path in logo_paths:
                abs_path = os.path.abspath(path)
                if os.path.exists(abs_path):
                    logo_path = abs_path
                    break
            
            if logo_path:
                cs_logo = Image(logo_path, width=1.8*inch, height=0.6*inch)
                cs_logo.preserveAspectRatio = True
                cs_logo.drawOn(canvas, (doc.pagesize[0]/2)-(0.9*inch), y_pos_header)
                print(f"✅ CSword logo loaded from: {logo_path}")
            else:
                canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_header + 0.2*inch, "CSword Logo")
                print("⚠️ CSword logo not found, using text placeholder")
        except Exception as e:
            print(f"Could not load CSword logo: {e}")
            canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_header + 0.2*inch, "CSword Logo")
    
    def draw_header_and_footer(canvas, doc):
        canvas.saveState()
        y_pos_header = doc.pagesize[1] - 1.0 * inch
        
        # Try to add company logo (from company's uploaded logo)
        try:
            # First try to get company logo from media directory
            from accounts.models import Company
            try:
                company_obj = Company.objects.get(name=company_name)
                if company_obj.company_logo:
                    company_logo_path = company_obj.company_logo.path
                    if os.path.exists(company_logo_path):
                        logo = Image(company_logo_path, width=1.2*inch, height=0.4*inch)
                        logo.preserveAspectRatio = True
                        logo.drawOn(canvas, doc.leftMargin, y_pos_header)
                    else:
                        canvas.drawString(doc.leftMargin, y_pos_header + 0.2*inch, f"{company_name} Logo")
                else:
                    canvas.drawString(doc.leftMargin, y_pos_header + 0.2*inch, f"{company_name} Logo")
            except Company.DoesNotExist:
                canvas.drawString(doc.leftMargin, y_pos_header + 0.2*inch, f"{company_name} Logo")
        except Exception as e:
            print(f"Could not load company logo: {e}")
            canvas.drawString(doc.leftMargin, y_pos_header + 0.2*inch, f"{company_name} Logo")
        
        # Try to add CSword logo
        try:
            logo_paths = [
                os.path.join(os.path.dirname(__file__), '..', 'static', 'images', 'cs-logo.png'),
                'backend/static/images/cs-logo.png',
                os.path.join(output_dir, 'cs-logo.png'),
                'backend/media/cs-logo.png',
                'backend/static/cs-logo.png'
            ]
            logo_path = None
            for path in logo_paths:
                abs_path = os.path.abspath(path)
                if os.path.exists(abs_path):
                    logo_path = abs_path
                    break
            
            if logo_path:
                cs_logo = Image(logo_path, width=1.2*inch, height=0.4*inch)
                cs_logo.preserveAspectRatio = True
                cs_logo.drawOn(canvas, doc.pagesize[0] - doc.rightMargin - 1.2*inch, y_pos_header)
                print(f"✅ CSword header logo loaded from: {logo_path}")
            else:
                canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_header + 0.2*inch, "CSword Logo")
                print("⚠️ CSword header logo not found, using text placeholder")
        except Exception as e:
            print(f"Could not load CSword header logo: {e}")
            canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_header + 0.2*inch, "CSword Logo")
        
        canvas.setStrokeColor(BORDER_COLOR)
        canvas.setLineWidth(1)
        y_line = doc.pagesize[1] - 1.2 * inch
        canvas.line(doc.leftMargin, y_line, doc.pagesize[0] - doc.rightMargin, y_line)
        
        canvas.setStrokeColor(BORDER_COLOR)
        canvas.setLineWidth(1)
        y_line_ = 0.7 * inch
        canvas.line(doc.leftMargin, y_line_, doc.pagesize[0] - doc.rightMargin, y_line_)
        
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.grey)
        y_pos_footer = 0.5 * inch
        copyright_text = f"© {datetime.date.today().year} CSword. All Rights Reserved."
        canvas.drawString(doc.leftMargin, y_pos_footer, copyright_text)
        report_date = datetime.date.today().strftime("%B %d, %Y")
        canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_footer, report_date)
        page_number_text = f"Page {canvas.getPageNumber()}"
        canvas.drawCentredString(doc.pagesize[0] / 2.0, y_pos_footer, page_number_text)
        canvas.restoreState()
    
    # Create output directory
    folder_path = Path(output_dir)
    folder_path.mkdir(parents=True, exist_ok=True)
    
    start_date_ = start_date.replace(" ", "_").replace(",", "")
    end_date_ = end_date.replace(" ", "_").replace(",", "")
    
    pdf_filename = f"{company_name}_{start_date_}_{end_date_}.pdf"
    pdf_path = folder_path / pdf_filename
    
    doc = ReportDocTemplate(str(pdf_path), onPage=draw_header_and_footer, onPage_cover=cover_page)
    
    styles = getSampleStyleSheet()
    title_ = ParagraphStyle(name='Heading1', fontSize=30, leading=30, spaceAfter=10, textColor=BRAND_COLOR, fontName='Helvetica-Bold', alignment=TA_CENTER)
    h1 = ParagraphStyle(name='Heading1', fontSize=24, leading=30, spaceAfter=18, textColor=BRAND_COLOR, fontName='Helvetica-Bold', alignment=TA_CENTER)
    cover_date_style = ParagraphStyle(name='CoverDate', fontSize=12, leading=18, textColor=colors.darkgrey, fontName='Helvetica', alignment=TA_CENTER)
    h2 = ParagraphStyle(name='Heading2', fontSize=16, leading=20, spaceAfter=12, textColor=BRAND_COLOR, fontName='Helvetica-Bold')
    body_style = ParagraphStyle(name='Body', parent=styles['BodyText'], fontSize=10, leading=15, textColor=TEXT_COLOR_DARK, spaceAfter=12, alignment=TA_JUSTIFY)
    closing_style = ParagraphStyle(name='Closing', parent=body_style, fontName='Helvetica-Oblique', alignment=TA_CENTER, spaceAfter=12)
    kpi_title_style = ParagraphStyle('KpiTitle', fontSize=9, textColor=TEXT_COLOR_LIGHT, alignment=TA_CENTER)
    kpi_value_style = ParagraphStyle('KpiValue', fontSize=24, leading=28, fontName='Helvetica-Bold', alignment=TA_CENTER, textColor=TEXT_COLOR_DARK)
    kpi_sub_style = ParagraphStyle('KpiSub', fontSize=9, textColor=TEXT_COLOR_LIGHT, alignment=TA_CENTER)
    kpi_value_red = ParagraphStyle(name='KpiRed', parent=kpi_value_style, textColor=ACCENT_RED)
    kpi_value_green = ParagraphStyle(name='KpiGreen', parent=kpi_value_style, textColor=ACCENT_GREEN)
    grey_copyright = ParagraphStyle(name='copyright', parent=styles['BodyText'], fontSize=9, leading=15, textColor=colors.gray, spaceAfter=12, fontName="Helvetica", alignment=TA_CENTER)
    
    toc = TableOfContents()
    PS = ParagraphStyle
    toc.levelStyles = [
        PS(name='TOCEntry0', fontName='Helvetica', fontSize=12, leading=18,
           leftIndent=20, firstLineIndent=-20, spaceBefore=6,
           textColor=TEXT_COLOR_DARK, dot=' . ')
    ]
    
    story = []
    
    # Cover Page Content
    story.append(Spacer(1, 2.5 * inch))
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Phishing Simulation Report", title_))
    story.append(Spacer(1, 0.2 * inch))
    date_text = f"Reporting Period: {start_date} – {end_date}"
    story.append(Paragraph(date_text, cover_date_style))
    story.append(Spacer(1, 0.5 * inch))
    
    # Try to add company logo on cover
    try:
        # First try to get company logo from database
        from accounts.models import Company
        try:
            company_obj = Company.objects.get(name=company_name)
            if company_obj.company_logo:
                company_logo_path = company_obj.company_logo.path
                if os.path.exists(company_logo_path):
                    logo = Image(company_logo_path, width=4*inch, height=1.3*inch)
                    logo.preserveAspectRatio = True
                    story.append(logo)
                else:
                    # Fallback text if logo file doesn't exist
                    story.append(Paragraph(f"{company_name}", cover_date_style))
            else:
                # No logo uploaded, show company name
                story.append(Paragraph(f"{company_name}", cover_date_style))
        except Company.DoesNotExist:
            # Company not found, show company name
            story.append(Paragraph(f"{company_name}", cover_date_style))
    except Exception as e:
        print(f"Could not load company logo for cover: {e}")
        story.append(Paragraph(f"{company_name}", cover_date_style))
    
    story.append(Spacer(1, 0.2 * inch))
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"© {datetime.date.today().year} CSword. All Rights Reserved.", grey_copyright))
    
    story.append(NextPageTemplate('main'))
    story.append(PageBreak())
    
    # Table of Contents
    story.append(Paragraph("Table of Contents", h1))
    story.append(Spacer(1, 0.2 * inch))
    story.append(toc)
    story.append(PageBreak())
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", h2))
    add_markdown_to_story(intro_summary, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    # Key Performance Indicators
    story.append(Paragraph("Key Performance Indicators (KPIs)", h2))
    
    def create_kpi_card(title, value, value_style, subtitle=""):
        p_title = Paragraph(title, kpi_title_style)
        p_value = Paragraph(value, value_style)
        p_subtitle = Paragraph(subtitle, kpi_sub_style)
        return Table([[p_title], [p_value], [p_subtitle]], rowHeights=[0.2*inch, 0.4*inch, 0.2*inch])
    
    card1 = create_kpi_card("Average Click Rate", f"{kpis['avg_click_rate']:.2%}", kpi_value_red)
    card2 = create_kpi_card("Average Reporting Rate", f"{kpis['avg_report_rate']:.2%}", kpi_value_green)
    card3 = create_kpi_card("Repeat Clickers", str(kpis['repeat_clickers']), kpi_value_red, "High-Risk Individuals")
    main_kpi_table = Table([[card1, card2, card3]], colWidths=[2.1*inch]*3, hAlign='CENTER')
    main_kpi_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(main_kpi_table)
    story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(6.5*inch, thickness=0.5, color=BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    
    card_vuln = create_kpi_card("Most Vulnerable Group", kpis['most_vulnerable_group_name'], kpi_value_style, f"{kpis['most_vulnerable_group_click_rate']:.2%} Click Rate")
    card_eff = create_kpi_card("Most Effective Group", kpis['most_effective_group_name'], kpi_value_style, f"{kpis['most_effective_group_report_rate']:.2%} Report Rate")
    card4 = create_kpi_card("Total Emails Sent", str(kpis['total_emails']), kpi_value_style, f"{kpis['total_campaigns']} Campaigns")
    group_kpi_table = Table([[card4, card_vuln, card_eff]], colWidths=[2.1*inch]*3, hAlign='CENTER')
    group_kpi_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(group_kpi_table)
    story.append(Spacer(1, 0.2 * inch))
    add_markdown_to_story(kpis_analysis, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    # Departmental Breakdown
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Paragraph("Departmental Breakdown", h2))
    story.append(Spacer(1, 0.2 * inch))
    
    # Convert department stats to table
    if isinstance(department_stats, dict):
        # Convert dict to DataFrame
        dept_df = pd.DataFrame(department_stats)
    else:
        dept_df = department_stats
    
    table_data = [['Department', 'Emails Sent', 'Click Rate', 'Report Rate']]
    for index, row in dept_df.iterrows():
        table_data.append([
            str(index),
            str(int(row['Emails Sent'])),
            f"{row['Click Rate']:.1%}",
            f"{row['Report Rate']:.1%}"
        ])
    
    col_widths = [1.4*inch, 1.4*inch, 1.4*inch, 1.4*inch]
    department_table = Table(table_data, colWidths=col_widths, hAlign='CENTER')
    department_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BRAND_COLOR), ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8), ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 1, BORDER_COLOR), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,1), (0,-1), 'LEFT'), ('LEFTPADDING', (0,1), (0,-1), 10), ('ALIGN', (1,0), (-1,-1), 'CENTER'),
    ]))
    story.append(department_table)
    story.append(Spacer(1, 0.2 * inch))
    add_markdown_to_story(department_analysis, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    # Trend Analysis
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Paragraph("Phishing Awareness Trend Analysis", h2))
    story.append(Image(trend_chart_img, width=5*inch, height=2.5*inch))
    add_markdown_to_story(analysis_trend, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    # Group Risk Assessment
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Paragraph("Group Risk Assessment Analysis", h2))
    story.append(Image(group_chart_img, width=5*inch, height=2.5*inch))
    add_markdown_to_story(analysis_group, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    # Conclusion
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Paragraph("Key Findings & Conclusion", h2))
    add_markdown_to_story(conclusion, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    # Recommendations
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Paragraph("Actionable Recommendations", h2))
    add_markdown_to_story(recomendation, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    # CSword Solutions
    story.append(HRFlowable(6.5*inch, thickness=1, color=BORDER_COLOR))
    story.append(Paragraph("Implementing Recommendations with CSword", h2))
    add_markdown_to_story(how_csword_helps_text, story, body_style)
    
    story.append(Spacer(1, 0.4 * inch))
    story.append(HRFlowable(6.5*inch, thickness=0.5, color=BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"This report is prepared by CSword for {company_name}", closing_style))
    story.append(Spacer(1, 0.2 * inch))
    
    # Try to add stamp
    try:
        stamp_paths = [
            os.path.join(os.path.dirname(__file__), '..', 'static', 'images', 'stamp.png'),
            'backend/static/images/stamp.png',
            os.path.join(output_dir, 'stamp.png'),
            'backend/media/stamp.png',
            'backend/static/stamp.png'
        ]
        stamp_path = None
        for path in stamp_paths:
            abs_path = os.path.abspath(path)
            if os.path.exists(abs_path):
                stamp_path = abs_path
                break
        
        if stamp_path:
            stamp_image = Image(stamp_path, width=1.5*inch, height=1.5*inch)
            stamp_image.preserveAspectRatio = True
            stamp_table = Table([[stamp_image]], hAlign='CENTER')
            stamp_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
            story.append(stamp_table)
            print(f"✅ CSword stamp loaded from: {stamp_path}")
        else:
            story.append(Paragraph("[CSword Official Stamp]", closing_style))
            print("⚠️ CSword stamp not found, using text placeholder")
    except Exception as e:
        print(f"Could not load stamp: {e}")
        story.append(Paragraph("[CSword Official Stamp]", closing_style))
    
    doc.multiBuild(story)
    return str(pdf_path)