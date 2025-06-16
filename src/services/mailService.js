import { SendMailClient } from "zeptomail";

const url = "https://api.zeptomail.in/v1.1/email/template/batch";
const token = "Zoho-enczapikey PHtE6r1cSunv2jV+phUE4f/qFJGtPYl99L5mKQJAttxLWPdXF00B+Y0pxmPjrxYsUPZKQPLPy9ps5L+d5e/TJ2zrNW5NDWqyqK3sx/VYSPOZsbq6x00VtVwed0HYV4DvcNFp1SHSs9bSNA=="
const client = new SendMailClient({ url, token });

/**
 * Send batch email with PDF attachment using ZeptoMail template batch API
 * @param {Object} params
 * @param {Array} params.recipients - array of { email, name, mergeData }
 * @param {string} params.pdfBase64 - PDF file content base64 encoded
 * @param {string} params.templateKey - ZeptoMail template key
 */

export const sendSchoolBatchEmail = async ({ recipients, templateKey }) => {
  // Build recipients array for ZeptoMail batch API
  const toArray = recipients.map(({ email, name, mergeData }) => ({
    email_address: {
      address: email,
      name: name,
    },
    merge_info: mergeData,
  }));
  
  const mailBatchRequest = {
    mail_template_key: templateKey,
    from: {
      address: "noreply@bharatteckleague.com",
      name: "Bharat Teck League",
    },
    to: toArray,
  };
  

  try {
    const response = await client.mailBatchWithTemplate(mailBatchRequest);
    return response;
  } catch (error) {
    console.error("Error sending batch email:", error);
    throw error;
  }
};

// Team Batch email

// export const sendTeamConfirmationEmail = async ({ recipients, templateKey }) => {
//   const primaryRecipient = recipients[0];

//   const mailRequest = {
//     mail_template_key: templateKey,
//     from: {
//       address: "noreply@bharatteckleague.com",
//       name: "Bharat Teck League",
//     },
//     to: [
//       {
//         email_address: {
//           address: primaryRecipient.email,
//           name: primaryRecipient.name,
//         },
//         merge_info: primaryRecipient.mergeData, // ✅ Correct key used
//       },
//     ],
    
//   };

//   try {
//     const response = await client.mailBatchWithTemplate(mailRequest);
//     return response;
//   } catch (error) {
//     console.error("Error sending team confirmation email:", error);
//     throw error;
//   }
// };

export const sendTeamConfirmationEmail = async ({ recipients, templateKey }) => {
  const toArray = recipients.map(({ email, name, mergeData }) => ({
    email_address: {
      address: email,
      name,
    },
    merge_info: mergeData,
  }));

  const mailRequest = {
    mail_template_key: templateKey,
    from: {
      address: "noreply@bharatteckleague.com",
      name: "Bharat Teck League",
    },
    to: toArray,
  };

  try {
    const response = await client.mailBatchWithTemplate(mailRequest);
    return response;
  } catch (error) {
    console.error("Error sending team confirmation email:", error);
    throw error;
  }
};




