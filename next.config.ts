import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Mark PDF parsing libraries as external to prevent bundling
	serverExternalPackages: [
		"pdf-poppler",
		"pdf2json",
		"pdf-parse",
		"pdfjs-dist",
		"canvas",
	],
};

export default nextConfig;
