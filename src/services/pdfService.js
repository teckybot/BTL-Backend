// src/services/pdfService.js
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';


// Get __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../data/BTL2025_logo.png');

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
      const headerHeight = 60;
      doc.save();
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#f5f8fa");
      // Logo (about 40px tall, vertically centered)
      try {
        if (fs.existsSync(LOGO_PATH)) {
          doc.image(LOGO_PATH, 30, 1, { width: 65, height: 58 });
        }
      } catch (e) { /* ignore logo errors */ }
      // Event name (centered)
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#1a73e8");
      const eventTitle = "Bharat Tech League 2025";
      const eventTitleWidth = doc.widthOfString(eventTitle);
      doc.text(eventTitle, (doc.page.width - eventTitleWidth) / 2, (headerHeight - 18) / 2, {
        width: eventTitleWidth,
        align: "center",
        continued: false
      });
      // School Reg ID (right, vertically centered)
      doc.font("Helvetica").fontSize(10).fillColor("#000000");
      const regIdText = `School Reg ID: ${schoolData.schoolRegId}`;
      const regIdWidth = doc.widthOfString(regIdText);
      doc.text(regIdText, doc.page.width - 50 - regIdWidth, (headerHeight - 10) / 2, {
        width: regIdWidth,
        align: "right"
      });
      doc.restore();

      // --- TITLE ---
      const titleStartY = doc.y + 50;
      const centerX = doc.page.width / 2;
      // Title line
      doc.font("Helvetica-Bold").fontSize(22).fillColor("#222");
      const titleText = "School Registration Successfully";
      const titleWidth = doc.widthOfString(titleText);
      doc.text(titleText, centerX - titleWidth / 2, titleStartY);
      // Subtitle line
      const subtitleText = `${schoolData.schoolName}`;
      doc.font("Helvetica").fontSize(14).fillColor("#1a73e8");
      const subtitleWidth = doc.widthOfString(subtitleText);
      doc.text(subtitleText, centerX - subtitleWidth / 2, titleStartY + 30);
      doc.moveDown(3);

      // --- SCHOOL DETAILS BOX ---
      const boxMarginX = 40;
      const boxWidth = doc.page.width - 2 * boxMarginX;
      const boxHeight = 220;
      const detailsY = doc.y;
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#1a73e8").text("School Details", boxMarginX, detailsY - 20);
      doc.save();
      doc.roundedRect(boxMarginX, detailsY, boxWidth, boxHeight, 10).fillAndStroke("#f2f6fc", "#e0edfd");
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
      const labelOffsetLeft = 105;
      const labelOffsetRight = 85;
      
      // Left column
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("School ID:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolRegId, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("School Name:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("Principal Name:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.principalName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("State:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.state, leftX + labelOffsetLeft, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;
        
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("District:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.district, leftX + labelOffsetLeft, y, { width: colWidth - 80 });
      doc.y = detailsY + boxHeight + 20;
      
      // Reset y for right column
      y = detailsY + 30;
      // Right column
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("Coordinator:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.coordinatorName, rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;

      // Address (can wrap)
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text('Address:',rightX,y);

      const addressOptions = { width: colWidth - 80 };
      const addressHeight = doc.heightOfString(schoolData.schoolAddress || "N/A", addressOptions);

      doc.font('Helvetica').fillColor("#222").text(schoolData.schoolAddress || "N/A", rightX + labelOffsetRight, y, addressOptions);

      y += lineHeight + rowSpacing;

      doc.y = detailsY + boxHeight + 30;
      // --- FOOTER ---
      doc.fontSize(11).fillColor("#1a73e8").font("Helvetica-Bold")
        .text("Thank you for registering!", { align: "center" });
      doc.fontSize(9).fillColor("#00000").font("Helvetica")
        .text("For queries: support@bharatteckleague.com", { align: "center" });

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
      const headerHeight = 60;
      doc.save();
      doc.rect(0, 0, doc.page.width, headerHeight).fill("#f5f8fa");
      // Logo (about 40px tall, vertically centered)
      let logoDrawn = false;
      try {
        if (fs.existsSync(LOGO_PATH)) {
          doc.image(LOGO_PATH, 30, 1, { width: 65, height: 58 });
          logoDrawn = true;
        }
      } catch (e) { /* ignore logo errors */ }
      // Event name (centered)
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#1a73e8");
      const eventTitle = "Bharat Tech League 2025";
      const eventTitleWidth = doc.widthOfString(eventTitle);
      doc.text(eventTitle, (doc.page.width - eventTitleWidth) / 2, (headerHeight - 18) / 2, {
        width: eventTitleWidth,
        align: "center",
        continued: false
      });
      // School Reg ID (right, vertically centered)
      doc.font("Helvetica").fontSize(10).fillColor("#000000");
      const regIdText = `School Reg ID: ${schoolData.schoolRegId}`;
      const regIdWidth = doc.widthOfString(regIdText);
      doc.text(regIdText, doc.page.width - 50 - regIdWidth, (headerHeight - 10) / 2, {
        width: regIdWidth,
        align: "right"
      });
      doc.restore();

      // TITLE
      // Define coordinates manually (override default flow-based layout)
      const titleStartY = doc.y + 50; // Adjust Y manually as needed
      const centerX = doc.page.width / 2;

      // Title line: "Team Registration Confirmation"
      doc.font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#222");

      // Measure title width for exact center placement
      const titleText = "Teams Registered Successfully";
      const titleWidth = doc.widthOfString(titleText);
      doc.text(titleText, centerX - titleWidth / 2, titleStartY);

      // Subtitle line: "for XYZ School"
      const subtitleText = `${schoolData.schoolName}`;
      doc.font("Helvetica")
        .fontSize(14)
        .fillColor("#1a73e8");

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

      const labelOffsetLeft = 105;
      const labelOffsetRight = 85;

      // Left column
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("School ID:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolRegId, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("School Name:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.schoolName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.fontSize(labelFontSize).font("Helvetica-Bold").fillColor("#1a73e8").text("Principal Name:", leftX, y);
      doc.fontSize(valueFontSize).font("Helvetica").fillColor("#222").text(schoolData.principalName, leftX + labelOffsetLeft, y, { width: colWidth - 90 });
      y += lineHeight + rowSpacing;
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("State:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.state, leftX + labelOffsetLeft, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;
        
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("District:", leftX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.district, leftX + labelOffsetLeft, y, { width: colWidth - 80 });
      doc.y = detailsY + boxHeight + 20;
      
      // Reset y for right column
      y = detailsY + 30;
      // Right column
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text("Coordinator:", rightX, y);
      doc.font("Helvetica").fillColor("#222").text(schoolData.coordinatorName, rightX + labelOffsetRight, y, { width: colWidth - 80 });
      y += lineHeight + rowSpacing;

      // Address (can wrap)
      doc.font("Helvetica-Bold").fillColor("#1a73e8").text('Address:',rightX,y);

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
      const headers = ["Team ID", "Event", "Size", "Members"];
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
      (teamsData || []).forEach((team, idx) => {
        x = tableX;
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
      doc.y = rowY + 30;

      doc.fontSize(11).fillColor("#1a73e8").font("Helvetica-Bold")
        .text("Thank you for registering!", { align: "center" });
      doc.fontSize(9).fillColor("#00000").font("Helvetica")
        .text("For queries: support@bharatteckleague.com", { align: "center" });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};