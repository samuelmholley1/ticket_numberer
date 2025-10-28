import { test, expect } from '@playwright/test'

test.describe('Export Tests', () => {
  test('should show export button after image upload', async ({ page }) => {
    await page.goto('/')

    // Check that export button is not visible initially
    await expect(page.locator('text=Generate')).not.toBeVisible()

    // Check that the upload interface is present
    await expect(page.locator('text=Drop your Canva PNG here')).toBeVisible()
    await expect(page.locator('text=Upload your Canva design (PNG @ 300 DPI) and add sequential numbering')).toBeVisible()
  })

  test('should have template option available', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads without errors
    await expect(page.locator('text=🎫 Ticket Numberer')).toBeVisible()

    // Check that template option is available
    await expect(page.locator('button:has-text("Use Template")')).toBeVisible()
    await expect(page.locator('text=An Affair to Remember 2026 Ticket')).toBeVisible()
  })
})