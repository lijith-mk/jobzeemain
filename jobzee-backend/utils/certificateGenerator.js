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

    // Launch headless browser with production-friendly config
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    };

    // Set executable path for production
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log(`[Puppeteer] Using custom executable: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    }

    console.log('[Puppeteer] Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log('[Puppeteer] Browser launched successfully');

    const page = await browser.newPage();

    // Bypass CSP for PDF generation
    await page.setBypassCSP(true);
    
    // Set content with timeout
    console.log('[Puppeteer] Setting page content...');
    await page.setContent(html, {
      waitUntil: ['load', 'domcontentloaded'],
      timeout: 30000
    });
    console.log('[Puppeteer] Page content set');

    // Wait a bit for any fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Generate PDF with high quality
    console.log('[Puppeteer] Generating PDF...');
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
    console.log('[Puppeteer] PDF generated successfully');

    return pdfBuffer;

  } catch (error) {
    console.error('[Certificate Generator] Error:', error);
    console.error('[Certificate Generator] Stack:', error.stack);
    
    // Provide more specific error messages
    if (error.message.includes('Failed to launch')) {
      throw new Error(`Puppeteer launch failed. Please ensure Chrome/Chromium is installed. Original error: ${error.message}`);
    } else if (error.message.includes('ENOENT')) {
      throw new Error(`Certificate template file not found. Please check the template path.`);
    } else {
      throw new Error(`Failed to generate certificate PDF: ${error.message}`);
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('[Puppeteer] Browser closed');
      } catch (closeError) {
        console.error('[Puppeteer] Error closing browser:', closeError);
      }
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
