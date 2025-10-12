"use client";

import { useState } from "react";
import { MessageSquare, FileStack } from "lucide-react";
import Link from "next/link";
import ChatInterface from "./(components)/ChatInterface";
import { useStreamingChat } from "./(hooks)/useStreamingChat";
import type { IMessage } from "./(components)/types";

export default function RAGChatPage() {
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [inputText, setInputText] = useState("");
	const [threadId] = useState(Date.now().toString());

	const {
		streamedContent,
		toolData,
		isStreaming,
		isStartingStreaming,
		startStreaming,
		stopStreaming,
		clearContent,
	} = useStreamingChat();

	return (
		<div className="h-screen flex flex-col">
			{/* Header */}
			<div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-50 flex items-center gap-3">
							<div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
								<MessageSquare className="w-6 h-6 text-white" />
							</div>
							RAG Chat
						</h1>
						<p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
							Ask questions about your uploaded documents
						</p>
					</div>
					<Link
						href="/rag-documents"
						className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
					>
						<FileStack className="w-5 h-5" />
						Manage Documents
					</Link>
				</div>
			</div>

			{/* Chat Interface */}
			<div className="flex-1 overflow-hidden">
				<ChatInterface
					messages={messages}
					setMessages={setMessages}
					inputText={inputText}
					setInputText={setInputText}
					threadId={threadId}
					streamedContent={streamedContent}
					toolData={toolData}
					isStreaming={isStreaming}
					isStartingStreaming={isStartingStreaming}
					startStreaming={startStreaming}
					stopStreaming={stopStreaming}
					clearContent={clearContent}
				/>
			</div>
		</div>
	);
}
