// services/driveService.js
import { google } from "googleapis";
import fs from "fs";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const FIXED_FOLDER_ID = "1UB3VjCQzDzQPhGOYDaLfngOoOnvnEE54"; // permanent Drive folder

export const getDriveClient = async () => {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS); // from env var

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  return google.drive({ version: "v3", auth: authClient });
};

export const uploadFileToDrive = async (filePath, filename, mimeType) => {
  const drive = await getDriveClient();

  const fileMetadata = {
    name: filename,
    parents: [FIXED_FOLDER_ID],
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
