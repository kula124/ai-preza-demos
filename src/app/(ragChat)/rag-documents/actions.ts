"use server";

import { RAGService } from "@/services/RAGService";

export interface UploadDocumentResult {
	success: boolean;
	documentId?: number;
	chunksCount?: number;
	error?: string;
}

export async function uploadDocumentAction(
	formData: FormData,
): Promise<UploadDocumentResult> {
	try {
		const file = formData.get("file") as File;

		if (!file) {
			return {
				success: false,
				error: "No file provided",
			};
		}

		// Validate file type
		if (file.type !== "application/pdf") {
			return {
				success: false,
				error: "Only PDF files are allowed",
			};
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return {
				success: false,
				error: "File size must be less than 10MB",
			};
		}

		const result = await RAGService.processDocument(file);

		return {
			success: true,
			documentId: result.documentId,
			chunksCount: result.chunksCount,
		};
	} catch (error) {
		console.error("Error uploading document:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to upload document",
		};
	}
}

export async function getDocumentsAction() {
	try {
		const documents = await RAGService.getAllDocuments();
		return {
			success: true,
			documents,
		};
	} catch (error) {
		console.error("Error fetching documents:", error);
		return {
			success: false,
			error: "Failed to fetch documents",
		};
	}
}

export async function uploadTextDocumentAction(
	title: string,
	content: string,
): Promise<UploadDocumentResult> {
	try {
		// Validate inputs
		if (!title.trim()) {
			return {
				success: false,
				error: "Please provide a title",
			};
		}

		if (!content.trim()) {
			return {
				success: false,
				error: "Please provide document content",
			};
		}

		// Validate content length (max ~50k characters for reasonable processing)
		if (content.length > 50000) {
			return {
				success: false,
				error: "Content is too long. Please keep it under 50,000 characters.",
			};
		}

		const result = await RAGService.processTextDocument(title, content);

		return {
			success: true,
			documentId: result.documentId,
			chunksCount: result.chunksCount,
		};
	} catch (error) {
		console.error("Error uploading text document:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to upload text document",
		};
	}
}

export async function deleteDocumentAction(documentId: number) {
	try {
		await RAGService.deleteDocument(documentId);
		return {
			success: true,
		};
	} catch (error) {
		console.error("Error deleting document:", error);
		return {
			success: false,
			error: "Failed to delete document",
		};
	}
}
