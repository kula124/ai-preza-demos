"use client";

import { ArrowLeft, BookOpen, Save, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saveStoryAction } from "../actions";
import type { StoryFormData } from "../types";

interface StoryDisplayProps {
	story: string;
	formData: StoryFormData;
	onBack: () => void;
}

export default function StoryDisplay({
	story,
	formData,
	onBack,
}: StoryDisplayProps) {
	const [isSaving, setIsSaving] = useState(false);
	const [isSaved, setIsSaved] = useState(false);

	const handleSave = async () => {
		setIsSaving(true);
		const result = await saveStoryAction(formData, story);

		if (result.success) {
			toast.success("Story saved to library!");
			setIsSaved(true);
		} else {
			toast.error(result.error || "Failed to save story");
		}
		setIsSaving(false);
	};

	return (
		<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
			{/* Header */}
			<div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold text-white flex items-center gap-2">
						<BookOpen className="w-6 h-6" />
						Your Bedtime Story
					</h1>
					<div className="flex gap-2">
						{!isSaved && (
							<button
								type="button"
								onClick={handleSave}
								disabled={isSaving}
								className="bg-pink-400 hover:bg-pink-500 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
							>
								<Save className="w-4 h-4" />
								{isSaving ? "Saving..." : "Save"}
							</button>
						)}
						<button
							type="button"
							onClick={onBack}
							className="bg-pink-400 hover:bg-pink-500 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200"
						>
							<ArrowLeft className="w-4 h-4" />
							New Story
						</button>
					</div>
				</div>
			</div>

			{/* Story Content */}
			<div className="p-8">
				<div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-2xl p-6 sm:p-8 border-l-4 border-orange-300 dark:border-orange-700">
					<p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-lg font-serif">
						{story}
					</p>
				</div>

				{/* Story Details */}
				<div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
					<h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
						Story Details:
					</h3>
					<div className="flex flex-wrap gap-2 text-sm">
						<span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
							Age: {formData.age}
						</span>
						<span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full capitalize">
							{formData.gender}
						</span>
						{formData.interests.map((interest) => (
							<span
								key={interest}
								className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
							>
								{interest}
							</span>
						))}
						<span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full capitalize">
							{formData.style}
						</span>
					</div>
				</div>

				{/* Sweet Dreams */}
				<div className="mt-8 flex justify-center">
					<div className="flex items-center gap-2 text-purple-500 dark:text-purple-400">
						<Star className="w-5 h-5" />
						<span className="text-sm font-medium">Sweet dreams!</span>
						<Star className="w-5 h-5" />
					</div>
				</div>
			</div>
		</div>
	);
}
