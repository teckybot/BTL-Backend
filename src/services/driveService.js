// src/services/driveService.js
import { google } from "googleapis";
import fs from "fs";
import { getOAuth2Client } from "../authSetup.js"; // New import

// Remove the old SCOPES and credentials logic.

export const getDriveClient = async () => {
  const authClient = await getOAuth2Client();
  return google.drive({ version: "v3", auth: authClient });
};

// The uploadFileToDrive function remains the same.
// It will now use the client that is authorized to access your personal Drive.
export const uploadFileToDrive = async (filePath, filename, mimeType, folderId) => {
  const drive = await getDriveClient();

  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  return response.data;
};