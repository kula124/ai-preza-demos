/**
 * Server-only PDF parser utility
 * This file should only be imported in server contexts (Node.js runtime only)
 */

import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Extract text from a PDF file using pdf-poppler
 * Poppler is marked as external in next.config.ts to prevent bundling
 */
export async function extractPDFText(filePath: string): Promise<string> {
	try {
		// Use pdftotext command directly via poppler
		const { stdout } = await execAsync(`pdftotext "${filePath}" -`);

		if (!stdout || stdout.trim().length === 0) {
			throw new Error("No text content extracted from PDF");
		}

		return stdout.trim();
	} catch (error) {
		console.error("Error extracting PDF text:", error);
		throw new Error(
			`Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
