// API Configuration
// Determine if we're in production environments
const isProduction = window.location.hostname.includes('railway.app');

// Use absolute URL for both production and development
export const API_BASE_URL =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:8000/api';

export const EMAIL_API_ENDPOINT = `${API_BASE_URL}/email/send/`;
export const EMAIL_SAVE_API_ENDPOINT = `${API_BASE_URL}/email/save/`;
export const EMAIL_CONFIGS_API_ENDPOINT = `${API_BASE_URL}/email/configurations/`;
export const EMAIL_TEMPLATES_API_ENDPOINT = `${API_BASE_URL}/email/templates/`;
export const LANDING_PAGE_TEMPLATES_API_ENDPOINT = `${API_BASE_URL}/email/landing-page-templates/`;
export const EMAIL_SENT_API_ENDPOINT = `${API_BASE_URL}/email/sent-emails/`;
export const PHISHING_CAMPAIGN_CREATE_API_ENDPOINT = `${API_BASE_URL}/email/campaigns/create/`;
