import { useCallback, useRef, useState } from "react";
import type { StandardizedToolResponse } from "@/services/AgentService";

export interface IAgentChatDto {
	message: string;
	thread_id: string;
}

export const useStreamingChat = () => {
	const [streamedContent, setStreamedContent] = useState<string>("");
	const [toolData, setToolData] = useState<StandardizedToolResponse | null>(
		null,
	);
	const [isStartingStreaming, setIsStartingStreaming] =
		useState<boolean>(false);
	const [isStreaming, setIsStreaming] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const contentRef = useRef<string>("");

	const startStreaming = useCallback(async (chatDto: IAgentChatDto) => {
		setStreamedContent("");
		contentRef.current = "";
		setToolData(null);
		setError(null);
		setIsStreaming(true);
		setIsStartingStreaming(true);

		abortControllerRef.current = new AbortController();

		try {
			const response = await fetch("/api/rag-chat/stream-chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: chatDto.message,
					thread_id: chatDto.thread_id,
				}),
				signal: abortControllerRef.current.signal,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("No reader available");
			}

			const decoder = new TextDecoder();
			let isFirstChunk = true;

			while (true) {
				const { done, value } = await reader.read();

				if (done || abortControllerRef.current?.signal.aborted) {
					break;
				}

				const chunk = decoder.decode(value, { stream: true });

				if (
					chunk.includes("__TOOL_DATA_START__") &&
					chunk.includes("__TOOL_DATA_END__")
				) {
					const startMarker = "__TOOL_DATA_START__\n";
					const endMarker = "\n__TOOL_DATA_END__";

					const startIndex = chunk.indexOf(startMarker);
					const endIndex = chunk.indexOf(endMarker);

					const toolDataJson = chunk.substring(
						startIndex + startMarker.length,
						endIndex,
					);
					try {
						const parsed = JSON.parse(toolDataJson);
						setToolData(parsed);
					} catch (error) {
						console.error("Error parsing tool data:", error);
					}

					const textBeforeMarkers = chunk.substring(0, startIndex);
					contentRef.current += textBeforeMarkers;
				} else {
					contentRef.current += chunk;
				}

				if (isFirstChunk) {
					setIsStartingStreaming(false);
					isFirstChunk = false;
				}

				setStreamedContent(contentRef.current);
			}
		} catch (err) {
			if (
				!abortControllerRef.current?.signal.aborted &&
				!(
					err instanceof Error &&
					(err.name === "AbortError" || err.message.includes("aborted"))
				)
			) {
				console.error("Streaming error details:", err);
				setError(
					err instanceof Error
						? err.message
						: "An error occurred while streaming",
				);
			}
		} finally {
			setIsStreaming(false);
			setIsStartingStreaming(false);
			abortControllerRef.current = null;
		}
	}, []);

	const stopStreaming = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsStreaming(false);
	}, []);

	const clearContent = useCallback(() => {
		setStreamedContent("");
		contentRef.current = "";
		setToolData(null);
		setError(null);
	}, []);

	return {
		streamedContent,
		toolData,
		isStreaming,
		isStartingStreaming,
		error,
		startStreaming,
		stopStreaming,
		clearContent,
	};
};
