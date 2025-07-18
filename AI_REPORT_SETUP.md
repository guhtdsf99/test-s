# AI Report Generation System Setup

This document provides instructions for setting up and using the AI-powered phishing simulation report generation system.

## Overview

The AI report generation system has been integrated into your existing Django backend and React frontend. It analyzes completed phishing campaigns and generates comprehensive PDF reports using AI analysis.

## Features

- **Intelligent Caching**: Only generates new reports when new campaigns are completed
- **Real Data Analysis**: Converts actual campaign data to structured format for AI analysis
- **Comprehensive Reports**: Includes KPI analysis, departmental breakdowns, trend analysis, and actionable recommendations
- **Professional PDF Output**: Generates branded PDF reports with charts and visualizations
- **Async Processing**: Reports are generated in the background to avoid blocking the UI

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Add the following to your `backend/.env` file:

```env
# AI Report Generation
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

To get a Gemini API key:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and replace `your-actual-gemini-api-key-here` in the .env file

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Create Media Directory

```bash
mkdir -p media/ai_reports
```

## Frontend Integration

The frontend integration is already complete. The "Download a full AI report now" button appears on the Campaigns page before the Completed Campaigns table.

## How It Works

### Data Flow

1. **User clicks "Download a full AI report now"**
2. **System checks for new campaigns**: Compares current finished campaigns with the last report
3. **If new report needed**: 
   - Aggregates data from all finished campaigns
   - Converts to structured format for AI analysis
   - Creates report record in database
   - Starts background generation process
4. **If existing report available**: Downloads the cached report immediately

### Report Generation Process

1. **Data Collection**: Gathers all finished campaign data (excludes active, deleted, or test campaigns)
2. **Data Transformation**: Converts real campaign data to mockup JSON format
3. **AI Analysis**: Uses Google Gemini to analyze:
   - KPI trends and conflicts
   - Departmental performance
   - Temporal trends
   - Risk assessments
4. **Visualization**: Creates charts for trend and group analysis
5. **PDF Generation**: Builds professional PDF with all analysis and recommendations

### Report Content

Each report includes:
- **Executive Summary**: High-level findings and recommendations
- **KPI Analysis**: Click rates, reporting rates, vulnerable groups
- **Departmental Breakdown**: Performance by department
- **Trend Analysis**: Time-based performance patterns
- **Group Risk Assessment**: Comparative departmental analysis
- **Conclusions**: Synthesized findings
- **Recommendations**: Actionable next steps
- **CSword Solutions**: How CSword can help implement recommendations

## API Endpoints

The following endpoints have been added:

- `POST /api/email/ai-reports/generate/` - Generate or get existing report
- `GET /api/email/ai-reports/{report_id}/status/` - Check report generation status
- `GET /api/email/ai-reports/{report_id}/download/` - Download completed report
- `GET /api/email/ai-reports/` - List all reports for company

## Database Models

### AIPhishingReport

- `id`: UUID primary key
- `company`: Foreign key to Company
- `report_name`: Generated report name
- `campaigns_count`: Number of campaigns included
- `start_date`/`end_date`: Date range of campaigns
- `status`: generating/completed/failed
- `pdf_file_path`: Path to generated PDF
- `analysis_data`: JSON field with AI analysis results
- Timestamps: created_at, updated_at, completed_at

## File Structure

```
backend/
├── email_service/
│   ├── ai_report_models.py          # Database models
│   ├── ai_report_utils.py           # Data processing utilities
│   ├── ai_report_views.py           # API endpoints
│   ├── ai_report_generator.py       # Main report generation
│   ├── ai_utils.py                  # AI analysis functions
│   ├── visualizations.py            # Chart generation
│   ├── pdf_generator.py             # PDF creation
│   └── migrations/
│       └── 0002_add_ai_phishing_report.py
├── media/
│   └── ai_reports/                  # Generated PDF storage
└── requirements.txt                 # Updated dependencies
```

## Usage

### For End Users

1. Navigate to the Campaigns page
2. Click on the "Completed Campaigns" tab
3. Click "Download a full AI report now" button
4. Wait for generation (first time) or immediate download (cached)

### For Administrators

- View all reports in Django Admin under "AI Phishing Reports"
- Monitor report generation status
- Access raw analysis data
- Manage report files

## Troubleshooting

### Common Issues

1. **"No finished campaigns available"**
   - Ensure campaigns have end_date < current date
   - Check that campaigns don't contain 'deleted' or 'test' in name

2. **"Report generation failed"**
   - Check GEMINI_API_KEY is valid
   - Verify internet connection for AI API calls
   - Check Django logs for detailed error messages

3. **"Report PDF not found"**
   - Ensure media/ai_reports directory exists and is writable
   - Check file permissions

### Debugging

Enable debug logging by adding to Django settings:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'email_service.ai_report_generator': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Customization

### Modifying AI Prompts

Edit functions in `ai_utils.py`:
- `get_kpi_analysis_prompt()` - KPI analysis style
- `get_conclusion_prompt()` - Report conclusions
- `get_recommendation_prompt()` - Recommendations format

### Changing PDF Styling

Modify `pdf_generator.py`:
- Colors and fonts in configuration constants
- Layout and spacing in `build_pdf()` function
- Add company logos by placing files in media directory

### Data Processing

Customize `ai_report_utils.py`:
- `convert_campaigns_to_mockup_format()` - Data transformation logic
- `check_if_new_report_needed()` - Caching logic

## Security Considerations

- API key is stored in environment variables
- Reports are company-scoped (users can only access their company's reports)
- PDF files are stored in media directory with proper permissions
- All API endpoints require authentication

## Performance

- Reports are generated asynchronously to avoid blocking
- Caching prevents unnecessary regeneration
- Database queries are optimized with select_related
- Large datasets are processed efficiently with pandas

## Support

For issues or questions:
1. Check Django logs for error details
2. Verify all dependencies are installed
3. Ensure environment variables are set correctly
4. Test with a small dataset first