"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Eye, Calendar, Mail } from "lucide-react";
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

	const getRecommendationColor = (recommendation: string) => {
		switch (recommendation) {
			case "HIRE":
				return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
			case "MAYBE":
				return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
			case "REJECT":
				return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
			default:
				return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
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
							className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									{/* Header */}
									<div className="flex items-center gap-3 mb-3">
										<h3 className="text-xl font-semibold">
											{application.candidateName}
										</h3>
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(
												application.recommendation,
											)}`}
										>
											{application.recommendation}
										</span>
										<span
											className={`text-2xl font-bold ${getScoreColor(
												application.overallScore,
											)}`}
										>
											{application.overallScore}/100
										</span>
									</div>

									{/* Details */}
									<div className="grid grid-cols-2 gap-4 mb-4">
										<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
											<Mail className="h-4 w-4" />
											{application.candidateEmail}
										</div>
										<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
											<Calendar className="h-4 w-4" />
											{formatDate(application.dateReviewed)}
										</div>
									</div>

									<div className="mb-4">
										<p className="text-sm text-gray-600 dark:text-gray-400">
											<span className="font-medium">Applied for:</span>{" "}
											{application.positionApplied}
										</p>
									</div>

									{/* Score Breakdown */}
									<div className="flex flex-wrap gap-3">
										{application.requiredSkillsScore && (
											<span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">
												Skills: {application.requiredSkillsScore}
											</span>
										)}
										{application.experienceScore && (
											<span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm">
												Experience: {application.experienceScore}
											</span>
										)}
										{application.technicalDepthScore && (
											<span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-sm">
												Technical: {application.technicalDepthScore}
											</span>
										)}
										{application.communicationScore && (
											<span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-sm">
												Communication: {application.communicationScore}
											</span>
										)}
									</div>
								</div>

								{/* Actions */}
								<div className="flex gap-2 ml-4">
									<Link
										href={`/jobs/applications/${application.id}`}
										className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 rounded-lg transition-colors"
										title="View details"
									>
										<Eye className="h-5 w-5" />
									</Link>
									<button
										type="button"
										onClick={() => handleDelete(application.id)}
										className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
										title="Delete"
									>
										<Trash2 className="h-5 w-5" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
