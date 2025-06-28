# Deploying Phish Aware Academy to Railway

This guide explains how to deploy the Phish Aware Academy application to Railway.app without requiring a credit card.

## Prerequisites

- A Railway account (sign up at [railway.app](https://railway.app) with GitHub)
- Your code pushed to a Git repository (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Set Up Your Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign in with GitHub
3. Complete any verification steps if required

### 2. Deploy the Backend

1. From the Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Select the backend directory as the source directory
5. Railway will automatically detect your Django application

6. Set up the following environment variables:
   - `SECRET_KEY`: Generate a random string
   - `DEBUG`: Set to "False"
   - `ALLOWED_HOSTS`: Set to your Railway domain (e.g., "*.up.railway.app")
   - `FRONTEND_URL`: Will be your frontend URL (add after frontend deployment)
   - `BACKEND_URL`: Will be your backend URL (add after deployment)

### 3. Add a PostgreSQL Database

1. In your project, click "New"
2. Select "Database" and then "PostgreSQL"
3. Wait for the database to be provisioned
4. Railway will automatically add the `DATABASE_URL` environment variable to your backend service

### 4. Deploy the Frontend

1. From the Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose the same repository
4. Select the root directory as the source directory
5. Railway will detect your Node.js application

6. Set up the following environment variables:
   - `VITE_API_URL`: Your backend URL (from step 2)
   - `NODE_ENV`: "production"

### 5. Connect Your Services

1. After both services are deployed, go to your backend service
2. Update the `FRONTEND_URL` environment variable with your frontend URL
3. Go to your frontend service
4. Update the `VITE_API_URL` environment variable with your backend URL

### 6. Test Your Deployment

1. Click on the URL of your frontend service to open your application
2. Test the application functionality:
   - Try to log in
   - Check if the backend API requests work
   - Verify that email tracking works

## Troubleshooting Common Issues

If you encounter problems:

1. **Backend not connecting to database**:
   - Check the `DATABASE_URL` environment variable
   - Verify that migrations ran successfully

2. **Frontend not connecting to backend**:
   - Check the `VITE_API_URL` environment variable
   - Verify CORS settings in your Django settings

3. **Deployment fails**:
   - Check the build logs for errors
   - Ensure all dependencies are in your requirements.txt or package.json

4. **Application errors**:
   - Check the logs in the Railway dashboard
   - Look for error messages in the browser console

## Railway Free Tier Limitations

Railway provides $5 of free credits per month, which is enough for testing but has some limitations:

- Projects will sleep after 3 days of inactivity
- Limited compute resources
- Limited database storage

For production use, you may need to upgrade to a paid plan or consider other hosting options.

## Custom Domain Setup (Optional)

1. If you have a custom domain, go to your service settings
2. Click on "Domains"
3. Enter your domain name
4. Follow the DNS configuration instructions provided by Railway
