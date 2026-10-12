const { chromium } = require('../frontend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:5174';
const CSV_PATH = path.resolve(__dirname, '../samples/recipients_with_empty.csv');
const TXT_PATH = path.resolve(__dirname, '../samples/recipients.txt');
const XLSX_PATH = path.resolve(__dirname, '../samples/recipients.xlsx');
const CUSTOM_BG_PATH = path.resolve(__dirname, '../samples/sample_cert_bg.png');

async function captureDual(page, name) {
  // Desktop 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}_1440px.png`), fullPage: true });

  // Mobile 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}_375px.png`), fullPage: true });

  // Reset to desktop for next operations
  await page.setViewportSize({ width: 1440, height: 900 });
}

async function run() {
  console.log('🚀 Launching Chromium browser for web-only client app verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleLogs.push(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    consoleLogs.push(`[Page Error] ${err.message}`);
  });

  try {
    console.log(`🌐 Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await captureDual(page, '01_initial_empty_state');
    console.log('✓ Captured 01_initial_empty_state (1440px & 375px)');

    // 1. Import CSV with 5 names where one row has an empty name
    console.log('\n📄 Step 1: Importing CSV with empty name row...');
    const fileInput = page.locator('input[name="recipientFile"]');
    await fileInput.setInputFiles(CSV_PATH);
    await page.waitForSelector('.preview-table');
    await page.waitForTimeout(500);

    const rowCount = await page.locator('.preview-table tbody tr').count();
    console.log(`✓ CSV loaded: ${rowCount} rows found in table.`);
    const summaryText = await page.locator('.recipients-count-line').textContent();
    console.log(`✓ Summary text: "${summaryText.trim()}"`);

    await captureDual(page, '02_csv_imported_with_empty_row');
    console.log('✓ Captured 02_csv_imported_with_empty_row');

    // 2. Import plain TXT
    console.log('\n📄 Step 2: Importing plain TXT...');
    await fileInput.setInputFiles(TXT_PATH);
    await page.waitForTimeout(500);
    const txtRowCount = await page.locator('.preview-table tbody tr').count();
    console.log(`✓ TXT loaded: ${txtRowCount} rows found.`);
    await captureDual(page, '03_txt_imported');
    console.log('✓ Captured 03_txt_imported');

    // 3. Import XLSX
    console.log('\n📄 Step 3: Importing XLSX spreadsheet...');
    await fileInput.setInputFiles(XLSX_PATH);
    await page.waitForSelector('.mapping-card');
    await page.waitForTimeout(500);
    const xlsxRowCount = await page.locator('.preview-table tbody tr').count();
    console.log(`✓ XLSX loaded: ${xlsxRowCount} rows found with column mapping visible.`);
    await captureDual(page, '04_xlsx_imported_mapping');
    console.log('✓ Captured 04_xlsx_imported_mapping');

    // Re-import the CSV with empty row so we test failed recipient tracking
    console.log('\n📄 Re-loading CSV for batch generation test...');
    await fileInput.setInputFiles(CSV_PATH);
    await page.waitForTimeout(500);

    // 4. Pick a built in template, choose PNG, fill details, generate
    console.log('\n🎨 Step 4: Selecting built-in template, PNG format, and generating...');
    // Select first template card
    const firstTemplateCard = page.locator('.template-card').first();
    await firstTemplateCard.click();

    // Select PNG in segmented control
    await page.locator('button.segmented-btn:has-text("PNG")').click();

    // Fill Title
    await page.locator('input[name="certificateTitle"]').fill('Full-Stack Software Architecture');
    await page.locator('input[name="organizationName"]').fill('Metropolitan Engineering Academy');

    await captureDual(page, '05_configured_ready_to_generate');
    console.log('✓ Captured 05_configured_ready_to_generate');

    // Click Generate
    console.log('🚀 Triggering batch generation...');
    const generateBtn = page.locator('button.btn-primary-generate');
    await generateBtn.click();

    // Wait for Section 4 Status Panel to appear and progress to complete
    await page.waitForSelector('#section-status');
    console.log('⏳ Generation in progress, polling status...');

    // Wait until completed or completed_with_errors
    await page.waitForSelector('.btn-zip-download, .completion-actions-row', { timeout: 30000 });
    await page.waitForTimeout(1000);

    const finalStatusTag = await page.locator('#section-status .section-status-tag').textContent();
    console.log(`✓ Batch finished with status: "${finalStatusTag.trim()}"`);

    // Verify failed table has row
    const failedRowsCount = await page.locator('.failed-section-container tbody tr').count();
    console.log(`✓ Failed recipients recorded in table: ${failedRowsCount}`);
    if (failedRowsCount > 0) {
      const failedReason = await page.locator('.failed-section-container tbody tr td').last().textContent();
      console.log(`✓ Recorded failure reason: "${failedReason.trim()}"`);
    }

    await captureDual(page, '06_batch_completed_with_failed_table');
    console.log('✓ Captured 06_batch_completed_with_failed_table');

    // Test downloading ZIP
    console.log('📦 Testing ZIP download link for built-in batch...');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.btn-zip-download').click(),
    ]);
    const downloadPath = path.join(SCREENSHOT_DIR, 'batch_certificates_builtin.zip');
    await download.saveAs(downloadPath);
    const stats = fs.statSync(downloadPath);
    console.log(`✓ Downloaded built-in ZIP successfully (${stats.size} bytes).`);

    // 5. Test Custom Template Studio
    console.log('\n🎨 Step 5: Testing Custom Template Studio Upload & Preview...');
    // Click "Start New Batch"
    await page.locator('button:has-text("Start New Batch")').click();
    await page.waitForSelector('#section-recipients');

    // Re-load 5 sample recipients
    await page.locator('button:has-text("Load 5 sample recipients")').click();
    await page.waitForTimeout(300);

    // Open Custom Template Modal
    await page.locator('.template-upload-card').click();
    await page.waitForSelector('.modal-overlay');

    // Modal desktop/mobile capture
    await page.locator('input[name="templateName"]').fill('Executive Leadership Award');
    await page.locator('input[name="templateImage"]').setInputFiles(CUSTOM_BG_PATH);
    await page.waitForSelector('.studio-canvas-container');
    await page.waitForTimeout(500);

    // Test Sample Render
    await page.locator('input[name="sampleRecipientName"]').fill('Dr. Alan Turing');
    await page.locator('button:has-text("Test")').click();
    await page.waitForSelector('img[alt="Server render test preview"]', { timeout: 15000 });

    await captureDual(page, '07_custom_template_studio_modal');
    console.log('✓ Captured 07_custom_template_studio_modal');

    // Save and select custom template
    await page.locator('button:has-text("Save & Select Template")').click();
    await page.waitForSelector('.custom-template-notice');
    console.log('✓ Custom template created and notice is visible.');

    await captureDual(page, '08_custom_template_selected_notice');
    console.log('✓ Captured 08_custom_template_selected_notice');

    // Generate batch with custom template in PDF format
    console.log('🚀 Generating batch with custom template (PDF format)...');
    await page.locator('button.segmented-btn:has-text("PDF")').click();
    await page.locator('button.btn-primary-generate').click();
    await page.waitForSelector('.btn-zip-download', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Test downloading Custom Batch ZIP
    console.log('📦 Testing custom batch ZIP download link...');
    const [customDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('.btn-zip-download').click(),
    ]);
    const customDownloadPath = path.join(SCREENSHOT_DIR, 'batch_certificates_custom.zip');
    await customDownload.saveAs(customDownloadPath);
    const customStats = fs.statSync(customDownloadPath);
    console.log(`✓ Downloaded custom ZIP successfully (${customStats.size} bytes).`);

    await captureDual(page, '09_custom_batch_complete_zip');
    console.log('✓ Captured 09_custom_batch_complete_zip');

    console.log('\n=======================================');
    console.log('🎉 ALL CLIENT-ONLY BROWSER VERIFICATION STEPS PASSED!');
    console.log(`Console errors encountered: ${consoleLogs.length}`);
    if (consoleLogs.length > 0) {
      console.log(consoleLogs.join('\n'));
    }
    console.log('=======================================');

  } catch (err) {
    console.error('❌ Verification failed with error:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png'), fullPage: true });
    throw err;
  } finally {
    await browser.close();
  }
}

run();
