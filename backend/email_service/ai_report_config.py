"""
Configuration file for AI Report system
Contains all constants and settings used across the AI report generation system
"""

# ======================================================================
# --- DESIGN & LAYOUT CONSTANTS (matching original system) ---
# ======================================================================
BRAND_COLOR = "#364b82"
ACCENT_RED = "#E63946"
ACCENT_GREEN = "#2A9D8F"
TEXT_COLOR_DARK = "#222222"
TEXT_COLOR_LIGHT = "#666666"
BACKGROUND_COLOR_LIGHT = "#F4F6F7"
BORDER_COLOR = "#DDDDDD"

# ======================================================================
# --- REPORT GENERATION SETTINGS ---
# ======================================================================
REPORT_FILENAME_PREFIX = "Phishing_Simulation_Report"

# AI Model settings
AI_MODEL = "gemini-2.5-flash"
AI_THINKING_ENABLED = True

# Chart settings
CHART_WIDTH = 7
CHART_HEIGHT = 3.5
CHART_DPI = 300

# PDF settings
PDF_PAGE_WIDTH = 8.5  # inches
PDF_PAGE_HEIGHT = 11  # inches
PDF_MARGIN = 1  # inch

# Logo and asset paths
LOGO_PATHS = [
    'backend/static/images/cs-logo.png',
    'backend/media/cs-logo.png',
    'backend/static/cs-logo.png'
]

STAMP_PATHS = [
    'backend/static/images/stamp.png',
    'backend/media/stamp.png',
    'backend/static/stamp.png'
]

COMPANY_LOGO_PATHS = [
    'backend/media/logo.png',
    'backend/static/logo.png'
]

# ======================================================================
# --- DATA PROCESSING SETTINGS ---
# ======================================================================

# Campaign filtering
EXCLUDED_CAMPAIGN_KEYWORDS = ['deleted', 'test', 'draft']

# Email status mapping
EMAIL_CLICKED_FIELD = 'clicked'
EMAIL_REPORTED_FIELD = 'read'  # Using 'read' as proxy for 'reported'
EMAIL_SENT_FIELD = 'sent'

# Date formatting
DATE_FORMAT = "%B %d, %Y"  # e.g., "January 15, 2025"
ISO_DATE_FORMAT = "%Y-%m-%d"

# ======================================================================
# --- REPORT CONTENT SETTINGS ---
# ======================================================================

# Report sections
REPORT_SECTIONS = [
    'Executive Summary',
    'Key Performance Indicators (KPIs)',
    'Departmental Breakdown',
    'Phishing Awareness Trend Analysis',
    'Group Risk Assessment Analysis',
    'Key Findings & Conclusion',
    'Actionable Recommendations',
    'Implementing Recommendations with CSword'
]

# KPI thresholds for analysis
HIGH_RISK_CLICK_RATE = 0.3  # 30%
LOW_REPORT_RATE = 0.4  # 40%
ACCEPTABLE_CLICK_RATE = 0.1  # 10%

# ======================================================================
# --- ERROR MESSAGES ---
# ======================================================================

ERROR_MESSAGES = {
    'no_company': 'User does not belong to any company',
    'no_campaigns': 'No finished campaigns available',
    'no_emails': 'No emails found for finished campaigns',
    'report_not_found': 'Report not found',
    'pdf_not_found': 'Report PDF not found',
    'generation_failed': 'Failed to generate report',
    'download_failed': 'Failed to download report',
    'invalid_api_key': 'Invalid or missing Gemini API key'
}

# ======================================================================
# --- SUCCESS MESSAGES ---
# ======================================================================

SUCCESS_MESSAGES = {
    'report_generated': 'Report generated successfully',
    'report_cached': 'Using cached report',
    'generation_started': 'Report generation started',
    'download_ready': 'Report ready for download'
}