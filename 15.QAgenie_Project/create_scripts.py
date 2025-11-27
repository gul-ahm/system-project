import json
import os

def create_playwright_scripts():
    """Reads the JSON test plan and generates Playwright script skeletons."""
    input_file = "playwright_test_plan.json"
    output_dir = "tests"

    if not os.path.exists(input_file):
        print(f"Error: Test plan '{input_file}' not found. Please generate it first.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        test_plan = json.load(f)

    for test_case in test_plan:
        test_id = test_case.get("test_case_id", "test").replace(" ", "_").lower()
        description = test_case.get("description", "unnamed_test")
        steps = test_case.get("steps", [])

        # Create a safe filename
        file_name = f"{test_id}.spec.js"
        file_path = os.path.join(output_dir, file_name)

        with open(file_path, "w", encoding="utf-8") as f:
            # Write the Playwright test header
            f.write("const { test, expect } = require('@playwright/test');\n\n")
            f.write(f"test('{description}', async ({{ page }}) => {{\n")

            # Write each step as a comment and a placeholder action
            f.write("  // TODO: Replace with the actual URL of the application under test\n")
            f.write("  await page.goto('https://recruiter.ai/');\n\n")

            for step in steps:
                # Sanitize step for use in a comment
                clean_step = step.replace("'", "\\'")
                f.write(f"  // Step: {clean_step}\n")
                f.write("  // TODO: Implement Playwright code for this step.\n")
                f.write("  // Example: await expect(page.locator('body')).toContainText('Welcome');\n\n")

            f.write("});\n")

    print(f"Generated {len(test_plan)} Playwright script skeletons in the '{output_dir}' directory.")

if __name__ == "__main__":
    create_playwright_scripts()