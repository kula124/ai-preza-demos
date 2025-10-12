"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createPositionAction, updatePositionAction } from "./actions";
import type { PositionFormData } from "../types";
import type { OpenPosition } from "@/repo/schema";

interface PositionFormProps {
	onClose: () => void;
	onSuccess: () => void;
	position?: OpenPosition | null;
}

export default function PositionForm({ onClose, onSuccess, position }: PositionFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<Omit<PositionFormData, "id">>({
		title: "",
		department: "",
		requiredSkills: [],
		experienceLevel: "",
		location: "",
		employmentType: "",
		salaryMin: undefined,
		salaryMax: undefined,
		description: "",
	});
	const [skillInput, setSkillInput] = useState("");

	useEffect(() => {
		if (position) {
			setFormData({
				title: position.title,
				department: position.department,
				requiredSkills: position.requiredSkills,
				experienceLevel: position.experienceLevel,
				location: position.location,
				employmentType: position.employmentType,
				salaryMin: position.salaryMin ?? undefined,
				salaryMax: position.salaryMax ?? undefined,
				description: position.description ?? "",
			});
		}
	}, [position]);

	const generatePositionId = () => {
		// Generate ID like JOB001, JOB002, etc.
		const timestamp = Date.now().toString().slice(-6);
		return `JOB${timestamp}`;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title || !formData.department ||
		    formData.requiredSkills.length === 0 || !formData.experienceLevel ||
		    !formData.location || !formData.employmentType) {
			toast.error("Please fill in all required fields");
			return;
		}

		setIsSubmitting(true);
		try {
			if (position) {
				// Update existing position
				const result = await updatePositionAction(position.id, formData);
				if (result.success) {
					toast.success("Position updated successfully");
					onSuccess();
					onClose();
				} else {
					toast.error(result.error || "Failed to update position");
				}
			} else {
				// Create new position
				const positionData: PositionFormData = {
					...formData,
					id: generatePositionId(),
				};
				const result = await createPositionAction(positionData);
				if (result.success) {
					toast.success("Position created successfully");
					onSuccess();
					onClose();
				} else {
					toast.error(result.error || "Failed to create position");
				}
			}
		} catch (error) {
			console.error(`Error ${position ? "updating" : "creating"} position:`, error);
			toast.error(`Failed to ${position ? "update" : "create"} position`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const addSkill = () => {
		if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
			setFormData({
				...formData,
				requiredSkills: [...formData.requiredSkills, skillInput.trim()],
			});
			setSkillInput("");
		}
	};

	const removeSkill = (skill: string) => {
		setFormData({
			...formData,
			requiredSkills: formData.requiredSkills.filter((s) => s !== skill),
		});
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
					<h2 className="text-2xl font-bold">
						{position ? "Edit Position" : "Create New Position"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					{/* Title */}
					<div>
						<label className="block text-sm font-medium mb-2">
							Job Title <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							placeholder="e.g., Senior Software Engineer"
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					{/* Department and Experience Level */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2">
								Department <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={formData.department}
								onChange={(e) => setFormData({ ...formData, department: e.target.value })}
								placeholder="e.g., Engineering"
								className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">
								Experience Level <span className="text-red-500">*</span>
							</label>
							<select
								value={formData.experienceLevel}
								onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
								className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							>
								<option value="">Select level</option>
								<option value="Entry">Entry</option>
								<option value="Mid">Mid</option>
								<option value="Senior">Senior</option>
								<option value="Lead">Lead</option>
								<option value="Principal">Principal</option>
							</select>
						</div>
					</div>

					{/* Location and Employment Type */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2">
								Location <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={formData.location}
								onChange={(e) => setFormData({ ...formData, location: e.target.value })}
								placeholder="e.g., San Francisco, CA"
								className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">
								Employment Type <span className="text-red-500">*</span>
							</label>
							<select
								value={formData.employmentType}
								onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
								className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							>
								<option value="">Select type</option>
								<option value="Full-time">Full-time</option>
								<option value="Part-time">Part-time</option>
								<option value="Contract">Contract</option>
								<option value="Remote">Remote</option>
								<option value="Hybrid">Hybrid</option>
							</select>
						</div>
					</div>

					{/* Salary Range */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2">
								Minimum Salary
							</label>
							<input
								type="number"
								value={formData.salaryMin || ""}
								onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value ? Number(e.target.value) : undefined })}
								placeholder="e.g., 80000"
								className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">
								Maximum Salary
							</label>
							<input
								type="number"
								value={formData.salaryMax || ""}
								onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value ? Number(e.target.value) : undefined })}
								placeholder="e.g., 120000"
								className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>

					{/* Required Skills */}
					<div>
						<label className="block text-sm font-medium mb-2">
							Required Skills <span className="text-red-500">*</span>
						</label>
						<div className="flex gap-2 mb-3">
							<input
								type="text"
								value={skillInput}
								onChange={(e) => setSkillInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addSkill();
									}
								}}
								placeholder="Add a skill and press Enter"
								className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<button
								type="button"
								onClick={addSkill}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								Add
							</button>
						</div>
						<div className="flex flex-wrap gap-2">
							{formData.requiredSkills.map((skill) => (
								<span
									key={skill}
									className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2"
								>
									{skill}
									<button
										type="button"
										onClick={() => removeSkill(skill)}
										className="hover:text-blue-900 dark:hover:text-blue-100"
									>
										<X className="h-3 w-3" />
									</button>
								</span>
							))}
						</div>
					</div>

					{/* Description */}
					<div>
						<label className="block text-sm font-medium mb-2">
							Job Description
						</label>
						<textarea
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							placeholder="Enter job description, responsibilities, and requirements..."
							rows={6}
							className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={isSubmitting}
						>
							{isSubmitting
								? (position ? "Updating..." : "Creating...")
								: (position ? "Update Position" : "Create Position")
							}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
