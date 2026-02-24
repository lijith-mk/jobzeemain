/**
 * Simple Certificate Generator (Fallback)
 * Uses minimal HTML/CSS without complex rendering
 * For when Puppeteer fails on resource-constrained environments
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a simple certificate using PDFKit
 * @param {Object} certificateData 
 * @returns {Promise<Buffer>}
 */
async function generateSimpleCertificatePDF(certificateData) {
  return new Promise((resolve, reject) => {
    try {
      console.log('[Simple Certificate] Starting generation...');
      
      const doc = new PDFDocument({
        size: [1200, 850],
        margins: { top: 60, bottom: 60, left: 80, right: 80 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        console.log('[Simple Certificate] PDF generated successfully');
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);

      // Background gradient effect (simulate with rectangles)
      doc.rect(0, 0, 1200, 850)
         .fillAndStroke('#f8f9ff', '#e0e7ff');

      // Border
      doc.rect(30, 30, 1140, 790)
         .lineWidth(3)
         .strokeColor('#667eea')
         .stroke();

      doc.rect(40, 40, 1120, 770)
         .lineWidth(1)
         .strokeColor('#a5b4fc')
         .stroke();

      // Header - Logo/Brand
      doc.fontSize(44)
         .fillColor('#667eea')
         .font('Helvetica-Bold')
         .text('JOBZEE', 0, 80, { align: 'center' });

      doc.fontSize(16)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Learning Platform', 0, 135, { align: 'center' });

      // Certificate Title
      doc.fontSize(32)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text('CERTIFICATE OF COMPLETION', 0, 200, { align: 'center' });

      doc.fontSize(14)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('This is to certify that', 0, 250, { align: 'center' });

      // Student Name
      doc.fontSize(38)
         .fillColor('#4338ca')
         .font('Helvetica-Bold')
         .text(certificateData.userName || 'Student Name', 0, 290, { align: 'center' });

      doc.fontSize(14)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('has successfully completed the course', 0, 350, { align: 'center' });

      // Course Name
      doc.fontSize(28)
         .fillColor('#1f2937')
         .font('Helvetica-Bold')
         .text(certificateData.courseName || 'Course Name', 100, 390, { 
           align: 'center',
           width: 1000
         });

      // Course Details
      const category = certificateData.courseCategory || 'General';
      const level = certificateData.courseLevel || 'All Levels';
      
      doc.fontSize(14)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(`Category: ${category}  |  Level: ${level}`, 0, 460, { align: 'center' });

      // Grade & Honors (if applicable)
      if (certificateData.grade) {
        doc.fontSize(18)
           .fillColor('#10b981')
           .font('Helvetica-Bold')
           .text(`Grade: ${certificateData.grade}`, 0, 500, { align: 'center' });
      }

      if (certificateData.honors) {
        doc.fontSize(16)
           .fillColor('#f59e0b')
           .font('Helvetica-Bold')
           .text('🏆 WITH HONORS', 0, 530, { align: 'center' });
      }

      // Skills (if provided)
      if (certificateData.skillsAchieved && certificateData.skillsAchieved.length > 0) {
        const skillsText = certificateData.skillsAchieved.slice(0, 5).join(' • ');
        doc.fontSize(12)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(`Skills: ${skillsText}`, 100, 580, { 
             align: 'center',
             width: 1000
           });
      }

      // Date and Certificate ID
      const issueDate = certificateData.issuedAt 
        ? new Date(certificateData.issuedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('en-US');

      doc.fontSize(12)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(`Issued on: ${issueDate}`, 0, 680, { align: 'center' });

      doc.fontSize(10)
         .fillColor('#9ca3af')
         .text(`Certificate ID: ${certificateData.certificateId}`, 0, 705, { align: 'center' });

      // Verification URL
      const verificationUrl = `${process.env.FRONTEND_URL || 'https://jobzee.com'}/verify-certificate/${certificateData.certificateId}`;
      
      doc.fontSize(10)
         .fillColor('#4f46e5')
         .text(`Verify at: ${verificationUrl}`, 0, 725, { align: 'center' });

      // Signature line
      doc.moveTo(400, 760)
         .lineTo(800, 760)
         .strokeColor('#9ca3af')
         .stroke();

      doc.fontSize(12)
         .fillColor('#6b7280')
         .text('Authorized Signature', 0, 770, { align: 'center' });

      // Footer
      doc.fontSize(9)
         .fillColor('#9ca3af')
         .text('© Jobzee Learning Platform - All Rights Reserved', 0, 810, { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('[Simple Certificate] Error:', error);
      reject(error);
    }
  });
}

/**
 * Generate and save simple certificate
 * @param {Object} certificateData 
 * @param {String} outputDir 
 * @returns {Promise<Object>}
 */
async function generateAndSaveSimpleCertificate(certificateData, outputDir = 'uploads/certificates') {
  try {
    const pdfBuffer = await generateSimpleCertificatePDF(certificateData);

    // Ensure output directory exists
    const absoluteOutputDir = path.join(__dirname, '..', outputDir);
    if (!fs.existsSync(absoluteOutputDir)) {
      fs.mkdirSync(absoluteOutputDir, { recursive: true });
    }

    // Generate filename
    const filename = `certificate_${certificateData.certificateId}_${Date.now()}.pdf`;
    const filePath = path.join(absoluteOutputDir, filename);

    // Write PDF to file
    fs.writeFileSync(filePath, pdfBuffer);

    // Return relative path for storage
    const relativePath = `${outputDir}/${filename}`;
    
    console.log(`[Simple Certificate] Saved: ${relativePath}`);
    
    return {
      filePath: relativePath,
      absolutePath: filePath,
      filename: filename
    };

  } catch (error) {
    console.error('[Simple Certificate] Save error:', error);
    throw error;
  }
}

module.exports = {
  generateSimpleCertificatePDF,
  generateAndSaveSimpleCertificate
};
