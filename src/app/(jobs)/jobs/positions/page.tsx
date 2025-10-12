"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Trash2, Edit, DollarSign, MapPin } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
	getPositionsAction,
	deletePositionAction,
} from "./actions";
import type { OpenPosition } from "@/repo/schema";
import PositionForm from "./PositionForm";

export default function PositionsPage() {
	const [positions, setPositions] = useState<OpenPosition[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingPosition, setEditingPosition] = useState<OpenPosition | null>(null);

	useEffect(() => {
		loadPositions();
	}, []);

	const loadPositions = async () => {
		setIsLoading(true);
		try {
			const result = await getPositionsAction();
			if (result.success) {
				setPositions(result.positions);
			}
		} catch (error) {
			console.error("Error loading positions:", error);
			toast.error("Failed to load positions");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this position?")) {
			return;
		}

		try {
			const result = await deletePositionAction(id);
			if (result.success) {
				setPositions(positions.filter((p) => p.id !== id));
				toast.success("Position deleted successfully");
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

	return (
		<div className="max-w-7xl mx-auto">
			{/* Position Form Modal */}
			{(showForm || editingPosition) && (
				<PositionForm
					onClose={() => {
						setShowForm(false);
						setEditingPosition(null);
					}}
					onSuccess={loadPositions}
					position={editingPosition}
				/>
			)}

			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
						<Briefcase className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold">Open Positions</h1>
						<p className="text-gray-600 dark:text-gray-400">
							{positions.length} position{positions.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={() => setShowForm(true)}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					New Position
				</button>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
				</div>
			) : positions.length === 0 ? (
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
					<Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-xl font-semibold mb-2">No Open Positions</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						Start by creating your first job position
					</p>
					<button
						type="button"
						onClick={() => setShowForm(true)}
						className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
					>
						<Plus className="h-5 w-5" />
						Create Position
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{positions.map((position) => (
						<div
							key={position.id}
							className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all overflow-hidden"
						>
							{/* Clickable Card Content */}
							<Link href={`/jobs/positions/${position.id}`} className="block p-6">
								{/* Header */}
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="font-semibold text-lg">{position.title}</h3>
											<span
												className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
													position.status,
												)}`}
											>
												{position.status}
											</span>
										</div>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{position.department}
										</p>
									</div>
								</div>

								{/* Details */}
								<div className="space-y-2 mb-4">
									<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
										<MapPin className="h-4 w-4" />
										{position.location} • {position.employmentType}
									</div>
									{position.salaryMin && position.salaryMax && (
										<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
											<DollarSign className="h-4 w-4" />
											${position.salaryMin.toLocaleString()} - $
											{position.salaryMax.toLocaleString()}
										</div>
									)}
								</div>

								{/* Skills */}
								<div className="flex flex-wrap gap-2">
									{position.requiredSkills.slice(0, 3).map((skill) => (
										<span
											key={skill}
											className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
										>
											{skill}
										</span>
									))}
									{position.requiredSkills.length > 3 && (
										<span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
											+{position.requiredSkills.length - 3} more
										</span>
									)}
								</div>
							</Link>

							{/* Actions */}
							<div className="flex gap-2 px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-800">
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										setEditingPosition(position);
									}}
									className="flex-1 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
								>
									<Edit className="h-4 w-4" />
									Edit
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										handleDelete(position.id);
									}}
									className="flex-1 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
								>
									<Trash2 className="h-4 w-4" />
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
