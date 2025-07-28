// src/services/pdfService.js
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';


// Get __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../data/BTL2025_logo.png');
const TECKY_LOGO_PATH= path.join(__dirname,'../data/teckybotLogo.png')

export const generateSchoolPDF = (schoolData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        bufferPages: true,
        margins: { top: 80, bottom: 60, left: 50, right: 50 }
      });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // --- HEADER BAR ---
      const headerHeight = 80;
      doc.save();
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#fff9f0");
      // Logo (about 40px tall, vertically centered)
      try {
        if (fs.existsSync(LOGO_PATH)) {
          const logoWidth = 95;
          const logoHeight = 80;
          const centerX = (doc.page.width - logoWidth) / 2;
          const centerY = (headerHeight - logoHeight) / 2;
          doc.image(LOGO_PATH, centerX, centerY, { width: logoWidth, height: logoHeight });
        }
      } catch (e) { /* ignore logo errors */ }

      doc.restore();

      // --- TITLE ---
      const titleStartY = doc.y + 50;
      const centerX = doc.page.width / 2;
      // Title line
      doc.font("Helvetica-Bold").fontSize(22).fillColor("#ff8c00");
      const titleText = "School Registration Successfully";
      const titleWidth = doc.widthOfString(titleText);
      doc.text(titleText, centerX - titleWidth / 2, titleStartY);
      // Subtitle line
      const subtitleText = `${schoolData.schoolName}`;
      doc.font("Helvetica").fontSize(14).fillColor("#222");
      const subtitleWidth = doc.widthOfString(subtitleText);
      doc.text(subtitleText, centerX - subtitleWidth / 2, titleStartY + 30);
      doc.moveDown(3);

      // --- SCHOOL DETAILS BOX ---
      const boxMarginX = 40;
      const boxWidth = doc.page.width - 2 * boxMarginX;
      const boxHeight = 240;
      const detailsY = doc.y;
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#ff8c00").text("School Details", boxMarginX, detailsY - 20);
      doc.save();
      doc.roundedRect(boxMarginX, detailsY, boxWidth, boxHeight, 10).fillAndStroke("#fffdf8", "#ffb347");
      doc.restore();
      // Columns setup
      const paddingX = 20;
      const colGap = 2;
      const colWidth = (boxWidth - paddingX * 2 - colGap) / 2;
      const leftX = boxMarginX + paddingX;
      const rightX = leftX + colWidth + colGap + 20;
      let lineHeight = 30;
      let labelFontSize = 13;
      let valueFontSize = 13;
      let rowSpacing = 10;
      let y = detailsY + 30;
      const labelOffsetLeft = 120;
      const labelOffsetRight = 75;

      // Left column
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#ff8c00").text("School ID:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolRegId, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#ff8c00").text("Principal Name:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.principalName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#ff8c00").text("Coordinator:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.coordinatorName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;

      doc.font("Helvetica-Bold").fillColor("#ff8c00").text("School Email:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.schoolEmail, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#ff8c00").text("Coordinator Email:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.coordinatorEmail, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;

      // doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#ff8c00").text("School Name:", leftX, y);
      // doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      // y += lineHeight + rowSpacing;



      // Reset y for right column
      y = detailsY + 30;
      // Right column
      doc.font("Helvetica-Bold").fillColor("#ff8c00").text("District:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.district, rightX + labelOffsetRight, y, { width: colWidth - 80 });
      doc.y = detailsY + boxHeight + 20;
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#ff8c00").text("State:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.state, rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;

      // Address (can wrap)
      doc.font("Helvetica-Bold").fillColor("#ff8c00").text('Address:', rightX, y);

      const addressOptions = { width: colWidth - 80 };
      const addressHeight = doc.heightOfString(schoolData.schoolAddress || "N/A", addressOptions);

      doc.font('Helvetica').fillColor("#222").text(schoolData.schoolAddress || "N/A", rightX + labelOffsetRight, y, addressOptions);

      y += lineHeight + rowSpacing;

      doc.y = detailsY + boxHeight + 30;
      // --- FOOTER ---
      // --- WEBSITE NOTE ABOVE FOOTER ---

      // Step 1: Website note
      const noteText = "Explore our website to learn more";
      const noteWidth = doc.widthOfString(noteText);
      doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#ff8c00")
        .text(noteText, centerX - noteWidth / 2, doc.y);

      // Step 2: Website link
      const url = "www.bharatteckleague.com";
      const urlWidth = doc.widthOfString(url);
      doc.font("Helvetica")
        .fontSize(11)
        .fillColor("blue")
        .text(url, centerX - urlWidth / 2, doc.y + 6, {
          link: "https://www.bharatteckleague.com/",
          underline: true
        });

      // Step 3: Thank you + queries aligned right
      const footerY = doc.y + 35;

      doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#ff8c00")
        .text("Thank you for registering", doc.page.width - 200, footerY, {
          align: "right",
          width: 150
        });

      doc.font("Helvetica")
        .fontSize(10)
        .fillColor("#000000")
        .text("For queries: btl@teckybot.com", doc.page.width - 200, footerY + 15, {
          align: "right",
          width: 150
        });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};


export const generateBatchTeamPDF = (schoolData, teamsData, eventCodeMap) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        bufferPages: true,
        margins: { top: 80, bottom: 60, left: 50, right: 50 }
      });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // --- HEADER BAR ---
      const headerHeight = 80;
      doc.save();
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#f5f8fa");
      // Logo (about 40px tall, vertically centered)
      let logoDrawn = false;
      try {
        if (fs.existsSync(LOGO_PATH)) {
          const logoWidth = 95;
          const logoHeight = 80;
          const centerX = (doc.page.width - logoWidth) / 2;
          const centerY = (headerHeight - logoHeight) / 2;
          doc.image(LOGO_PATH, centerX, centerY, { width: logoWidth, height: logoHeight });
        }
      } catch (e) { /* ignore logo errors */ }
      doc.restore();

      // TITLE
      // Define coordinates manually (override default flow-based layout)
      const titleStartY = doc.y + 50; // Adjust Y manually as needed
      const centerX = doc.page.width / 2;

      // Title line: "Team Registration Confirmation"
      doc.font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#1a73e8");

      // Measure title width for exact center placement
      const titleText = "Teams Registered Successfully";
      const titleWidth = doc.widthOfString(titleText);
      doc.text(titleText, centerX - titleWidth / 2, titleStartY);

      // Subtitle line: "for XYZ School"
      const subtitleText = `${schoolData.schoolName}`;
      doc.font("Helvetica")
        .fontSize(14)
        .fillColor("#222");

      const subtitleWidth = doc.widthOfString(subtitleText);
      doc.text(subtitleText, centerX - subtitleWidth / 2, titleStartY + 30); // Adjust vertical gap

      // Move the cursor down for the next section
      doc.moveDown(3);

      // --- SCHOOL DETAILS BOX ---
      const boxMarginX = 40;
      const boxWidth = doc.page.width - 2 * boxMarginX;
      const boxHeight = 220;
      const detailsY = doc.y;

      doc.font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#1a73e8")
        .text("School Details", boxMarginX, detailsY - 20);

      doc.save();
      doc.roundedRect(boxMarginX, detailsY, boxWidth, boxHeight, 10)
        .fillAndStroke("#f2f6fc", "#e0edfd");
      doc.restore();

      // Columns setup
      const paddingX = 20;
      const colGap = 2;
      const colWidth = (boxWidth - paddingX * 2 - colGap) / 2;

      const leftX = boxMarginX + paddingX;
      const rightX = leftX + colWidth + colGap + 20;

      let lineHeight = 30;
      let labelFontSize = 13;
      let valueFontSize = 13;
      let rowSpacing = 10;

      let y = detailsY + 30;

      const labelOffsetLeft = 120;
      const labelOffsetRight = 75;

      // Left column
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("School ID:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolRegId, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("Principal Name:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.principalName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("Coordinator:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.coordinatorName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;

      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("School Email:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.schoolEmail, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("Coordinator Email:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.coordinatorEmail, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;

      // doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#ff8c00").text("School Name:", leftX, y);
      // doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      // y += lineHeight + rowSpacing;



      // Reset y for right column
      y = detailsY + 30;
      // Right column
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("District:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.district, rightX + labelOffsetRight, y, { width: colWidth - 80 });
      doc.y = detailsY + boxHeight + 20;
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("State:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.state, rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;

      // Address (can wrap)
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text('Address:', rightX, y);

      const addressOptions = { width: colWidth - 80 };
      const addressHeight = doc.heightOfString(schoolData.schoolAddress || "N/A", addressOptions);

      doc.font('Helvetica').fillColor("#222").text(schoolData.schoolAddress || "N/A", rightX + labelOffsetRight, y, addressOptions);

      y += lineHeight + rowSpacing;


      doc.y = detailsY + boxHeight + 20;


      // --- REGISTERED TEAMS TABLE ---
      doc.moveDown(2);
      const sectionTitleX = 50; // left margin value to match box/table
      const sectionTitleY = doc.y; // current vertical position

      doc.font("Helvetica-Bold")
        .fontSize(15)
        .fillColor("#1a73e8")
        .text("Registered Teams", sectionTitleX, sectionTitleY); // no `align`

      doc.moveDown(0.3);
      // Table columns
      const tableX = 50, tableY = doc.y;
      const colWidths = [100, 140, 60, 210];
      const headers = ["Team ID", "competition", "Size", "Members"];
      // Header row
      let x = tableX;
      doc.save();
      headers.forEach((header, i) => {
        doc.rect(x, tableY, colWidths[i], 24).fillAndStroke("#e0edfd", "#e0edfd");
        doc.fillColor("#1a73e8").font("Helvetica-Bold").fontSize(14)
          .text(header, x + 7, tableY + 7, { width: colWidths[i] - 14, align: "left" });
        x += colWidths[i];
      });
      doc.restore();

      // Table rows
      let rowY = tableY + 24;
      teamsData.forEach((team, idx) => {
        // If 8 rows filled, add new page
        if (idx > 0 && idx % 8 === 0) {
          doc.addPage();

          // Redraw table header on new page
          rowY = doc.y;
          let x = tableX;
          doc.save();
          headers.forEach((header, i) => {
            doc.rect(x, rowY, colWidths[i], 24).fillAndStroke("#e0edfd", "#e0edfd");
            doc.fillColor("#1a73e8").font("Helvetica-Bold").fontSize(14)
              .text(header, x + 7, rowY + 7, { width: colWidths[i] - 14, align: "left" });
            x += colWidths[i];
          });
          doc.restore();
          rowY += 24;
        }

        let x = tableX;
        const rowColor = idx % 2 === 0 ? "#fff" : "#f7fafd";

        doc.save();
        doc.rect(x, rowY, colWidths.reduce((a, b) => a + b), 22).fillAndStroke(rowColor, "#e0edfd");
        doc.restore();

        doc.font("Helvetica").fontSize(13).fillColor("#222");
        doc.text(team.teamRegId, x + 7, rowY + 6, { width: colWidths[0] - 14 });
        x += colWidths[0];
        doc.text(eventCodeMap[team.event] || team.event, x + 7, rowY + 6, { width: colWidths[1] - 14 });
        x += colWidths[1];
        doc.text(String(team.teamSize), x + 7, rowY + 6, { width: colWidths[2] - 14 });
        x += colWidths[2];
        doc.text(team.members.map(m => m.name).join(", "), x + 7, rowY + 6, { width: colWidths[3] - 14 });

        rowY += 22;
      });


      // Note: Website info aligned right above footer
      // Estimate required footer height
      const footerHeight = 90; // estimated total height of all footer blocks
      const availableSpace = doc.page.height - rowY - 60; // bottom margin included

      let footerStartY;

      if (availableSpace < footerHeight) {
        // Not enough space — create new page
        doc.addPage();
        footerStartY = doc.y + 30; // top margin for new page
      } else {
        footerStartY = rowY + 20; // continue on current page
      }

      // Draw footer content
      doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#1a73e8");
      const noteText = "Explore our website to learn more";
      const noteWidth = doc.widthOfString(noteText);
      doc.text(noteText, centerX - noteWidth / 2, footerStartY);

      doc.font("Helvetica")
        .fontSize(11)
        .fillColor("blue");
      const url = "www.bharatteckleague.com";
      const urlWidth = doc.widthOfString(url);
      doc.text(url, centerX - urlWidth / 2, footerStartY + 15, {
        link: "https://www.bharatteckleague.com/",
        underline: true
      });

      doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#1a73e8")
        .text("Thank you for registering", doc.page.width - 200, footerStartY + 45, {
          align: "right",
          width: 150
        });

      doc.font("Helvetica")
        .fontSize(11)
        .fillColor("#000000")
        .text("For queries: btl@teckybot.com", doc.page.width - 200, footerStartY + 60, {
          align: "right",
          width: 150
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const generateAIWorkshopPDF = (registrationData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        bufferPages: true,
        margins: { top: 80, bottom: 60, left: 50, right: 50 }
      });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // --- HEADER BAR ---
      const headerHeight = 80;
      doc.save();
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#f5f5f5");
      // Logo (about 40px tall, vertically centered)
      try {
        if (fs.existsSync(TECKY_LOGO_PATH)) {
          const logoWidth = 130;
          const logoHeight = 40;
          const centerX = (doc.page.width - logoWidth) / 2;
          const centerY = (headerHeight - logoHeight) / 2;
          doc.image(TECKY_LOGO_PATH, centerX, centerY, { width: logoWidth, height: logoHeight });
        }
      } catch (e) { /* ignore logo errors */ }

      doc.restore();

      // --- TITLE ---
      const titleStartY = doc.y + 50;
      const centerX = doc.page.width / 2;
      // Title line
      doc.font("Helvetica-Bold").fontSize(22).fillColor("#444");
      const titleText = "AI Workshop Registration Confirmation";
      const titleWidth = doc.widthOfString(titleText);
      doc.text(titleText, centerX - titleWidth / 2, titleStartY);
      // Subtitle line
      const subtitleText = `${registrationData.name}`;
      doc.font("Helvetica").fontSize(14).fillColor("#222");
      const subtitleWidth = doc.widthOfString(subtitleText);
      doc.text(subtitleText, centerX - subtitleWidth / 2, titleStartY + 30);
      doc.moveDown(3);

      // --- REGISTRATION DETAILS BOX ---
      const boxMarginX = 40;
      const boxWidth = doc.page.width - 2 * boxMarginX;
      const boxHeight = 250;
      const detailsY = doc.y;
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#666").text("Registration Details", boxMarginX, detailsY - 20);
      doc.save();
      doc.roundedRect(boxMarginX, detailsY, boxWidth, boxHeight, 10).fillAndStroke("#f5f5f5", "#cccccc");
      doc.restore();
      
      // Columns setup
      const paddingX = 20;
      const colGap = 2;
      const colWidth = (boxWidth - paddingX * 2 - colGap) / 2;
      const leftX = boxMarginX + paddingX;
      const rightX = leftX + colWidth + colGap + 20;
      let lineHeight = 30;
      let labelFontSize = 13;
      let valueFontSize = 13;
      let rowSpacing = 10;
      let y = detailsY + 30;
      const labelOffsetLeft = 100;
      const labelOffsetRight = 55;

      // Left column
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#444").text("Registration ID:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(registrationData.registrationId, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#444").text("Name:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(registrationData.name, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#444").text("Email:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(registrationData.email, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#444").text("Contact:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(registrationData.contact, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#444").text("School:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(registrationData.school, leftX + labelOffsetLeft, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;

      // Right column
      y = detailsY + 30;
      
      // Workshop Details
      doc.font("Helvetica-Bold").fillColor("#444").text("Event:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text("AI Workshop for Teachers", rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#444").text("Date:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text("August 2nd, 2025", rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#444").text("Timings:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text("10:45 AM - 1:00 PM", rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#444").text("Venue:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text("Bullayya College", rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#444").text("Paid:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text("299", rightX + labelOffsetRight, y, { width: colWidth - 80 });

      doc.y = detailsY + boxHeight + 30;

      // --- FOOTER ---
      // Website note
      const noteText = "Explore our website to learn more";
      const noteWidth = doc.widthOfString(noteText);
      doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#333")
        .text(noteText, centerX - noteWidth / 2, doc.y);

      // Website link
      const url = "www.teckybot.com";
      const urlWidth = doc.widthOfString(url);
      doc.font("Helvetica")
        .fontSize(11)
        .fillColor("blue")
        .text(url, centerX - urlWidth / 2, doc.y + 6, {
          link: "https://www.teckybot.com/",
          underline: true
        });

      // Thank you + queries aligned right
      const footerY = doc.y + 35;

      doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#555")
        .text("Thank you for registering", doc.page.width - 200, footerY, {
          align: "right",
          width: 150
        });

      doc.font("Helvetica")
        .fontSize(10)
        .fillColor("#1a73e8")
        .text("For queries: info@teckybot.com", doc.page.width - 200, footerY + 15, {
          align: "right",
          width: 150
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};