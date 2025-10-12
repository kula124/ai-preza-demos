"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	Briefcase,
	MapPin,
	DollarSign,
	Calendar,
	ArrowLeft,
	Edit,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getPositionByIdAction, deletePositionAction } from "../actions";
import type { OpenPosition } from "@/repo/schema";

export default function PositionDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [position, setPosition] = useState<OpenPosition | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadPosition();
	}, [params.id]);

	const loadPosition = async () => {
		setIsLoading(true);
		try {
			const result = await getPositionByIdAction(params.id as string);
			if (result.success && result.position) {
				setPosition(result.position);
			} else {
				toast.error("Position not found");
				router.push("/jobs/positions");
			}
		} catch (error) {
			console.error("Error loading position:", error);
			toast.error("Failed to load position");
			router.push("/jobs/positions");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!position) return;
		if (!confirm("Are you sure you want to delete this position?")) {
			return;
		}

		try {
			const result = await deletePositionAction(position.id);
			if (result.success) {
				toast.success("Position deleted successfully");
				router.push("/jobs/positions");
			} else {
				toast.error(result.error || "Failed to delete position");
			}
		} catch (error) {
			console.error("Error deleting position:", error);
			toast.error("Failed to delete position");
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "open":
				return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
			case "closed":
				return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
			case "filled":
				return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
			default:
				return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-center py-20">
					<div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
				</div>
			</div>
		);
	}

	if (!position) {
		return null;
	}

	return (
		<div className="max-w-4xl mx-auto">
			{/* Back Button */}
			<Link
				href="/jobs/positions"
				className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
				Back to Positions
			</Link>

			{/* Header */}
			<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-6">
				<div className="flex items-start justify-between mb-6">
					<div className="flex items-start gap-4">
						<div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
							<Briefcase className="h-8 w-8 text-white" />
						</div>
						<div>
							<div className="flex items-center gap-3 mb-2">
								<h1 className="text-3xl font-bold">{position.title}</h1>
								<span
									className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
										position.status,
									)}`}
								>
									{position.status}
								</span>
							</div>
							<p className="text-xl text-gray-600 dark:text-gray-400">
								{position.department}
							</p>
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2">
						<Link
							href={`/jobs/positions?edit=${position.id}`}
							className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
							title="Edit position"
						>
							<Edit className="h-5 w-5" />
						</Link>
						<button
							type="button"
							onClick={handleDelete}
							className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
							title="Delete position"
						>
							<Trash2 className="h-5 w-5" />
						</button>
					</div>
				</div>

				{/* Key Details */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
						<MapPin className="h-5 w-5 text-gray-400" />
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Location
							</p>
							<p className="font-medium">{position.location}</p>
						</div>
					</div>

					<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
						<Briefcase className="h-5 w-5 text-gray-400" />
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Employment Type
							</p>
							<p className="font-medium">{position.employmentType}</p>
						</div>
					</div>

					{position.salaryMin && position.salaryMax && (
						<div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
							<DollarSign className="h-5 w-5 text-gray-400" />
							<div>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									Salary Range
								</p>
								<p className="font-medium">
									${position.salaryMin.toLocaleString()} - $
									{position.salaryMax.toLocaleString()}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Details Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				{/* Experience Level */}
				<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
						Experience Level
					</h3>
					<p className="text-lg font-semibold">{position.experienceLevel}</p>
				</div>

				{/* Position ID */}
				<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
						Position ID
					</h3>
					<p className="text-lg font-semibold font-mono">{position.id}</p>
				</div>

				{/* Posted Date */}
				<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
					<h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
						Posted Date
					</h3>
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-gray-400" />
						<p className="text-lg font-semibold">
							{formatDate(position.createdAt)}
						</p>
					</div>
				</div>
			</div>

			{/* Required Skills */}
			<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
				<h2 className="text-xl font-bold mb-4">Required Skills</h2>
				<div className="flex flex-wrap gap-2">
					{position.requiredSkills.map((skill) => (
						<span
							key={skill}
							className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
						>
							{skill}
						</span>
					))}
				</div>
			</div>

			{/* Description */}
			{position.description && (
				<div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
					<h2 className="text-xl font-bold mb-4">Job Description</h2>
					<div className="prose dark:prose-invert max-w-none">
						<p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
							{position.description}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
