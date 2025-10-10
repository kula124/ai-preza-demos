import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bedtime Story Writer",
};

export default function BedtimeStoryPage() {
	return (
		<div className="max-w-4xl mx-auto">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
					<BookOpen className="h-6 w-6 text-white" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Bedtime Story Writer</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Create magical stories for children
					</p>
				</div>
			</div>

			<div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
				<p className="text-lg text-gray-600 dark:text-gray-400 text-center">
					Coming soon! This feature will allow you to create personalized
					bedtime stories.
				</p>
			</div>
		</div>
	);
}
