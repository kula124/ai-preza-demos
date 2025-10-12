"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
	getApplicationsAction,
	deleteApplicationAction,
} from "./actions";
import type { ReviewedApplication } from "@/repo/schema";

export default function ApplicationsPage() {
	const [applications, setApplications] = useState<ReviewedApplication[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isEmbedding, setIsEmbedding] = useState(false);

	useEffect(() => {
		loadApplications();
	}, []);

	const loadApplications = async () => {
		setIsLoading(true);
		try {
			const result = await getApplicationsAction();
			if (result.success) {
				setApplications(result.applications);
			}
		} catch (error) {
			console.error("Error loading applications:", error);
			toast.error("Failed to load applications");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this application?")) {
			return;
		}

		try {
			const result = await deleteApplicationAction(id);
			if (result.success) {
				setApplications(applications.filter((a) => a.id !== id));
				toast.success("Application deleted successfully");
			} else {
				toast.error(result.error || "Failed to delete application");
			}
		} catch (error) {
			console.error("Error deleting application:", error);
			toast.error("Failed to delete application");
		}
	};

	const handleEmbedApplications = async () => {
		setIsEmbedding(true);
		try {
			const response = await fetch("/api/jobs/embed-applications", {
				method: "POST",
			});
			const result = await response.json();

			if (result.success) {
				toast.success(result.message || "Applications embedded successfully");
			} else {
				toast.error(result.error || "Failed to embed applications");
			}
		} catch (error) {
			console.error("Error embedding applications:", error);
			toast.error("Failed to embed applications");
		} finally {
			setIsEmbedding(false);
		}
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
		if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
		return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
	};

	const getPreviewText = (markdown: string, maxLength = 150) => {
		// Remove markdown formatting for preview
		const text = markdown
			.replace(/#{1,6}\s/g, "") // Remove headers
			.replace(/\*\*?(.*?)\*\*?/g, "$1") // Remove bold/italic
			.replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
			.replace(/`(.*?)`/g, "$1") // Remove code
			.replace(/\n+/g, " ") // Replace newlines with spaces
			.trim();
		return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
						<FileText className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold">Reviewed Applications</h1>
						<p className="text-gray-600 dark:text-gray-400">
							{applications.length} application{applications.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={handleEmbedApplications}
					disabled={isEmbedding}
					className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Sparkles className="h-4 w-4" />
					{isEmbedding ? "Embedding..." : "Embed Applications"}
				</button>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
				</div>
			) : applications.length === 0 ? (
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
					<FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-xl font-semibold mb-2">
						No Reviewed Applications Yet
					</h3>
					<p className="text-gray-600 dark:text-gray-400">
						Applications reviewed by N8N workflow will appear here
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{applications.map((application) => (
						<div
							key={application.id}
							className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 transition-all"
						>
							<Link
								href={`/jobs/applications/${application.id}`}
								className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<h3 className="text-xl font-semibold">
												{application.candidateName}
											</h3>
											<span
												className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
													application.overallScore,
												)}`}
											>
												{application.overallScore}/100
											</span>
										</div>
										<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
											<Calendar className="h-4 w-4" />
											{formatDate(application.dateReviewed)}
										</div>
									</div>
								</div>

								{/* Preview */}
								<p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
									{getPreviewText(application.fullMarkdownReview)}
								</p>
							</Link>

							{/* Actions */}
							<div className="px-6 pb-4 flex gap-2">
								<Link
									href={`/jobs/applications/${application.id}`}
									className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-center text-sm font-medium"
								>
									View Full Review
								</Link>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										handleDelete(application.id);
									}}
									className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
									title="Delete"
								>
									<Trash2 className="h-5 w-5" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
