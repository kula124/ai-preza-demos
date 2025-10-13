"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { uploadTextDocumentAction } from "../actions";
import { toast } from "sonner";

interface TextDocumentUploadProps {
	onUploadSuccess?: () => void;
}

export default function TextDocumentUpload({
	onUploadSuccess,
}: TextDocumentUploadProps) {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [uploading, setUploading] = useState(false);

	const handleUpload = async () => {
		if (!title.trim() || !content.trim()) {
			toast.error("Please provide both title and content");
			return;
		}

		setUploading(true);

		try {
			const result = await uploadTextDocumentAction(title, content);

			if (result.success) {
				toast.success(
					`"${title}" uploaded successfully! Created ${result.chunksCount} chunks.`,
				);
				setTitle("");
				setContent("");
				onUploadSuccess?.();
			} else {
				toast.error(`Failed to upload: ${result.error}`);
				console.error("Upload error:", result.error);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : "Unknown error";
			toast.error(`Error uploading text: ${errorMsg}`);
			console.error("Upload error:", error);
		} finally {
			setUploading(false);
		}
	};

	const charCount = content.length;
	const isOverLimit = charCount > 50000;

	return (
		<div className="w-full max-w-2xl mx-auto space-y-4">
			{/* Title Input */}
			<div>
				<label
					htmlFor="document-title"
					className="block text-sm font-medium text-gray-900 dark:text-slate-50 mb-2"
				>
					Document Title
				</label>
				<input
					id="document-title"
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="e.g., Company Policy, Meeting Notes, Research Article..."
					className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50"
					disabled={uploading}
				/>
			</div>

			{/* Content Textarea */}
			<div>
				<label
					htmlFor="document-content"
					className="block text-sm font-medium text-gray-900 dark:text-slate-50 mb-2"
				>
					Document Content
				</label>
				<textarea
					id="document-content"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Paste your document content here..."
					rows={15}
					className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-700 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 font-mono text-sm resize-y"
					disabled={uploading}
				/>
				<div className="flex items-center justify-between mt-2">
					<p
						className={`text-xs ${
							isOverLimit
								? "text-red-500 font-medium"
								: "text-gray-500 dark:text-slate-500"
						}`}
					>
						{charCount.toLocaleString()} / 50,000 characters
					</p>
					{isOverLimit && (
						<p className="text-xs text-red-500 font-medium">Content too long!</p>
					)}
				</div>
			</div>

			{/* Upload Button */}
			<button
				type="button"
				onClick={handleUpload}
				disabled={uploading || !title.trim() || !content.trim() || isOverLimit}
				className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 font-medium"
			>
				{uploading ? (
					<>
						<Loader2 className="w-5 h-5 animate-spin" />
						<span>Processing & Uploading...</span>
					</>
				) : (
					<>
						<FileText className="w-5 h-5" />
						<span>Upload Text Document</span>
					</>
				)}
			</button>
		</div>
	);
}
