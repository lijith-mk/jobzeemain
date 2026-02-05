const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

/**
 * Certificate PDF Generator
 * Generates beautiful PDF certificates from HTML templates
 */

// Helper to format dates
Handlebars.registerHelper('formatDate', function(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Helper for conditional rendering
Handlebars.registerHelper('if', function(conditional, options) {
  if (conditional) {
    return options.fn(this);
  }
  return options.inverse(this);
});

// Helper for each loop
Handlebars.registerHelper('each', function(context, options) {
  let ret = '';
  if (context && context.length > 0) {
    for (let i = 0; i < context.length; i++) {
      ret += options.fn(context[i]);
    }
  }
  return ret;
});

/**
 * Generate PDF certificate
 * @param {Object} certificateData - Certificate data
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateCertificatePDF(certificateData) {
  let browser;
  
  try {
    // Prepare certificate data
    const data = {
      certificateId: certificateData.certificateId,
      userName: certificateData.userName,
      courseName: certificateData.courseName,
      courseLevel: certificateData.courseLevel || 'N/A',
      courseCategory: formatCategory(certificateData.courseCategory),
      grade: certificateData.grade || null,
      honors: certificateData.honors || false,
      skillsAchieved: certificateData.skillsAchieved || [],
      issueDate: formatDate(certificateData.issuedAt),
      year: new Date(certificateData.issuedAt).getFullYear(),
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-certificate/${certificateData.certificateId}`
    };

    // Read HTML template
    const templatePath = path.join(__dirname, '../templates/certificateTemplate.html');
    const templateHtml = await fs.readFile(templatePath, 'utf-8');

    // Compile template with Handlebars
    const template = Handlebars.compile(templateHtml);
    const html = template(data);

    // Launch headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content and wait for fonts and images to load
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded']
    });

    // Generate PDF with high quality
    const pdfBuffer = await page.pdf({
      width: '1200px',
      height: '850px',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    return pdfBuffer;

  } catch (error) {
    console.error('Certificate PDF generation error:', error);
    throw new Error(`Failed to generate certificate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate certificate and save to disk
 * @param {Object} certificateData - Certificate data
 * @param {String} outputDir - Output directory
 * @returns {Promise<String>} - File path
 */
async function generateAndSaveCertificate(certificateData, outputDir = 'uploads/certificates') {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generateCertificatePDF(certificateData);

    // Ensure output directory exists
    const absoluteOutputDir = path.join(__dirname, '..', outputDir);
    await fs.mkdir(absoluteOutputDir, { recursive: true });

    // Generate filename
    const filename = `certificate_${certificateData.certificateId}_${Date.now()}.pdf`;
    const filePath = path.join(absoluteOutputDir, filename);

    // Write PDF to file
    await fs.writeFile(filePath, pdfBuffer);

    // Return relative path for storage
    const relativePath = `${outputDir}/${filename}`;
    
    console.log(`Certificate generated: ${relativePath}`);
    
    return {
      filePath: relativePath,
      absolutePath: filePath,
      filename: filename
    };

  } catch (error) {
    console.error('Save certificate error:', error);
    throw error;
  }
}

/**
 * Generate certificate and return buffer (for streaming)
 * @param {Object} certificateData - Certificate data
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateCertificateBuffer(certificateData) {
  try {
    const pdfBuffer = await generateCertificatePDF(certificateData);
    return pdfBuffer;
  } catch (error) {
    console.error('Generate certificate buffer error:', error);
    throw error;
  }
}

/**
 * Helper: Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Helper: Format category
 */
function formatCategory(category) {
  if (!category) return 'General';
  
  const categoryMap = {
    'web-development': 'Web Development',
    'data-science': 'Data Science',
    'mobile-development': 'Mobile Development',
    'cloud-computing': 'Cloud Computing',
    'cybersecurity': 'Cybersecurity',
    'design': 'Design',
    'business': 'Business',
    'marketing': 'Marketing',
    'soft-skills': 'Soft Skills',
    'other': 'Other'
  };

  return categoryMap[category] || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Batch generate certificates
 * @param {Array} certificatesData - Array of certificate data
 * @param {String} outputDir - Output directory
 * @returns {Promise<Array>} - Array of results
 */
async function batchGenerateCertificates(certificatesData, outputDir = 'uploads/certificates') {
  const results = [];

  for (const certData of certificatesData) {
    try {
      const result = await generateAndSaveCertificate(certData, outputDir);
      results.push({
        success: true,
        certificateId: certData.certificateId,
        ...result
      });
    } catch (error) {
      results.push({
        success: false,
        certificateId: certData.certificateId,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Delete certificate file
 * @param {String} filePath - File path to delete
 */
async function deleteCertificateFile(filePath) {
  try {
    const absolutePath = path.join(__dirname, '..', filePath);
    await fs.unlink(absolutePath);
    console.log(`Certificate deleted: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Delete certificate error:', error);
    return false;
  }
}

/**
 * Check if certificate file exists
 * @param {String} filePath - File path
 * @returns {Promise<Boolean>}
 */
async function certificateFileExists(filePath) {
  try {
    const absolutePath = path.join(__dirname, '..', filePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  generateCertificatePDF,
  generateAndSaveCertificate,
  generateCertificateBuffer,
  batchGenerateCertificates,
  deleteCertificateFile,
  certificateFileExists
};
