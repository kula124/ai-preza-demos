"use client";

import { BookOpen, Library, Moon, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { generateStoryAction } from "./actions";
import StoryDisplay from "./(components)/StoryDisplay";
import StoryForm from "./(components)/StoryForm";
import type { StoryFormData } from "./types";

export default function BedtimeStoryPage() {
	const [currentStep, setCurrentStep] = useState<"form" | "loading" | "story">(
		"form",
	);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedStory, setGeneratedStory] = useState("");
	const [formData, setFormData] = useState<StoryFormData>({
		age: "",
		gender: "",
		interests: [],
		style: "",
		lesson: "",
	});

	const handleGenerate = async (data: StoryFormData) => {
		setFormData(data);
		setIsGenerating(true);
		setCurrentStep("loading");

		const result = await generateStoryAction(data);

		if (result.success && result.story) {
			setGeneratedStory(result.story);
			setCurrentStep("story");
			toast.success("Story created successfully!");
		} else {
			toast.error(result.error || "Failed to generate story");
			setCurrentStep("form");
		}

		setIsGenerating(false);
	};

	const handleBack = () => {
		setCurrentStep("form");
		setGeneratedStory("");
	};

	// Loading State
	if (currentStep === "loading") {
		return (
			<div className="max-w-2xl mx-auto">
				<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-12 text-center">
					<div className="animate-pulse mb-6">
						<Moon className="w-16 h-16 text-purple-400 dark:text-purple-500 mx-auto" />
					</div>
					<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
						Creating Your Magical Story
					</h2>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						Our storytelling magic is working...
					</p>
					<div className="flex justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
					</div>
				</div>
			</div>
		);
	}

	// Story Display
	if (currentStep === "story") {
		return (
			<div className="max-w-4xl mx-auto">
				<StoryDisplay
					story={generatedStory}
					formData={formData}
					onBack={handleBack}
				/>
			</div>
		);
	}

	// Form
	return (
		<div className="max-w-2xl mx-auto">
			<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
					<div className="flex items-center justify-between mb-2">
						<h1 className="text-3xl font-bold text-white flex items-center gap-3">
							<Sparkles className="w-8 h-8" />
							Bedtime Story Creator
							<Moon className="w-8 h-8" />
						</h1>
						<Link
							href="/story-library"
							className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200 border border-white/30"
						>
							<Library className="w-4 h-4" />
							<span className="text-sm font-medium">Library</span>
						</Link>
					</div>
					<p className="text-purple-100">
						Create magical stories tailored just for your little one
					</p>
				</div>

				{/* Form */}
				<div className="p-8">
					<StoryForm onSubmit={handleGenerate} isGenerating={isGenerating} />
				</div>
			</div>
		</div>
	);
}
