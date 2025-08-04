// src/authSetup.js
import { google } from "googleapis";
import fs from "fs"; // Not needed if you're not writing a token file
import path from "path"; // Not needed if you're not writing a token file
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// These are now read from the .env file
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} = process.env;

// The scope we need for the Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Initialize the OAuth2 client using .env variables
export const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// This function handles the initial authorization or token refresh
export const getOAuth2Client = async () => {
  // Check if a REFRESH_TOKEN exists in environment variables first
  const existingRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (existingRefreshToken) {
    oAuth2Client.setCredentials({ refresh_token: existingRefreshToken });
  } else {
    // If no refresh token in .env, fall back to the interactive authorization flow
    console.log("No refresh token found in .env. Starting authorization process...");
    authorizeUser();
    return null; // Don't return client until authorized
  }

  if (oAuth2Client.isTokenExpiring()) {
    console.log('Access token is expiring, refreshing...');
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);
      console.log('Token refreshed.');
    } catch (err) {
      console.error('Error refreshing access token:', err);
      // If refresh fails, something is wrong with the refresh token. Re-authorize.
      authorizeUser();
      return null;
    }
  }
  return oAuth2Client;
};

// This function generates the authorization URL
function authorizeUser() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  // console.log('Authorize this app by visiting this URL:');
  // console.log(authUrl);
}