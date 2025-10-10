"use client";

import { Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import type { StoryFormData } from "../types";
import { INTERESTS, STORY_STYLES } from "../types";

interface StoryFormProps {
	onSubmit: (formData: StoryFormData) => void;
	isGenerating: boolean;
}

export default function StoryForm({ onSubmit, isGenerating }: StoryFormProps) {
	const [formData, setFormData] = useState<StoryFormData>({
		age: "",
		gender: "",
		interests: [],
		style: "",
		lesson: "",
	});

	const handleInterestToggle = (interest: string) => {
		setFormData((prev) => ({
			...prev,
			interests: prev.interests.includes(interest)
				? prev.interests.filter((i) => i !== interest)
				: prev.interests.length < 3
					? [...prev.interests, interest]
					: prev.interests,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (
			!formData.age ||
			!formData.gender ||
			formData.interests.length === 0 ||
			!formData.style ||
			!formData.lesson.trim()
		) {
			alert("Please fill in all fields before generating a story.");
			return;
		}

		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Age Input */}
			<div className="space-y-3">
				<label
					htmlFor="age"
					className="block text-lg font-semibold text-gray-800 dark:text-gray-200"
				>
					Child's Age
				</label>
				<input
					id="age"
					type="number"
					value={formData.age}
					onChange={(e) => setFormData({ ...formData, age: e.target.value })}
					placeholder="Enter age (e.g., 5)"
					min="2"
					max="12"
					className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors text-lg"
				/>
			</div>

			{/* Gender Selection */}
			<div className="space-y-3">
				<label className="block text-lg font-semibold text-gray-800 dark:text-gray-200">
					Gender
				</label>
				<div className="grid grid-cols-3 gap-3">
					{(["boy", "girl", "other"] as const).map((gender) => (
						<button
							key={gender}
							type="button"
							onClick={() => setFormData({ ...formData, gender })}
							className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 text-center capitalize font-medium ${
								formData.gender === gender
									? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
									: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
							}`}
						>
							{gender}
						</button>
					))}
				</div>
			</div>

			{/* Interests */}
			<div className="space-y-3">
				<label className="block text-lg font-semibold text-gray-800 dark:text-gray-200">
					Interests (select 1-3)
					<span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
						{formData.interests.length}/3 selected
					</span>
				</label>
				<div className="grid grid-cols-2 gap-3">
					{INTERESTS.map((interest) => (
						<button
							key={interest}
							type="button"
							onClick={() => handleInterestToggle(interest)}
							disabled={
								!formData.interests.includes(interest) &&
								formData.interests.length >= 3
							}
							className={`py-3 px-4 rounded-xl border-2 transition-all duration-200 text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
								formData.interests.includes(interest)
									? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300"
									: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
							}`}
						>
							{interest}
						</button>
					))}
				</div>
			</div>

			{/* Story Style */}
			<div className="space-y-3">
				<label className="block text-lg font-semibold text-gray-800 dark:text-gray-200">
					Story Style
				</label>
				<div className="space-y-3">
					{STORY_STYLES.map((style) => (
						<button
							key={style.value}
							type="button"
							onClick={() => setFormData({ ...formData, style: style.value })}
							className={`w-full py-3 px-4 rounded-xl border-2 transition-all duration-200 text-left font-medium flex items-center gap-3 ${
								formData.style === style.value
									? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
									: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400"
							}`}
						>
							<span className="text-2xl">{style.emoji}</span>
							{style.label}
						</button>
					))}
				</div>
			</div>

			{/* Lesson */}
			<div className="space-y-3">
				<label
					htmlFor="lesson"
					className="block text-lg font-semibold text-gray-800 dark:text-gray-200"
				>
					Lesson to Teach
				</label>
				<textarea
					id="lesson"
					value={formData.lesson}
					onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
					placeholder="What would you like your child to learn? (e.g., being kind to others, trying new things, being brave)"
					className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors resize-none h-24 text-lg"
				/>
			</div>

			{/* Submit Button */}
			<button
				type="submit"
				disabled={isGenerating}
				className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
			>
				{isGenerating ? (
					<>
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
						Creating Magic...
					</>
				) : (
					<>
						<Heart className="w-6 h-6" />
						Create Magical Story
						<Sparkles className="w-6 h-6" />
					</>
				)}
			</button>
		</form>
	);
}
