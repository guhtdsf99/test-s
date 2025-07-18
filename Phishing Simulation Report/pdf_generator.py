# pdf_generator.py

import datetime
import markdown
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

import config # Correctly imports from config.py
from pathlib import Path

def add_markdown_to_story(text_content, story_list, base_style):
    # This function is unchanged
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
    # This class is unchanged
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
    # This class is unchanged
    def __init__(self, filename, **kw):
        self.allowSplitting = 0
        BaseDocTemplate.__init__(self, filename, **kw)
        
        cover_frame = Frame(1 * inch, 1 * inch, 6.5*inch, 9*inch, id='cover_frame')
        cover_template = PageTemplate(id='cover', frames=[cover_frame],onPage=kw["onPage_cover"])
        
        frame_width = (8.5 * inch) - (2 * inch)
        frame_height = (11 * inch) - (1 * inch) - (1 * inch)
        main_frame = Frame(1 * inch, 1 * inch, frame_width, frame_height, id='main_frame')
        main_template = PageTemplate(id='main', frames=[main_frame], onPage=kw['onPage'])
        self.addPageTemplates([cover_template,main_template])
    def afterFlowable(self, flowable):
        if flowable.__class__.__name__ == 'Paragraph':
            text = flowable.getPlainText()
            style = flowable.style.name
            if style == 'Heading2':
                self.notify('TOCEntry', (0, text, self.page))

