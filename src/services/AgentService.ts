import { tool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { Observable } from "rxjs";
import { z } from "zod";
import { RAGService } from "./RAGService";
import { StoryEmbeddingService } from "./StoryEmbeddingService";
import { ApplicationEmbeddingService } from "./ApplicationEmbeddingService";

export interface StandardizedToolResponse {
	data: {
		sources: Array<{ content: string; filename: string }>;
		searchQuery: string;
	};
}

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to multiple databases:
- Document database (uploaded PDFs and documents)
- Bedtime stories database (personalized stories for children)
- Job applications database (reviewed job applications)

When a user asks a question:
1. Determine which database is most relevant to their question
2. Use the appropriate search tool to find relevant information
3. Provide a clear, helpful answer based on the retrieved context
4. Always cite your sources

Be concise and accurate. If information isn't found, say so clearly.`;

const USER_PROMPT_TEMPLATE = `User question: {message}

Please search the appropriate database and provide a helpful answer.`;

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
			description: `Search through uploaded PDF documents using semantic similarity.

KEYWORD RULES - Use this tool ONLY if the user's question mentions:
- "document", "PDF", "policy", "procedure", "guideline", "uploaded"
- Company-specific topics like "travel expense", "sick leave", "remote work"

DO NOT use this tool if the question mentions:
- "bedtime", "story", "stories", "character", "tale" → use search_stories instead
- "job", "application", "candidate", "resume", "applicant" → use search_applications instead

Use this tool for:
- Company rules, policies, or guidelines
- Travel expense procedures
- Technical documentation
- Any uploaded PDF content

EXAMPLES:
- "What are the travel expense rules?"
- "Find information about sick leave policy"
- "What does the document say about remote work?"`,
			schema: z.object({
				query: z.string().describe("The search query to find relevant documents"),
			}),
		},
	);
};

/**
 * Tool for searching bedtime stories via vector similarity
 */
const createStorySearchTool = () => {
	return tool(
		async (input: { query: string }) => {
			try {
				const storyService = new StoryEmbeddingService();
				const results = await storyService.similaritySearch(input.query, 3);

				return JSON.stringify({
					data: {
						sources: results.map((r) => ({
							content: r.content,
							filename: `Story: ${r.entity.topic || "Bedtime Story"} (Age ${r.entity.child_age || r.entity.childAge})`,
							storyId: r.entityId,
							details: r.entity,
						})),
						searchQuery: input.query,
					},
				});
			} catch (error) {
				console.error("Story search tool error:", error);
				return JSON.stringify({
					error: "Failed to search stories",
				});
			}
		},
		{
			name: "search_stories",
			description: `Search through generated bedtime stories using semantic similarity.

KEYWORD RULES - Use this tool if the user's question mentions ANY of these keywords:
- "bedtime", "story", "stories", "tale", "tales"
- "character", "characters", "protagonist", "hero"
- Story-related terms like "plot", "narrative", "adventure"

IMPORTANT: If you see "bedtime" or "story" in the question, ALWAYS use this tool!

This searches the actual generated bedtime stories in our database, not documents about stories.

Use this tool for:
- Questions about story characters (who, what characters appear)
- Story topics (animals, space, adventure, etc.)
- Story themes or lessons
- Stories for specific age groups
- Finding stories with certain content

EXAMPLES:
- "Can you tell me the names of the main characters in the bedtime stories?"
- "Find stories about animals"
- "Show me adventure stories for 5 year olds"
- "What characters appear in the stories?"
- "What stories teach about kindness?"`,
			schema: z.object({
				query: z.string().describe("The search query to find relevant stories"),
			}),
		},
	);
};

/**
 * Tool for searching job applications via vector similarity
 */
const createApplicationSearchTool = () => {
	return tool(
		async (input: { query: string }) => {
			try {
				const appService = new ApplicationEmbeddingService();
				const results = await appService.similaritySearch(input.query, 3);

				return JSON.stringify({
					data: {
						sources: results.map((r) => ({
							content: r.content,
							filename: `Application: ${r.entity.candidate_name || r.entity.candidateName} - ${r.entity.position_applied || r.entity.positionApplied}`,
							applicationId: r.entityId,
							details: r.entity,
						})),
						searchQuery: input.query,
					},
				});
			} catch (error) {
				console.error("Application search tool error:", error);
				return JSON.stringify({
					error: "Failed to search applications",
				});
			}
		},
		{
			name: "search_applications",
			description: `Search through all job applications using semantic similarity.

KEYWORD RULES - Use this tool if the user's question mentions ANY of these keywords:
- "job", "jobs", "application", "applications", "applicant", "applicants"
- "candidate", "candidates", "resume", "resumes", "CV"
- "hire", "hiring", "recruit", "recruiting", "position"

IMPORTANT: If you see "job" or "application" or "candidate" in the question, ALWAYS use this tool!

This searches across all reviewed job applications in the system.

Use this tool for:
- Finding candidates with specific skills
- Applications for particular positions
- Candidates with certain experience levels
- Applications with specific qualifications or backgrounds

EXAMPLES:
- "Find applications from software engineers"
- "Show me candidates with Python experience"
- "What applications mention leadership skills?"`,
			schema: z.object({
				query: z
					.string()
					.describe("The search query to find relevant applications"),
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
						tools: [
							createSearchTool(),
							createStorySearchTool(),
							createApplicationSearchTool(),
						],
						checkpointSaver: AgentService.memorySaver,
						messageModifier: SYSTEM_PROMPT, // Use messageModifier instead of system message in messages array
					});

					await streamingAgent.invoke(
						{
							messages: [{ role: "user", content: formattedPrompt }],
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
			tools: [
				createSearchTool(),
				createStorySearchTool(),
				createApplicationSearchTool(),
			],
			checkpointSaver: AgentService.memorySaver,
			messageModifier: SYSTEM_PROMPT, // Use messageModifier instead of system message in messages array
		});

		const promptTemplate = PromptTemplate.fromTemplate(USER_PROMPT_TEMPLATE);
		const formattedPrompt = await promptTemplate.format({ message });

		const results = await agent.invoke(
			{
				messages: [{ role: "user", content: formattedPrompt }],
			},
			{ configurable: { thread_id } },
		);

		return results.messages.at(-1)?.content || "Something went wrong";
	}
}
