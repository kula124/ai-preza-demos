"use client";

import {
	Bot,
	SendIcon,
	StopCircleIcon,
	ArrowDownIcon,
	Loader2,
} from "lucide-react";
import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { StandardizedToolResponse } from "@/services/AgentService";
import type { IMessage } from "./types";
import SourceResults from "./SourceResults";
import MessageMarkdown from "@/components/MessageMarkdown";
import JobPositionResults from "./JobPositionResults";
import ApplicationResults from "./ApplicationResults";
import PositionMatchesResults from "./PositionMatchesResults";
import JobActionConfirmation from "./JobActionConfirmation";

interface ChatInterfaceProps {
	messages: IMessage[];
	setMessages: Dispatch<SetStateAction<IMessage[]>>;
	inputText: string;
	setInputText: Dispatch<SetStateAction<string>>;
	threadId: string;
	streamedContent: string;
	toolData: StandardizedToolResponse | null;
	isStreaming: boolean;
	isStartingStreaming: boolean;
	startStreaming: (dto: {
		message: string;
		thread_id: string;
	}) => Promise<void>;
	stopStreaming: () => void;
	clearContent: () => void;
}

export default function ChatInterface({
	messages,
	setMessages,
	inputText,
	setInputText,
	threadId,
	streamedContent,
	toolData,
	isStreaming,
	isStartingStreaming,
	startStreaming,
	stopStreaming,
	clearContent,
}: ChatInterfaceProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [isScrolledUp, setIsScrolledUp] = useState(false);

	const checkScrollPosition = useCallback(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const tolerance = 140;
		const isNearBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

		setIsScrolledUp(!isNearBottom);
	}, []);

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		scrollContainer.addEventListener("scroll", checkScrollPosition);
		checkScrollPosition();

		return () => {
			scrollContainer.removeEventListener("scroll", checkScrollPosition);
		};
	}, [checkScrollPosition]);

	// Update messages with streamed content
	useEffect(() => {
		if (streamedContent && isStreaming) {
			setMessages((prev) => {
				const updatedMessages = [...prev];
				const lastMessage = updatedMessages[updatedMessages.length - 1];

				if (lastMessage && !lastMessage.isUser) {
					updatedMessages[updatedMessages.length - 1] = {
						...lastMessage,
						text: streamedContent,
						isStreaming: true,
					};
				}

				return updatedMessages;
			});
		}
	}, [streamedContent, isStreaming, setMessages]);

	// Update messages with tool data
	useEffect(() => {
		if (toolData?.data) {
			setMessages((prev) => {
				const updatedMessages = [...prev];
				const lastMessage = updatedMessages[updatedMessages.length - 1];

				const toolType = toolData.data.toolType;
				const update: Partial<IMessage> = { isStreaming: false };

				// Handle different tool types
				if (toolType === "tool_start" && toolData.data.toolUsage) {
					// Tool usage indicator - append to existing text
					const toolName = toolData.data.toolUsage.name;
					const displayName = toolName.replace(/_/g, ' ');
					update.text = `${lastMessage.text}\n\n🔧 Using tool: ${displayName}`;
					update.toolUsage = toolData.data.toolUsage;
				} else if (toolType === "positions" && toolData.data.positions) {
					update.positions = toolData.data.positions;
					update.searchQuery = toolData.data.searchQuery;
					update.toolType = "positions";
				} else if (toolType === "applications" && toolData.data.applications) {
					update.applications = toolData.data.applications;
					update.searchQuery = toolData.data.searchQuery;
					update.toolType = "applications";
				} else if (toolType === "matches" && toolData.data.matches) {
					update.matches = toolData.data.matches;
					update.toolType = "matches";
				} else if (toolType === "confirmation" && toolData.data.confirmation) {
					update.confirmation = toolData.data.confirmation;
					update.toolType = "confirmation";
				} else if ("sources" in toolData.data && toolData.data.sources) {
					// Document search results
					update.sources = toolData.data.sources;
					update.searchQuery = toolData.data.searchQuery;
					update.toolType = "sources";
				}

				updatedMessages[updatedMessages.length - 1] = {
					...lastMessage,
					...update,
				};

				return updatedMessages;
			});
		}
	}, [toolData, setMessages]);

	const scrollToBottom = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: scrollContainerRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	};

	const userMessages = useMemo(
		() => messages.filter((msg) => msg.isUser),
		[messages],
	);

	useEffect(() => {
		if (messages.length > 0 && userMessages.length > 0) {
			setTimeout(() => {
				scrollToBottom();
			}, 200);
		}
	}, [messages.length, userMessages.length]);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputText(e.target.value);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const sendMessage = async () => {
		if (inputText.trim() === "") return;

		if (isStreaming) {
			stopStreaming();
			clearContent();
		}

		const userMessage = inputText;
		const timestamp = Date.now();
		const userMessageId = `${timestamp.toString()}_user`;
		setMessages((prev) => [
			...prev,
			{ id: userMessageId, text: userMessage, isUser: true },
		]);

		setInputText("");

		const streamingMessageId = `${timestamp.toString()}_agent`;
		const streamingMessage: IMessage = {
			id: streamingMessageId,
			text: "",
			isUser: false,
			isStreaming: true,
		};
		setMessages((prev) => [...prev, streamingMessage]);

		try {
			await startStreaming({
				message: userMessage,
				thread_id: threadId,
			});
		} catch (error) {
			console.error("Error chatting with agent:", error);

			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === streamingMessageId
						? {
								...msg,
								text: "Something went wrong. Please try again.",
								isStreaming: false,
								isUser: false,
							}
						: msg,
				),
			);
		}
	};

	return (
		<div className="p-4 flex flex-col h-full">
			<div className="flex h-full w-full flex-col">
				<div
					className="flex w-full flex-1 flex-col overflow-y-scroll overflow-x-hidden pb-8 px-4"
					ref={scrollContainerRef}
				>
					{messages.length === 0 ? (
						<div className="h-full w-full flex items-center justify-center">
							<div className="text-center max-w-md mx-auto px-4">
								<div className="mb-6">
									<div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-800/20 to-blue-700/20 dark:from-purple-400/20 dark:to-blue-500/20 rounded-xl flex items-center justify-center">
										<Bot className="h-8 w-8 text-purple-800 dark:text-purple-400" />
									</div>
									<h3 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-2">
										AI Assistant
									</h3>
									<p className="text-gray-500 dark:text-slate-500">
										Ask questions about your documents, search for jobs, find
										candidates, and manage positions.
									</p>
								</div>
								<div className="grid grid-cols-1 gap-2 text-sm">
									<div className="bg-gray-300/50 dark:bg-slate-800/50 rounded-lg p-3 text-left">
										<p className="font-medium text-gray-900 dark:text-slate-50 mb-1">
											Example questions:
										</p>
										<ul className="text-gray-500 dark:text-slate-500 space-y-1">
											<li>• "What are the travel expense rules?"</li>
											<li>• "Show me React developer positions"</li>
											<li>• "Find Python developers"</li>
											<li>• "Get candidates for job JOB001"</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					) : (
						messages.map((message, index) => (
							<div
								key={message.id}
								className={`flex flex-col animate-fade-in gap-3 ${
									index === messages.length - 1 ? "!pb-16" : ""
								}`}
							>
								{/* Message Content */}
								<div
									className={`flex gap-3 rounded-lg p-3 px-4 ${
										message.isUser
											? "max-w-[75%] self-end bg-gray-300 text-black dark:bg-slate-800 dark:text-slate-50"
											: "max-w-[100%] self-start !p-0 bg-transparent mt-4"
									}`}
								>
									<div className="min-w-0 w-full break-words">
										{message.isUser ? (
											<div className="whitespace-pre-wrap">{message.text}</div>
										) : (
											<MessageMarkdown content={message.text} />
										)}
										{message.isStreaming &&
											message.id === messages[messages.length - 1].id &&
											isStartingStreaming && (
												<span className="inline-block h-3 w-3 animate-pulse rounded-full bg-purple-600 ml-1" />
											)}
									</div>
								</div>

								{/* Display tool results */}
								{!message.isUser && (
									<>
										{/* Document sources */}
										{message.sources && message.sources.length > 0 && (
											<div className="max-w-[100%] self-start">
												<SourceResults sources={message.sources} />
											</div>
										)}

										{/* Job positions */}
										{message.positions && message.positions.length > 0 && (
											<div className="max-w-[100%] self-start">
												<JobPositionResults
													positions={message.positions}
													searchQuery={message.searchQuery}
												/>
											</div>
										)}

										{/* Applications */}
										{message.applications && message.applications.length > 0 && (
											<div className="max-w-[100%] self-start">
												<ApplicationResults
													applications={message.applications}
													searchQuery={message.searchQuery}
												/>
											</div>
										)}

										{/* Position matches */}
										{message.matches && message.matches.length > 0 && (
											<div className="max-w-[100%] self-start">
												<PositionMatchesResults
													matches={message.matches}
													positionId=""
												/>
											</div>
										)}

										{/* Confirmation */}
										{message.confirmation && (
											<div className="max-w-[100%] self-start">
												<JobActionConfirmation
													confirmation={message.confirmation}
												/>
											</div>
										)}
									</>
								)}
							</div>
						))
					)}
				</div>

				<div className="flex w-full flex-col gap-4 bg-transparent relative z-10">
					{isScrolledUp && (
						<div className="flex cursor-pointer items-center bg-transparent justify-center">
							<button
								type="button"
								className="flex cursor-pointer items-center justify-center rounded-full border border-gray-300 dark:border-slate-800 bg-background p-2 hover:bg-gray-300/50 dark:hover:bg-slate-800/50"
								onClick={scrollToBottom}
							>
								<ArrowDownIcon className="h-5 w-5" />
							</button>
						</div>
					)}

					<div className="flex items-center gap-3 px-2 w-full">
						<textarea
							value={inputText}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							placeholder="Ask about documents, jobs, or candidates..."
							className="flex-1 h-10 min-h-10 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
						/>
						<button
							type="button"
							onClick={isStreaming ? stopStreaming : sendMessage}
							disabled={!isStreaming && inputText.trim() === ""}
							className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{isStreaming ? (
								<StopCircleIcon className="h-6 w-6" />
							) : (
								<SendIcon className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
