import { expect, test } from "@playwright/test"

test("formats JSON input larger than the WebAssembly stack", async ({ page }) => {
  const dialogs: string[] = []
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message())
    await dialog.dismiss()
  })

  await page.goto("/")
  const input = JSON.stringify([{ description: "x".repeat(70 * 1024) }])
  const textarea = page.getByPlaceholder("Paste JSON here")
  const lint = page.locator('input[type="submit"]')

  expect(new TextEncoder().encode(input).byteLength).toBeGreaterThan(64 * 1024)
  await textarea.fill(input)
  await lint.click()
  await expect(textarea).not.toHaveValue(input)
  await expect(lint).toHaveValue("Lint")

  expect(dialogs).toEqual([])
  expect(JSON.parse(await textarea.inputValue())).toEqual(JSON.parse(input))
})
