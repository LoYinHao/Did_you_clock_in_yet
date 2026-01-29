<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1eFHB7gI6c5mI7sWrraqKBZAZX_cauxF_

## Run Locally

**Prerequisites:**  Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables:
   - Create `.env` (or copy `.env.local`)
   - Add your API keys (e.g., `GEMINI_API_KEY`)

3. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

### GitHub Pages (Automated)

This project is configured to deploy to GitHub Pages automatically via GitHub Actions.

1. Push your changes to the `main` or `master` branch.
2. Go to your repository **Settings** -> **Pages**.
3. Under **Build and deployment**, select **Source** as `Deploy from a branch`.
4. However, with the Custom GitHub Action included (`.github/workflows/deploy.yml`), you should actually select **Source** as **GitHub Actions** (if not auto-selected).
   - *Note: Steps may vary slightly, but the Action handles the build and deploy.*
5. Once the Action completes, your site will be live at `https://<your-username>.github.io/Did_you_clock_in_yet/`.
