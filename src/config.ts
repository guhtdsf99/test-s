// API Configuration
// Determine if we're in production environment
const isProduction = window.location.hostname.includes('railway.app');

// Use absolute URL for both production and development
export const API_BASE_URL = isProduction 
  ? 'https://adventurous-magic-production.up.railway.app/api'
  : 'http://localhost:8000/api';

export const EMAIL_API_ENDPOINT = `${API_BASE_URL}/email/send/`;
export const EMAIL_SAVE_API_ENDPOINT = `${API_BASE_URL}/email/save/`;
export const EMAIL_CONFIGS_API_ENDPOINT = `${API_BASE_URL}/email/configurations/`;
export const EMAIL_TEMPLATES_API_ENDPOINT = `${API_BASE_URL}/email/templates/`;
export const EMAIL_SENT_API_ENDPOINT = `${API_BASE_URL}/email/sent-emails/`;
export const PHISHING_CAMPAIGN_CREATE_API_ENDPOINT = `${API_BASE_URL}/email/campaigns/create/`;
