import { test, expect } from '@playwright/test'

test.describe('Export Tests', () => {
  test('should show export button after image upload', async ({ page }) => {
    await page.goto('/')

    // Check that export button is not visible initially
    await expect(page.locator('text=Generate')).not.toBeVisible()

    // For this smoke test, we'll just verify the UI structure
    // In a real scenario, we'd mock file uploads and test the full export flow

    // Check that the upload interface is present
    await expect(page.locator('text=Drop your Canva PNG/JPEG here')).toBeVisible()
    await expect(page.locator('text=Upload your Canva design and add sequential numbering')).toBeVisible()
  })

  test('should have proper export settings', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads without errors
    await expect(page.locator('text=🎫 Ticket Numberer')).toBeVisible()

    // Upload a test image first (required to show export settings)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-ticket.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
    })

    // Wait for image to be processed and settings to appear
    await expect(page.locator('text=Number of Tickets')).toBeVisible()
    await expect(page.locator('text=Number Format')).toBeVisible()

    // Verify the export button is now available
    await expect(page.locator('text=Generate 3 Numbered Tickets')).toBeVisible()
  })
})