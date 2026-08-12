import type { NextConfig } from "next";

// Repo is deployed as a GitHub Pages *project* site
// (https://<user>.github.io/EstateDocPrep-Exam/), so the static export needs
// to be served from that subpath. Only apply it in CI/production builds so
// local `next dev` keeps working at the site root.
const repoBasePath = "/EstateDocPrep-Exam";
const isGithubPagesBuild = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGithubPagesBuild ? repoBasePath : "",
  assetPrefix: isGithubPagesBuild ? repoBasePath : "",
};

export default nextConfig;
