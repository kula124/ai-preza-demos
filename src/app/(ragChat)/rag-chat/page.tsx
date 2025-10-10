import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "RAG Chat",
};

export default function RAGChatPage() {
	return (
		<div className="max-w-4xl mx-auto">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
					<MessageSquare className="h-6 w-6 text-white" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">RAG Chat</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Document Q&A with AI
					</p>
				</div>
			</div>

			<div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
				<p className="text-lg text-gray-600 dark:text-gray-400 text-center">
					Coming soon! Upload documents and ask questions using RAG.
				</p>
			</div>
		</div>
	);
}
