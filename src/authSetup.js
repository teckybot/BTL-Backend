import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const redirectUri = isProduction
  ? process.env.GOOGLE_REDIRECT_URI_PROD
  : process.env.GOOGLE_REDIRECT_URI_LOCAL;

console.log(`📍 Using redirect URI: ${redirectUri}`);

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN
} = process.env;

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  redirectUri 
);

/**
 * Generates the Google OAuth URL for consent
 */
function generateAuthUrl() {
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

/**
 * Checks if token is going to expire soon (default: 5 minutes)
 */
function isTokenExpiringSoon(client, thresholdMs = 5 * 60 * 1000) {
  const expiryDate = client.credentials.expiry_date;
  return !expiryDate || expiryDate - Date.now() < thresholdMs;
}

/**
 * Save refresh token to .env file
 */
function saveRefreshToken(refreshToken) {
  let envData = fs.readFileSync(".env", "utf8");
  if (envData.includes("GOOGLE_REFRESH_TOKEN")) {
    envData = envData.replace(/GOOGLE_REFRESH_TOKEN=.*/g, `GOOGLE_REFRESH_TOKEN=${refreshToken}`);
  } else {
    envData += `\nGOOGLE_REFRESH_TOKEN=${refreshToken}`;
  }
  fs.writeFileSync(".env", envData);
  console.log("💾 New refresh token saved to .env");
}

/**
 * Handles refreshing access token or re-auth if needed
 */
export const getOAuth2Client = async () => {
  if (!GOOGLE_REFRESH_TOKEN) {
    console.log("⚠ No refresh token found — waiting for user to authorize...");
    console.log("🔑 Visit this URL:", generateAuthUrl());
    return null;
  }

  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  try {
    if (isTokenExpiringSoon(oAuth2Client)) {
      console.log("♻ Refreshing Google Drive access token...");
      const accessTokenResponse = await oAuth2Client.getAccessToken();

      if (!accessTokenResponse?.token) {
        throw new Error("Failed to refresh access token");
      }

      oAuth2Client.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN,
        access_token: accessTokenResponse.token
      });

      console.log("✅ Google Drive token refreshed successfully");
    }
  } catch (err) {
    if (err.message.includes("invalid_grant")) {
      console.error("❌ Refresh token invalid/revoked. Awaiting re-authorization...");
      console.log("🔑 Visit this URL to reauthorize:", generateAuthUrl());

      // Keep printing URL every 10 minutes until authorized
      setInterval(() => {
        console.log("🔑 Re-authorization still required. Visit:", generateAuthUrl());
      }, 10 * 60 * 1000);
    } else {
      console.error("❌ Unexpected token refresh error:", err);
    }
    return null;
  }

  return oAuth2Client;
};

/**
 * Called from /oauth2callback after authorization
 */
export function handleNewTokens(tokens) {
  oAuth2Client.setCredentials(tokens);

  if (tokens.refresh_token) {
    saveRefreshToken(tokens.refresh_token);
  }
}
