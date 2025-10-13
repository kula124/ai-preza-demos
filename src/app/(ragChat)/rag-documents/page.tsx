"use client";

import { useState } from "react";
import DocumentUpload from "./(components)/DocumentUpload";
import TextDocumentUpload from "./(components)/TextDocumentUpload";
import DocumentList from "./(components)/DocumentList";
import { FileStack, MessageSquare, Upload, FileText } from "lucide-react";
import Link from "next/link";

type UploadTab = "pdf" | "text";

export default function DocumentsPage() {
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [activeTab, setActiveTab] = useState<UploadTab>("pdf");

	const handleUploadSuccess = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	return (
		<div className="min-h-screen p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-50 flex items-center gap-3">
							<div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
								<FileStack className="w-8 h-8 text-white" />
							</div>
							Document Management
						</h1>
						<p className="text-gray-500 dark:text-slate-500 mt-1">
							Upload and manage documents for RAG chat
						</p>
					</div>
					<Link
						href="/rag-chat"
						className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
					>
						<MessageSquare className="w-5 h-5" />
						Go to Chat
					</Link>
				</div>

				{/* Upload Section */}
				<div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-4">
						Upload Documents
					</h2>

					{/* Tabs */}
					<div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
						<button
							type="button"
							onClick={() => setActiveTab("pdf")}
							className={`px-4 py-2 font-medium transition-all flex items-center gap-2 ${
								activeTab === "pdf"
									? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
									: "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
							}`}
						>
							<Upload className="w-4 h-4" />
							Upload PDF
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("text")}
							className={`px-4 py-2 font-medium transition-all flex items-center gap-2 ${
								activeTab === "text"
									? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
									: "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
							}`}
						>
							<FileText className="w-4 h-4" />
							Paste Text
						</button>
					</div>

					{/* Tab Content */}
					{activeTab === "pdf" ? (
						<DocumentUpload onUploadSuccess={handleUploadSuccess} />
					) : (
						<TextDocumentUpload onUploadSuccess={handleUploadSuccess} />
					)}
				</div>

				{/* Document List */}
				<div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
					<DocumentList refreshTrigger={refreshTrigger} />
				</div>
			</div>
		</div>
	);
}