def build_pdf(kpis, kpis_analysis, trend_chart_img, analysis_trend, group_chart_img, analysis_group, department_stats, department_analysis, intro_summary, conclusion, recomendation, how_csword_helps_text, company_name, start_date, end_date):
    # This function is unchanged
    def cover_page(canvas, doc):
        
        y_pos_header = (doc.pagesize[1]/2) + 2.05 * inch
        
        # canvas.setStrokeColor(config.BORDER_COLOR); canvas.setLineWidth(1)
        # y_line__ = y_pos_header + 0.75*inch
        # canvas.line(doc.leftMargin, y_line__, doc.pagesize[0] - doc.rightMargin, y_line__)
        try:
            cs_logo = Image('Data/cs-logo.png', width=1.8*inch, height=0.6*inch); cs_logo.preserveAspectRatio = True
            cs_logo.drawOn(canvas, (doc.pagesize[0]/2)-(0.9*inch) , y_pos_header)
        except:
            canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_header + 0.2*inch, "CSword Logo")
            
        # canvas.setStrokeColor(config.BORDER_COLOR); canvas.setLineWidth(1)
        # y_line_ = 0.7 * inch
        # canvas.line(doc.leftMargin, y_line_, doc.pagesize[0] - doc.rightMargin, y_line_)
        
        # canvas.setFont('Helvetica', 9); canvas.setFillColor(colors.grey)
        # y_pos_footer = 0.5 * inch
        # copyright_text = f"© {datetime.date.today().year} CSword. All Rights Reserved."
        # canvas.drawString(doc.leftMargin, y_pos_footer, copyright_text)
        # report_date = datetime.date.today().strftime("%B %d, %Y")
        # canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_footer, report_date)
        # page_number_text = f"Page {canvas.getPageNumber()}"
        # canvas.drawCentredString(doc.pagesize[0] / 2.0, y_pos_footer, page_number_text)
        # canvas.restoreState()
            
        # canvas.setStrokeColor(config.BORDER_COLOR); canvas.setLineWidth(1)
        # y_line = doc.pagesize[1] - 1.3 * inch
        # canvas.line(doc.leftMargin, y_line, doc.pagesize[0] - doc.rightMargin, y_line)
    def draw_header_and_footer(canvas, doc):
        canvas.saveState()
        y_pos_header = doc.pagesize[1] - 1.0 * inch
        try:
            logo = Image('Data/logo.png', width=1.2*inch, height=0.4*inch); logo.preserveAspectRatio = True
            logo.drawOn(canvas, doc.leftMargin, y_pos_header)
        except:
            canvas.drawString(doc.leftMargin, y_pos_header + 0.2*inch, "Company Logo")
        try:
            cs_logo = Image('Data/cs-logo.png', width=1.2*inch, height=0.4*inch); cs_logo.preserveAspectRatio = True
            cs_logo.drawOn(canvas, doc.pagesize[0] - doc.rightMargin - cs_logo.drawWidth, y_pos_header)
        except:
            canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_header + 0.2*inch, "CSword Logo")
            
        canvas.setStrokeColor(config.BORDER_COLOR); canvas.setLineWidth(1)
        y_line = doc.pagesize[1] - 1.2 * inch
        canvas.line(doc.leftMargin, y_line, doc.pagesize[0] - doc.rightMargin, y_line)
        
        canvas.setStrokeColor(config.BORDER_COLOR); canvas.setLineWidth(1)
        y_line_ = 0.7 * inch
        canvas.line(doc.leftMargin, y_line_, doc.pagesize[0] - doc.rightMargin, y_line_)
        
        canvas.setFont('Helvetica', 9); canvas.setFillColor(colors.grey)
        y_pos_footer = 0.5 * inch
        copyright_text = f"© {datetime.date.today().year} CSword. All Rights Reserved."
        canvas.drawString(doc.leftMargin, y_pos_footer, copyright_text)
        report_date = datetime.date.today().strftime("%B %d, %Y")
        canvas.drawRightString(doc.pagesize[0] - doc.rightMargin, y_pos_footer, report_date)
        page_number_text = f"Page {canvas.getPageNumber()}"
        canvas.drawCentredString(doc.pagesize[0] / 2.0, y_pos_footer, page_number_text)
        canvas.restoreState()

    
    folder_path = Path(f"{company_name}_Reports")
    folder_path.mkdir(parents=True, exist_ok=True)
    start_date_ = start_date.replace(" ","_")
    start_date_ = start_date_.replace(",","")
    end_date_ = end_date.replace(" ","_")
    end_date_ = end_date_.replace(",","")
    # print(f"Ensured folder '{folder_path}' exists.")
    
    doc = ReportDocTemplate(f"{company_name}_Reports/{company_name}_{start_date_}_{end_date_}.pdf", onPage=draw_header_and_footer,onPage_cover=cover_page)
    
    styles = getSampleStyleSheet()
    title_ = ParagraphStyle(name='Heading1', fontSize=30, leading=30, spaceAfter=10, textColor=config.BRAND_COLOR, fontName='Helvetica-Bold', alignment=TA_CENTER)
    h1 = ParagraphStyle(name='Heading1', fontSize=24, leading=30, spaceAfter=18, textColor=config.BRAND_COLOR, fontName='Helvetica-Bold', alignment=TA_CENTER)
    cover_date_style = ParagraphStyle(name='CoverDate', fontSize=12, leading=18, textColor=colors.darkgrey, fontName='Helvetica', alignment=TA_CENTER)
    h2 = ParagraphStyle(name='Heading2', fontSize=16, leading=20, spaceAfter=12, textColor=config.BRAND_COLOR, fontName='Helvetica-Bold')
    body_style = ParagraphStyle(name='Body', parent=styles['BodyText'], fontSize=10, leading=15, textColor=config.TEXT_COLOR_DARK, spaceAfter=12, alignment=TA_JUSTIFY)
    closing_style = ParagraphStyle(name='Closing', parent=body_style, fontName='Helvetica-Oblique', alignment=TA_CENTER, spaceAfter=12)
    kpi_title_style = ParagraphStyle('KpiTitle', fontSize=9, textColor=config.TEXT_COLOR_LIGHT, alignment=TA_CENTER)
    kpi_value_style = ParagraphStyle('KpiValue', fontSize=24, leading=28, fontName='Helvetica-Bold', alignment=TA_CENTER, textColor=config.TEXT_COLOR_DARK)
    kpi_sub_style = ParagraphStyle('KpiSub', fontSize=9, textColor=config.TEXT_COLOR_LIGHT, alignment=TA_CENTER)
    kpi_value_red = ParagraphStyle(name='KpiRed', parent=kpi_value_style, textColor=config.ACCENT_RED)
    kpi_value_green = ParagraphStyle(name='KpiGreen', parent=kpi_value_style, textColor=config.ACCENT_GREEN)
    grey_copyright = ParagraphStyle(name='copyright', parent=styles['BodyText'], fontSize=9, leading=15, textColor=colors.gray, spaceAfter=12, fontName="Helvetica", alignment=TA_CENTER)
    
    toc = TableOfContents()
    PS = ParagraphStyle
    toc.levelStyles = [
        PS(name='TOCEntry0', fontName='Helvetica', fontSize=12, leading=18,
           leftIndent=20, firstLineIndent=-20, spaceBefore=6,
           textColor=config.TEXT_COLOR_DARK, dot=' . ')
    ]
    
    story = []
    
    # --- START: Cover Page Content ---
    story.append(Spacer(1, 2.5 * inch)) # Add space to vertically center the title
    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Phishing Simulation Report", title_))
    story.append(Spacer(1, 0.2 * inch))
    # Add the start and end dates here
    date_text = f"Reporting Period: {start_date} – {end_date}"
    story.append(Paragraph(date_text, cover_date_style))
    story.append(Spacer(1, 0.5 * inch))
    try:
        # You could also put a large logo on the cover page
        logo = Image('Data/logo.png', width=4*inch, height=1.3*inch)
        # logo.hAlign = 'CENTER'
        story.append(logo)
        
    except:
        pass # Ignore if logo not found
    story.append(Spacer(1, 0.2 * inch))
    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"© {datetime.date.today().year} CSword. All Rights Reserved.", grey_copyright))
    
    # Tell the document to use the 'main' template for the next page
    story.append(NextPageTemplate('main'))
    story.append(PageBreak())
    
    # story.append(Paragraph("Phishing Simulation Report", h1))
    # story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("Table of Contents", h1))
    story.append(Spacer(1, 0.2 * inch))
    story.append(toc)
    story.append(PageBreak())

    story.append(Paragraph("Executive Summary", h2))
    add_markdown_to_story(intro_summary, story, body_style)
    story.append(Spacer(1, 0.2 * inch))

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
    story.append(HRFlowable(6.5*inch, thickness=0.5, color=config.BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    card_vuln = create_kpi_card("Most Vulnerable Group", kpis['most_vulnerable_group_name'], kpi_value_style, f"{kpis['most_vulnerable_group_click_rate']:.2%} Click Rate")
    card_eff = create_kpi_card("Most Effective Group", kpis['most_effective_group_name'], kpi_value_style, f"{kpis['most_effective_group_report_rate']:.2%} Report Rate")
    card4 = create_kpi_card("Total Emails Sent", str(kpis['total_emails']), kpi_value_style, f"{kpis['total_campaigns']} Campaigns")
    group_kpi_table = Table([[card4,card_vuln, card_eff]], colWidths=[2.1*inch]*3, hAlign='CENTER')
    group_kpi_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(group_kpi_table)
    story.append(Spacer(1, 0.2 * inch))
    add_markdown_to_story(kpis_analysis, story, body_style)
    story.append(Spacer(1, 0.2 * inch))

    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Paragraph("Departmental Breakdown", h2))
    story.append(Spacer(1, 0.2 * inch))
    
    table_data = [['Department', 'Emails Sent', 'Click Rate', 'Report Rate']]
    for index, row in department_stats.iterrows():
        table_data.append([
            str(index),
            str(int(row['Emails Sent'])),
            f"{row['Click Rate']:.1%}",
            f"{row['Report Rate']:.1%}"
        ])
    col_widths = [1.4*inch, 1.4*inch, 1.4*inch, 1.4*inch]
    department_table = Table(table_data, colWidths=col_widths, hAlign='CENTER')
    department_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), config.BRAND_COLOR), ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8), ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 1, config.BORDER_COLOR), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,1), (0,-1), 'LEFT'), ('LEFTPADDING', (0,1), (0,-1), 10), ('ALIGN', (1,0), (-1,-1), 'CENTER'),
    ]))
    story.append(department_table)
    story.append(Spacer(1, 0.2 * inch))
    add_markdown_to_story(department_analysis, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Paragraph("Phishing Awareness Trend Analysis", h2))
    story.append(Image(trend_chart_img, width=5*inch, height=2.5*inch))
    add_markdown_to_story(analysis_trend, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Paragraph("Group Risk Assessment Analysis", h2))
    story.append(Image(group_chart_img, width=5*inch, height=2.5*inch))
    add_markdown_to_story(analysis_group, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Paragraph("Key Findings & Conclusion", h2))
    add_markdown_to_story(conclusion, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Paragraph("Actionable Recommendations", h2))
    add_markdown_to_story(recomendation, story, body_style)
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(HRFlowable(6.5*inch, thickness=1, color=config.BORDER_COLOR))
    story.append(Paragraph("Implementing Recommendations with CSword", h2))
    add_markdown_to_story(how_csword_helps_text, story, body_style)
    
    story.append(Spacer(1, 0.4 * inch))
    story.append(HRFlowable(6.5*inch, thickness=0.5, color=config.BORDER_COLOR))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"This report is prepared by Csword for {company_name}", closing_style))
    story.append(Spacer(1, 0.2 * inch))
    
    try:
        stamp_image = Image('Data/stamp.png', width=1.5*inch, height=1.5*inch)
        stamp_image.preserveAspectRatio = True
        stamp_table = Table([[stamp_image]], hAlign='CENTER')
        stamp_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE')]))
        story.append(stamp_table)
    except:
        story.append(Paragraph("[CSword Official Stamp]", closing_style))
    
    doc.multiBuild(story)