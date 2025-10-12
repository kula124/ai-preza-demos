import { tool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { Observable } from "rxjs";
import { z } from "zod";
import { RAGService } from "./RAGService";

export interface StandardizedToolResponse {
	data: {
		sources: Array<{ content: string; filename: string }>;
		searchQuery: string;
	};
}

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to a document database.
You can search through uploaded documents to find relevant information.

When a user asks a question:
1. Use the 'search_documents' tool to find relevant information
2. Provide a clear, helpful answer based on the retrieved context
3. Always cite your sources

Be concise and accurate. If information isn't found in the documents, say so clearly.`;

const USER_PROMPT_TEMPLATE = `User question: {message}

Please search the document database and provide a helpful answer.`;

/**
 * Tool for searching documents via vector similarity
 */
const createSearchTool = () => {
	return tool(
		async (input: { query: string }) => {
			try {
				const query = input.query;

				// Extract search keywords if formatted
				const searchMatch = query.match(/search:\s*([^\n\r]+)/i);
				const actualQuery = searchMatch ? searchMatch[1].trim() : query;

				// Perform vector similarity search
				const results = await RAGService.similaritySearch(actualQuery, 5);

				return JSON.stringify({
					data: {
						sources: results,
						searchQuery: actualQuery,
					},
				});
			} catch (error) {
				console.error("Search tool error:", error);
				return JSON.stringify({
					error: "Failed to search documents",
				});
			}
		},
		{
			name: "search_documents",
			description: `Search through all uploaded documents using semantic similarity.

This tool searches across all PDF documents that have been uploaded to the system.
It uses vector embeddings to find the most relevant passages related to your query.

Use this tool whenever the user asks about:
- Information contained in their documents
- Company rules, policies, or guidelines
- Travel expense procedures
- Any topic that might be documented

FORMAT: You can either pass the query directly or use "search: [keywords]" format
EXAMPLES:
- "What are the travel expense rules?"
- "Find information about sick leave policy search: sick leave"
- "What does the document say about remote work?"`,
			schema: z.object({
				query: z.string().describe("The search query to find relevant documents"),
			}),
		},
	);
};

export class AgentService {
	private static readonly memorySaver = new MemorySaver();

	/**
	 * Stream chat responses with tool calling
	 */
	static streamChat(
		message: string,
		thread_id: string,
	): Observable<string | StandardizedToolResponse> {
		return new Observable((subscriber) => {
			(async () => {
				try {
					const promptTemplate = PromptTemplate.fromTemplate(
						USER_PROMPT_TEMPLATE,
					);
					const formattedPrompt = await promptTemplate.format({ message });

					const streamingLlm = new ChatAnthropic({
						apiKey: process.env.ANTHROPIC_API_KEY,
						model: "claude-3-7-sonnet-20250219",
						streaming: true,
						callbacks: [
							{
								handleLLMNewToken(token: string) {
									subscriber.next(token);
								},
								handleLLMError(err: Error) {
									subscriber.error(err);
								},
								handleLLMStart() {
									console.log("LLM Stream started");
								},
							},
						],
					});

					const streamingAgent = createReactAgent({
						llm: streamingLlm,
						tools: [createSearchTool()],
						checkpointSaver: AgentService.memorySaver,
					});

					await streamingAgent.invoke(
						{
							messages: [
								{ role: "system", content: SYSTEM_PROMPT },
								{ role: "user", content: formattedPrompt },
							],
						},
						{
							configurable: { thread_id },
							callbacks: [
								{
									// biome-ignore lint/suspicious/noExplicitAny: LangChain callback type
									handleToolEnd(output: any) {
										try {
											const toolData = JSON.parse(output.content);
											subscriber.next({
												data: toolData.data,
											});
										} catch (error) {
											console.error("Error parsing tool output:", error);
										}
									},
								},
							],
						},
					);

					subscriber.complete();
				} catch (error) {
					subscriber.error(error);
				}
			})();
		});
	}

	/**
	 * Non-streaming chat (for simple use cases)
	 */
	static async chat(message: string, thread_id: string): Promise<string> {
		const llm = new ChatAnthropic({
			apiKey: process.env.ANTHROPIC_API_KEY,
			model: "claude-3-7-sonnet-20250219",
		});

		const agent = createReactAgent({
			llm: llm,
			tools: [createSearchTool()],
			checkpointSaver: AgentService.memorySaver,
		});

		const promptTemplate = PromptTemplate.fromTemplate(USER_PROMPT_TEMPLATE);
		const formattedPrompt = await promptTemplate.format({ message });

		const results = await agent.invoke(
			{
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: formattedPrompt },
				],
			},
			{ configurable: { thread_id } },
		);

		return results.messages.at(-1)?.content || "Something went wrong";
	}
}
