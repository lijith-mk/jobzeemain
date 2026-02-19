/**
 * Test Certificate PDF Generation with Fixed Layout
 * Run: node test-certificate-pdf.js
 */

require('dotenv').config();
const { generateCertificatePDF } = require('./utils/certificateGenerator');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 TESTING CERTIFICATE PDF GENERATION');
  console.log('='.repeat(60));
  console.log('');

  // Test certificate data
  const testData = {
    certificateId: 'TEST-2026-ABC123',
    userName: 'John Doe',
    courseName: 'Full Stack Web Development',
    courseLevel: 'Advanced',
    courseCategory: 'Web Development',
    grade: 'A+',
    honors: true,
    skillsAchieved: ['React', 'Node.js', 'MongoDB', 'REST APIs', 'Authentication'],
    issuedAt: new Date(),
  };

  console.log('📋 Certificate Data:');
  console.log('   User:', testData.userName);
  console.log('   Course:', testData.courseName);
  console.log('   Level:', testData.courseLevel);
  console.log('   Grade:', testData.grade);
  console.log('   Honors:', testData.honors ? 'Yes' : 'No');
  console.log('');

  try {
    console.log('📝 Generating PDF certificate...');
    const pdfBuffer = await generateCertificatePDF(testData);
    
    // Save to file
    const outputPath = path.join(__dirname, 'test-certificate-sample.pdf');
    await fs.writeFile(outputPath, pdfBuffer);
    
    console.log('✅ Certificate generated successfully!');
    console.log('');
    console.log('📄 PDF saved to:', outputPath);
    console.log('   File size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(60));
    console.log('');
    console.log('📌 Open the PDF file to verify:');
    console.log('   - No overlapping text');
    console.log('   - Proper alignment of all elements');
    console.log('   - Certificate ID appears only once (top right)');
    console.log('   - Footer sections are properly spaced');
    console.log('   - Verification URL is visible at bottom');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error generating certificate:', error.message);
    console.error('');
    console.error('Details:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
