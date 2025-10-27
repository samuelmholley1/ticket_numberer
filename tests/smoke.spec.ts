import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should export 3 sample tickets with correct filenames', async ({
    page,
  }) => {
    // Navigate to the ticket builder
    await page.goto('http://localhost:3000')

    // Set up a simple ticket configuration
    // Note: These selectors would need to match the actual UI
    await page.fill('[data-testid="ticket-count"]', '3')
    await page.fill('[data-testid="ticket-prefix"]', 'TEST-')
    await page.fill('[data-testid="ticket-padding"]', '3')

    // Click export button
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()

    // Wait for export to complete (this would need to be implemented in the app)
    await page.waitForSelector('[data-testid="export-complete"]')

    // Verify that downloads were triggered with correct filenames
    // Note: In a real implementation, you'd need to handle download events
    // This is a placeholder for the actual test logic

    const downloads = page.locator('[data-testid="download-links"]')
    await expect(downloads).toHaveCount(3)

    // Check filenames
    await expect(page.locator('[data-testid="filename-1"]')).toHaveText(
      'TEST-001.png'
    )
    await expect(page.locator('[data-testid="filename-2"]')).toHaveText(
      'TEST-002.png'
    )
    await expect(page.locator('[data-testid="filename-3"]')).toHaveText(
      'TEST-003.png'
    )
  })

  test('should load the ticket builder page', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Ticket Builder/)
  })
})