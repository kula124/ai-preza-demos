"use client";

import { ArrowLeft, BookOpen, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	deleteStoryAction,
	getStoryAction,
} from "../../bedtime-story/actions";
import type { Story } from "@/repo/schema";

export default function StoryDetailPage() {
	const params = useParams();
	const router = useRouter();
	const storyId = Number.parseInt(params.id as string);
	const [story, setStory] = useState<Story | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		loadStory();
	}, [storyId]);

	const loadStory = async () => {
		setIsLoading(true);
		const result = await getStoryAction(storyId);
		if (result.success && result.story) {
			setStory(result.story);
		} else {
			toast.error("Story not found");
			router.push("/story-library");
		}
		setIsLoading(false);
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this story?")) return;

		setIsDeleting(true);
		const result = await deleteStoryAction(storyId);
		if (result.success) {
			toast.success("Story deleted");
			router.push("/story-library");
		} else {
			toast.error("Failed to delete story");
			setIsDeleting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="max-w-4xl mx-auto">
				<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-12 text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
					<p className="mt-4 text-gray-600 dark:text-gray-400">
						Loading story...
					</p>
				</div>
			</div>
		);
	}

	if (!story) {
		return null;
	}

	return (
		<div className="max-w-4xl mx-auto">
			<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl font-bold text-white flex items-center gap-2">
							<BookOpen className="w-6 h-6" />
							{story.topic}
						</h1>
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
								href="/story-library"
								className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200"
							>
								<ArrowLeft className="w-4 h-4" />
								Library
							</Link>
						</div>
					</div>
				</div>

				{/* Story Content */}
				<div className="p-8">
					<div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-2xl p-6 sm:p-8 border-l-4 border-orange-300 dark:border-orange-700">
						<p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-lg font-serif">
							{story.generatedStory}
						</p>
					</div>

					{/* Story Details */}
					<div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
						<h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
							Story Details:
						</h3>
						<div className="flex flex-wrap gap-2 text-sm">
							<span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
								Age: {story.childAge}
							</span>
							{story.emphasis.map((tag, idx) => (
								<span
									key={idx}
									className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full capitalize"
								>
									{tag}
								</span>
							))}
						</div>
						{story.additionalInstructions && (
							<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
								{story.additionalInstructions}
							</p>
						)}
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
		</div>
	);
}
