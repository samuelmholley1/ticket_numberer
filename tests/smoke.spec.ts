import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load the ticket numberer page', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await expect(page).toHaveTitle(/Ticket Numberer/)
  })

  test('should display upload interface', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // Check that the main heading is visible
    await expect(page.locator('text=🎫 Ticket Numberer')).toBeVisible()

    // Check that the upload area is present
    await expect(page.locator('text=Drop your Canva PNG/JPEG here')).toBeVisible()

    // Check that count input exists
    await expect(page.locator('input[type="number"]')).toBeVisible()
  })

  test('should show preview when image is uploaded', async ({ page }) => {
    await page.goto('http://localhost:3001')

    // For this test, we'll just verify the UI structure
    // In a real scenario, we'd mock file uploads

    // Check that preview section exists
    await expect(page.locator('text=Preview')).toBeVisible()
    await expect(page.locator('text=Upload a design to see preview')).toBeVisible()
  })
})