"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	getApplicationByIdAction,
	deleteApplicationAction,
} from "../actions";
import type { ReviewedApplication } from "@/repo/schema";

export default function ApplicationDetailPage() {
	const params = useParams();
	const router = useRouter();
	const applicationId = Number.parseInt(params.id as string);

	const [application, setApplication] = useState<ReviewedApplication | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		loadApplication();
	}, [applicationId]);

	const loadApplication = async () => {
		setIsLoading(true);
		try {
			const result = await getApplicationByIdAction(applicationId);
			if (result.success && result.application) {
				setApplication(result.application as ReviewedApplication);
			} else {
				toast.error("Application not found");
				router.push("/jobs/applications");
			}
		} catch (error) {
			console.error("Error loading application:", error);
			toast.error("Failed to load application");
			router.push("/jobs/applications");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this application?")) {
			return;
		}

		setIsDeleting(true);
		try {
			const result = await deleteApplicationAction(applicationId);
			if (result.success) {
				toast.success("Application deleted successfully");
				router.push("/jobs/applications");
			} else {
				toast.error(result.error || "Failed to delete application");
				setIsDeleting(false);
			}
		} catch (error) {
			console.error("Error deleting application:", error);
			toast.error("Failed to delete application");
			setIsDeleting(false);
		}
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600 dark:text-green-400";
		if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
		return "text-red-600 dark:text-red-400";
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (isLoading) {
		return (
			<div className="max-w-5xl mx-auto">
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
					<div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
					<p className="mt-4 text-gray-600 dark:text-gray-400">
						Loading application...
					</p>
				</div>
			</div>
		);
	}

	if (!application) {
		return null;
	}

	return (
		<div className="max-w-5xl mx-auto">
			<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
								<User className="h-8 w-8 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-white">
									{application.candidateName}
								</h1>
								<div className="flex items-center gap-2 text-purple-100 mt-1">
									<Calendar className="h-4 w-4" />
									<span className="text-sm">
										{formatDate(application.dateReviewed)}
									</span>
								</div>
							</div>
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={handleDelete}
								disabled={isDeleting}
								className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
							>
								<Trash2 className="w-4 h-4" />
								{isDeleting ? "Deleting..." : "Delete"}
							</button>
							<Link
								href="/jobs/applications"
								className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200"
							>
								<ArrowLeft className="w-4 h-4" />
								Back to List
							</Link>
						</div>
					</div>
				</div>

				{/* Score Badge */}
				<div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-3">
						<span className="text-sm font-medium text-gray-600 dark:text-gray-400">
							Overall Score:
						</span>
						<span
							className={`text-3xl font-bold ${getScoreColor(application.overallScore)}`}
						>
							{application.overallScore}/100
						</span>
					</div>
				</div>

				{/* Markdown Review */}
				<div className="p-6">
					<article className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{application.fullMarkdownReview}
						</ReactMarkdown>
					</article>
				</div>
			</div>
		</div>
	);
}
