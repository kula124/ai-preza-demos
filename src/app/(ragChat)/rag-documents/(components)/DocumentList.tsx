"use client";

import { FileText, Trash2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getDocumentsAction, deleteDocumentAction } from "../actions";
import { toast } from "sonner";
import type { Document } from "@/repo/schema";

interface DocumentListProps {
	refreshTrigger?: number;
}

export default function DocumentList({ refreshTrigger }: DocumentListProps) {
	const [documents, setDocuments] = useState<Document[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState<number | null>(null);

	const loadDocuments = async () => {
		setLoading(true);
		const result = await getDocumentsAction();
		if (result.success && result.documents) {
			setDocuments(result.documents);
		}
		setLoading(false);
	};

	useEffect(() => {
		loadDocuments();
	}, [refreshTrigger]);

	const handleDelete = async (documentId: number, filename: string) => {
		if (!confirm(`Delete "${filename}"? This will also remove all its chunks.`)) {
			return;
		}

		setDeleting(documentId);
		const result = await deleteDocumentAction(documentId);

		if (result.success) {
			toast.success("Document deleted successfully");
			setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
		} else {
			toast.error("Failed to delete document");
		}

		setDeleting(null);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-12">
				<div className="text-gray-500 dark:text-slate-500">
					Loading documents...
				</div>
			</div>
		);
	}

	if (documents.length === 0) {
		return (
			<div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg">
				<FileText className="w-12 h-12 mx-auto text-gray-400 dark:text-slate-600 mb-4" />
				<h3 className="text-lg font-medium text-gray-900 dark:text-slate-50 mb-2">
					No documents yet
				</h3>
				<p className="text-gray-500 dark:text-slate-500">
					Upload PDF documents to get started
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-medium text-gray-900 dark:text-slate-50">
				Uploaded Documents ({documents.length})
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{documents.map((doc) => (
					<div
						key={doc.id}
						className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-600 transition-colors"
					>
						<div className="flex items-start justify-between mb-3">
							<div className="flex items-center space-x-2">
								<FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
								<h4 className="text-sm font-medium text-gray-900 dark:text-slate-50 line-clamp-1">
									{doc.filename}
								</h4>
							</div>
							<button
								type="button"
								onClick={() => handleDelete(doc.id, doc.filename)}
								disabled={deleting === doc.id}
								className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors disabled:opacity-50"
							>
								<Trash2
									className={`w-4 h-4 text-red-600 dark:text-red-500 ${
										deleting === doc.id ? "animate-pulse" : ""
									}`}
								/>
							</button>
						</div>
						<div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-500">
							<Calendar className="w-3 h-3" />
							<span>
								{new Date(doc.uploadDate).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</span>
						</div>
						<div className="mt-2 text-xs text-gray-500 dark:text-slate-500 line-clamp-2">
							{doc.content.substring(0, 100)}...
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
