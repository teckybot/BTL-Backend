// services/driveService.js
import { google } from "googleapis";
import fs from "fs";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const KEY_FILE = path.resolve("src/credentials.json");
const FIXED_FOLDER_ID = "1UB3VjCQzDzQPhGOYDaLfngOoOnvnEE54"; // permanent Drive folder

export const getDriveClient = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  return google.drive({ version: "v3", auth: authClient });
};

export const uploadFileToDrive = async (filePath, filename, mimeType) => {
  const drive = await getDriveClient();

  const fileMetadata = {
    name: filename,
    parents: [FIXED_FOLDER_ID], // ✅ always uploads to this folder
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: "id, webViewLink, webContentLink",
  });

  return response.data;
};
