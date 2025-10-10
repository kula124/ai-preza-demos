"use client";

import { ArrowLeft, Book, BookOpen, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteStoryAction, getStoriesAction } from "../bedtime-story/actions";
import type { Story } from "@/repo/schema";

export default function StoryLibraryPage() {
	const [stories, setStories] = useState<Story[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedStory, setSelectedStory] = useState<Story | null>(null);

	useEffect(() => {
		loadStories();
	}, []);

	const loadStories = async () => {
		setIsLoading(true);
		const result = await getStoriesAction();
		if (result.success) {
			setStories(result.stories);
		} else {
			toast.error("Failed to load stories");
		}
		setIsLoading(false);
	};

	const handleDelete = async (storyId: number) => {
		if (!confirm("Are you sure you want to delete this story?")) return;

		const result = await deleteStoryAction(storyId);
		if (result.success) {
			toast.success("Story deleted");
			setStories(stories.filter((s) => s.id !== storyId));
			if (selectedStory?.id === storyId) {
				setSelectedStory(null);
			}
		} else {
			toast.error("Failed to delete story");
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	if (isLoading) {
		return (
			<div className="max-w-6xl mx-auto">
				<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-12 text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
					<p className="mt-4 text-gray-600 dark:text-gray-400">
						Loading stories...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-6xl mx-auto">
			<div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
				{/* Header */}
				<div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
					<div className="flex items-center justify-between">
						<h1 className="text-3xl font-bold text-white flex items-center gap-3">
							<BookOpen className="w-8 h-8" />
							Story Library
						</h1>
						<Link
							href="/bedtime-story"
							className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-200"
						>
							<ArrowLeft className="w-4 h-4" />
							Create New
						</Link>
					</div>
					<p className="text-purple-100 mt-2">
						{stories.length} {stories.length === 1 ? "story" : "stories"} in
						your collection
					</p>
				</div>

				{/* Content */}
				<div className="p-6">
					{stories.length === 0 ? (
						<div className="text-center py-12">
							<Book className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
							<p className="text-gray-600 dark:text-gray-400 mb-4">
								No stories yet. Create your first magical bedtime story!
							</p>
							<Link
								href="/bedtime-story"
								className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 transition-all"
							>
								Create Story
							</Link>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{stories.map((story) => (
								<div
									key={story.id}
									className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all cursor-pointer"
									onClick={() => setSelectedStory(story)}
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex-1">
											<h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
												{story.topic}
											</h3>
											<div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
												<Clock className="w-3 h-3" />
												{formatDate(story.createdAt)}
											</div>
										</div>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleDelete(story.id);
											}}
											className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>

									<div className="flex flex-wrap gap-1">
										<span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
											Age: {story.childAge}
										</span>
										{story.emphasis.map((tag, idx) => (
											<span
												key={idx}
												className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs capitalize"
											>
												{tag}
											</span>
										))}
									</div>

									<p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
										{story.generatedStory}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Story Modal */}
			{selectedStory && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
					onClick={() => setSelectedStory(null)}
				>
					<div
						className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
							<div className="flex items-center justify-between">
								<h2 className="text-2xl font-bold text-white">
									{selectedStory.topic}
								</h2>
								<button
									type="button"
									onClick={() => setSelectedStory(null)}
									className="text-white hover:bg-white/20 p-2 rounded-full"
								>
									×
								</button>
							</div>
							<div className="text-purple-100 text-sm mt-2">
								{formatDate(selectedStory.createdAt)}
							</div>
						</div>

						<div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
							<div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-2xl p-6 border-l-4 border-orange-300 dark:border-orange-700">
								<p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-serif">
									{selectedStory.generatedStory}
								</p>
							</div>

							<div className="mt-6 flex flex-wrap gap-2">
								<span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
									Age: {selectedStory.childAge}
								</span>
								{selectedStory.emphasis.map((tag, idx) => (
									<span
										key={idx}
										className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm capitalize"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
