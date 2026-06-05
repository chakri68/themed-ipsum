import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// On GitHub Actions, GITHUB_REPOSITORY is "owner/repo". Project Pages are
// served from "/<repo>/", so derive the base from it; locally it stays "/".
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  base: repo ? `/${repo}/` : "/",
  plugins: [tailwindcss()],
});
