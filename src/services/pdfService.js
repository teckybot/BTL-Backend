// src/services/pdfService.js
import PDFDocument from "pdfkit";

export const generateSchoolPDF = (schoolData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // PDF Content
      doc.fontSize(20).text("School Registration Confirmation", { align: "center" });
      doc.moveDown();

      doc.fontSize(14).text(`School ID: ${schoolData.schoolRegId}`);
      doc.text(`School Name: ${schoolData.schoolName}`);
      doc.text(`Principal: ${schoolData.principalName}`);
      doc.text(`Email: ${schoolData.schoolEmail}`);
      doc.text(`Coordinator: ${schoolData.coordinatorName}`);
      doc.text(`State: ${schoolData.state}`);
      doc.text(`District: ${schoolData.district}`);
      doc.text(`Address: ${schoolData.schoolAddress}`);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};


export const generateTeamPDF = (TeamData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // PDF Content
      doc.fontSize(20).text("Team Registration Confirmation", { align: "center" });
      doc.moveDown();

      doc.fontSize(14).text(`Team ID: ${TeamData.teamRegId}`);
      // doc.text(`School Name: ${TeamData.schoolName}`);
      // doc.text(`Principal: ${schoolData.principalName}`);
      // doc.text(`Email: ${schoolData.schoolEmail}`);
      // doc.text(`Coordinator: ${schoolData.coordinatorName}`);
      // doc.text(`State: ${schoolData.state}`);
      // doc.text(`District: ${schoolData.district}`);
      // doc.text(`Address: ${schoolData.schoolAddress}`);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};