// services/mailservice2.js

import { SendMailClient } from "zeptomail"; // For ES6, set type: "module" in package.json
// If using CommonJS: const { SendMailClient } = require("zeptomail");

// Configure your ZeptoMail client
// It's best practice to load these from environment variables, not hardcode them.
const ZEPTOMAIL_URL = process.env.ZEPTOMAIL_URL || "api.zeptomail.in/";
const ZEPTOMAIL_TOKEN = process.env.ZEPTOMAIL_TOKEN || "Zoho-enczapikey PHtE6r1cSunv2jV+phUE4f/qFJGtPYl99L5mKQJAttxLWPdXF00B+Y0pxmPjrxYsUPZKQPLPy9ps5L+d5e/TJ2zrNW5NDWqyqK3sx/VYSPOZsbq6x00VtVwed0HYV4DvcNFp1SHSs9bSNA==";
// IMPORTANT: Replace the above hardcoded token with process.env.ZEPTOMAIL_TOKEN for production

const client = new SendMailClient({ url: ZEPTOMAIL_URL, token: ZEPTOMAIL_TOKEN });

// --- Helper Function for Dynamic Team Table HTML Generation ---
const generateTeamTableHtml = (teams) => {
    if (!teams || teams.length === 0) {
        return '<tr><td colspan="3" style="padding: 10px; border: 1px solid #eee; text-align: center;">No teams registered in this batch.</td></tr>';
    }

    let rowsHtml = '';
    for (const team of teams) {
        rowsHtml += `
            <tr>
                <td style="padding: 10px; border: 1px solid #eee;">${team.team_id}</td>
                <td style="padding: 10px; border: 1px solid #eee;">${team.event_name}</td>
                <td style="padding: 10px; border: 1px solid #eee;">${team.team_size}</td>
            </tr>
        `;
    }
    return rowsHtml;
};

// --- Base HTML Template (with placeholders for backend rendering) ---
const baseEmailHtmlTemplate = `
<html>
<head></head>
<body>
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 8px 20px rgba(0, 123, 255, 0.1); border-left: 6px solid #1a73e8;">
        <h2 style="color: #1a73e8; text-align: center;">Teams Registered Successfully -  Bharat Tech League 2025<br></h2>
        <p style="font-size:16px">Dear <b>{coordinator_name}</b>,</p>
        <p style="font-size:16px">We are excited to confirm that the following teams have been successfully registered
            for the <b>Bharat Teck League 2025</b>.</p>
        <table
            style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 15px; border: 1px solid #ccc;">
            <thead style="background-color: #f0f8ff;">
                <tr>
                    <th style="padding: 10px; text-align: left; border: 1px solid #ccc;">Team ID</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #ccc;">Event</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #ccc;">Team Size</th>
                </tr>
            </thead>
            <tbody>
                {dynamic_team_rows}
            </tbody>
        </table>
        <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 15px;">
            <tbody>
                <tr style="background-color: #f0f8ff;">
                    <td style="padding: 10px; font-weight: bold; border: 1px solid #eee;">School Registration ID:</td>
                    <td style="padding: 10px; border: 1px solid #eee;">{school_reg_id}</td>
                </tr>
                
                <tr>
                    <td style="padding: 10px; font-weight: bold; border: 1px solid #eee;">School Name:</td>
                    <td style="padding: 10px; border: 1px solid #eee;">{school_name}</td>
                </tr>

                <tr style="background-color: #f0f8ff;">
                    <td style="padding: 10px; font-weight: bold; border: 1px solid #eee;">District:</td>
                    <td style="padding: 10px; border: 1px solid #eee;">{district}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; font-weight: bold; border: 1px solid #eee;">State:</td>
                    <td style="padding: 10px; border: 1px solid #eee;">{state}</td>
                </tr>
                
            </tbody>
        </table>
        <h3 style="color: #1a73e8; margin-top: 30px;">📌 Next Steps:</h3>
        <ul style="font-size: 15px; line-height: 1.6; padding-left: 20px; color: #333;">
            <li>Use the assigned Team ID for any queries or event participation updates.</li>
            <li>Refer to the problem statements on the official website for competition-specific guidelines.</li>
            <li>Prepare your online submissions according to the guidelines.</li>
            <li>Ensure all team members are informed about the event rules and timeline.</li>
        </ul>
        <p style="font-size:15px">For any further queries, please contact us at<a
                href="mailto:btl@teckybot.com" style="color: #1a73e8;">btl@teckybot.com</a>.</p>
        <p style="font-size:15px">We look forward to your enthusiastic participation.</p>
        <p style="font-size:15px">Warm regards,<br><b style="color: #1a73e8;">Team Bharat Teck League</b></p>
    </div>
</body>
</html>
`;

// --- Main Email Sending Service Function ---
/**
 * Sends a team registration confirmation email with a dynamically rendered team table.
 * @param {Array<{email: string, name: string}>} recipients - Array of recipient objects (email_address, name).
 * @param {Object} data - Contains all merge data for the email.
 * @param {string} data.coordinator_name
 * @param {string} data.school_name
 * @param {string} data.school_reg_id
 * @param {string} data.state
 * @param {string} data.district
 * @param {Array<{team_id: string, event_name: string, team_size: string}>} data.team_table
 */
export const sendTeamConfirmationEmailDirect = async ({ recipients, data }) => {
    try {
        // Generate dynamic rows based on the team_table
        const dynamicRowsHtml = generateTeamTableHtml(data.team_table);

        // Populate the base template with all provided data
        const finalHtmlBody = baseEmailHtmlTemplate
            .replace('{coordinator_name}', data.coordinator_name || '') // Add default empty string for safety
            .replace('{school_name}', data.school_name || '')
            .replace('{school_reg_id}', data.school_reg_id || '')
            .replace('{state}', data.state || '')
            .replace('{district}', data.district || '')
            .replace('{dynamic_team_rows}', dynamicRowsHtml); // Inject the dynamically generated table rows

        // Prepare the 'to' array for the ZeptoMail sendMail function
        const toArray = recipients.map(recipient => ({
            email_address: {
                address: recipient.email,
                name: recipient.name || '', // Add default empty string for safety
            }
        }));

        // Construct the mail options for sendMail
        const mailOptions = {
            from: {
                address: "noreply@bharatteckleague.com",
                name: "Bharat Teck League",
            },
            to: toArray, // Send to all specified recipients in one go
            subject: "Teams Registered Successfully!", // Use a clear subject
            htmlbody: finalHtmlBody, // This is the full, pre-rendered HTML
            // Optional: reply_to, cc, bcc, attachments, inline_images
            // For attachments, if you have a common poster for all emails, you can add it here.
            // "attachments": [
            //     {
            //         "content": "BASE64_ENCODED_POSTER_CONTENT", // Replace with actual base64 content
            //         "mime_type": "image/jpeg", // Or application/pdf etc.
            //         "name": "Event_Poster.jpg"
            //     }
            // ],
            "track_clicks": true, // Enable if desired
            "track_opens": true,   // Enable if desired
        };

        const response = await client.sendMail(mailOptions);
        // console.log("ZeptoMail SendMail Success:", response);
        return response;
    } catch (error) {
        console.error("Error sending team confirmation email directly via ZeptoMail:", error);
        // Depending on your error handling strategy, you might re-throw or return a specific error object.
        throw error;
    }
};