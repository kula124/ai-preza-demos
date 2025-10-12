"use client";

import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { uploadDocumentAction } from "../actions";
import { toast } from "sonner";

interface DocumentUploadProps {
	onUploadSuccess?: () => void;
}

export default function DocumentUpload({
	onUploadSuccess,
}: DocumentUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [uploading, setUploading] = useState(false);

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setIsDragging(true);
		} else if (e.type === "dragleave") {
			setIsDragging(false);
		}
	}, []);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const droppedFiles = Array.from(e.dataTransfer.files).filter(
			(file) => file.type === "application/pdf",
		);

		if (droppedFiles.length === 0) {
			toast.error("Only PDF files are allowed");
			return;
		}

		setFiles((prev) => [...prev, ...droppedFiles]);
	}, []);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) {
				const selectedFiles = Array.from(e.target.files).filter(
					(file) => file.type === "application/pdf",
				);

				if (selectedFiles.length === 0) {
					toast.error("Only PDF files are allowed");
					return;
				}

				setFiles((prev) => [...prev, ...selectedFiles]);
			}
		},
		[],
	);

	const removeFile = useCallback((index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleUpload = async () => {
		if (files.length === 0) return;

		setUploading(true);
		let successCount = 0;
		let errorCount = 0;

		for (const file of files) {
			const formData = new FormData();
			formData.append("file", file);

			try {
				const result = await uploadDocumentAction(formData);

				if (result.success) {
					toast.success(
						`${file.name} uploaded successfully! Created ${result.chunksCount} chunks.`,
					);
					successCount++;
				} else {
					toast.error(`Failed to upload ${file.name}: ${result.error}`);
					console.error("Upload error:", result.error);
					errorCount++;
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : "Unknown error";
				toast.error(`Error uploading ${file.name}: ${errorMsg}`);
				console.error("Upload error:", error);
				errorCount++;
			}
		}

		setUploading(false);

		// Only clear files and refresh if at least one upload succeeded
		if (successCount > 0) {
			setFiles([]);
			onUploadSuccess?.();

			if (errorCount > 0) {
				toast.info(`${successCount} file(s) uploaded, ${errorCount} failed`);
			}
		} else if (errorCount > 0) {
			toast.error("All uploads failed. Please check the console for details.");
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto space-y-4">
			{/* Drop Zone */}
			<div
				className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
					isDragging
						? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
						: "border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600"
				}`}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<div className="flex flex-col items-center justify-center space-y-4">
					<div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
						<Upload className="w-8 h-8 text-gray-600 dark:text-slate-400" />
					</div>
					<div className="text-center">
						<p className="text-lg font-medium text-gray-900 dark:text-slate-50">
							Drop PDF files here
						</p>
						<p className="text-sm text-gray-500 dark:text-slate-500">
							or click to browse
						</p>
					</div>
					<label
						htmlFor="file-upload"
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
					>
						Select Files
					</label>
					<input
						id="file-upload"
						type="file"
						accept="application/pdf"
						multiple
						className="hidden"
						onChange={handleFileInput}
					/>
					<p className="text-xs text-gray-500 dark:text-slate-500">
						Maximum file size: 10MB per file
					</p>
				</div>
			</div>

			{/* File List */}
			{files.length > 0 && (
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-gray-900 dark:text-slate-50">
						Selected Files ({files.length})
					</h3>
					<div className="space-y-2">
						{files.map((file, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
							>
								<div className="flex items-center space-x-3">
									<FileText className="w-5 h-5 text-red-500" />
									<div className="flex flex-col">
										<span className="text-sm font-medium text-gray-900 dark:text-slate-50">
											{file.name}
										</span>
										<span className="text-xs text-gray-500 dark:text-slate-500">
											{(file.size / 1024 / 1024).toFixed(2)} MB
										</span>
									</div>
								</div>
								<button
									type="button"
									onClick={() => removeFile(index)}
									className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
									disabled={uploading}
								>
									<X className="w-4 h-4 text-gray-600 dark:text-slate-400" />
								</button>
							</div>
						))}
					</div>

					<button
						type="button"
						onClick={handleUpload}
						disabled={uploading}
						className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
					>
						{uploading ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								<span>Uploading...</span>
							</>
						) : (
							<span>Upload {files.length} file(s)</span>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
