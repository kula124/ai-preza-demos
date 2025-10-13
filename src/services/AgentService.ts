import { tool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { Observable } from "rxjs";
import { z } from "zod";
import { RAGService } from "./RAGService";
import { ApplicationEmbeddingService } from "./ApplicationEmbeddingService";
import { db } from "@/lib/db";
import { openPositions, reviewedApplications, applicationPositionMatches } from "@/repo/schema";
import { eq, sql, ilike, or, inArray } from "drizzle-orm";

export interface StandardizedToolResponse {
	data: {
		sources?: Array<{ content: string; filename: string }>;
		searchQuery?: string;
		positions?: Array<any>;
		applications?: Array<any>;
		matches?: Array<any>;
		confirmation?: any;
		toolType?: string;
	};
}

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to multiple systems:
1. Document database - Search uploaded documents for information
2. Job management system - Search positions, find candidate matches, and manage job closures

Available capabilities:
- Search documents: Use 'search_documents' to find information in uploaded PDFs
- Search job positions: Use 'search_open_positions' to find open roles
- Get candidate matches: Use 'get_position_matches' to see n8n-scored candidates for a position
- Search applications: Use 'search_applications' to find candidates by skills/experience
- Close positions: Use 'close_position_with_application' to fill a job with a candidate

When responding:
1. Choose the appropriate tool(s) for the user's request
2. Provide clear, helpful answers based on retrieved data
3. Always cite sources or reference specific positions/candidates
4. For job closures, confirm the action clearly

Be concise and accurate.`;

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

/**
 * Tool for searching open job positions
 */
const createSearchOpenPositionsTool = () => {
	return tool(
		async (input: { keywords: string }) => {
			try {
				const keywords = input.keywords.toLowerCase();

				// Search in title, department, skills, description
				const results = await db
					.select()
					.from(openPositions)
					.where(
						sql`${openPositions.status} = 'open' AND (
							LOWER(${openPositions.title}) LIKE ${`%${keywords}%`} OR
							LOWER(${openPositions.department}) LIKE ${`%${keywords}%`} OR
							LOWER(${openPositions.description}) LIKE ${`%${keywords}%`} OR
							EXISTS (
								SELECT 1 FROM unnest(${openPositions.requiredSkills}) AS skill
								WHERE LOWER(skill) LIKE ${`%${keywords}%`}
							)
						)`
					);

				return JSON.stringify({
					data: {
						positions: results.map(pos => ({
							id: pos.id,
							title: pos.title,
							department: pos.department,
							location: pos.location,
							employmentType: pos.employmentType,
							requiredSkills: pos.requiredSkills,
							experienceLevel: pos.experienceLevel,
							salaryMin: pos.salaryMin,
							salaryMax: pos.salaryMax,
							status: pos.status,
						})),
						searchQuery: keywords,
						toolType: "positions",
					},
				});
			} catch (error) {
				console.error("Search positions tool error:", error);
				return JSON.stringify({
					error: "Failed to search positions",
				});
			}
		},
		{
			name: "search_open_positions",
			description: `Search for open job positions by keywords.

Searches across job titles, departments, required skills, and descriptions.
Returns only positions with status='open'.

Use this when the user asks:
- "What jobs are available?"
- "Show me React developer positions"
- "List open positions in Engineering"
- "Find senior developer roles"`,
			schema: z.object({
				keywords: z.string().describe("Keywords to search for (e.g., 'React', 'Senior Developer', 'Frontend')"),
			}),
		},
	);
};

/**
 * Tool for getting pre-computed matches for a position
 */
const createGetPositionMatchesTool = () => {
	return tool(
		async (input: { positionId: string }) => {
			try {
				const matches = await db
					.select({
						applicationId: applicationPositionMatches.applicationId,
						matchingScore: applicationPositionMatches.matchingScore,
						matchReasoning: applicationPositionMatches.matchReasoning,
						candidateName: reviewedApplications.candidateName,
						overallScore: reviewedApplications.overallScore,
						dateReviewed: reviewedApplications.dateReviewed,
					})
					.from(applicationPositionMatches)
					.innerJoin(
						reviewedApplications,
						eq(applicationPositionMatches.applicationId, reviewedApplications.id)
					)
					.where(eq(applicationPositionMatches.positionId, input.positionId))
					.orderBy(sql`${applicationPositionMatches.matchingScore} DESC`);

				return JSON.stringify({
					data: {
						matches,
						positionId: input.positionId,
						toolType: "matches",
					},
				});
			} catch (error) {
				console.error("Get position matches tool error:", error);
				return JSON.stringify({
					error: "Failed to get position matches",
				});
			}
		},
		{
			name: "get_position_matches",
			description: `Get n8n-computed matches for a specific job position.

Returns applications that have been matched to the position by the n8n agent,
including match scores and reasoning.

Use this when the user asks:
- "Show candidates for job JOB001"
- "Who applied to the React Frontend position?"
- "Get matches for the Senior Developer role"`,
			schema: z.object({
				positionId: z.string().describe("The job position ID (e.g., 'JOB001')"),
			}),
		},
	);
};

/**
 * Tool for semantic search across applications
 */
const createSearchApplicationsTool = () => {
	return tool(
		async (input: { query: string; limit?: number }) => {
			try {
				const embeddingService = new ApplicationEmbeddingService();
				const results = await embeddingService.similaritySearch(
					input.query,
					input.limit || 5
				);

				// Get full application details
				const applicationIds = results.map(r => r.entityId);
				const applications = await db
					.select()
					.from(reviewedApplications)
					.where(inArray(reviewedApplications.id, applicationIds));

				// Combine results with application details
				const enrichedResults = results.map(result => {
					const app = applications.find(a => a.id === result.entityId);
					return {
						applicationId: result.entityId,
						candidateName: app?.candidateName,
						overallScore: app?.overallScore,
						relevantText: result.chunkText,
						similarity: result.similarity,
					};
				});

				return JSON.stringify({
					data: {
						applications: enrichedResults,
						searchQuery: input.query,
						toolType: "applications",
					},
				});
			} catch (error) {
				console.error("Search applications tool error:", error);
				return JSON.stringify({
					error: "Failed to search applications",
				});
			}
		},
		{
			name: "search_applications",
			description: `Search for candidate applications using semantic similarity.

Uses vector embeddings to find applications matching the search query.
Great for finding candidates by skills, experience, or qualifications.

Use this when the user asks:
- "Find Python developers"
- "Show me candidates with React experience"
- "Who has worked with AWS?"`,
			schema: z.object({
				query: z.string().describe("Search query describing desired skills/experience"),
				limit: z.number().optional().describe("Maximum number of results (default: 5)"),
			}),
		},
	);
};

/**
 * Tool for closing a position with an application
 */
const createClosePositionTool = () => {
	return tool(
		async (input: { positionId: string; applicationId: number }) => {
			try {
				// Get position and application details for confirmation
				const [position] = await db
					.select()
					.from(openPositions)
					.where(eq(openPositions.id, input.positionId))
					.limit(1);

				const [application] = await db
					.select()
					.from(reviewedApplications)
					.where(eq(reviewedApplications.id, input.applicationId))
					.limit(1);

				if (!position) {
					return JSON.stringify({ error: `Position ${input.positionId} not found` });
				}

				if (!application) {
					return JSON.stringify({ error: `Application ${input.applicationId} not found` });
				}

				// Update position to closed
				await db
					.update(openPositions)
					.set({
						status: "filled",
						closedBy: input.applicationId,
						updatedAt: new Date(),
					})
					.where(eq(openPositions.id, input.positionId));

				return JSON.stringify({
					data: {
						confirmation: {
							positionId: position.id,
							positionTitle: position.title,
							applicationId: application.id,
							candidateName: application.candidateName,
							message: `Position "${position.title}" has been filled with ${application.candidateName}'s application`,
						},
						toolType: "confirmation",
					},
				});
			} catch (error) {
				console.error("Close position tool error:", error);
				return JSON.stringify({
					error: "Failed to close position",
				});
			}
		},
		{
			name: "close_position_with_application",
			description: `Close a job position by assigning it to a candidate's application.

Updates the position status to 'filled' and records which application was selected.
This is a permanent action.

Use this when the user asks:
- "Close job JOB001 with application 5"
- "Fill the React position with Ivan Kulis's application"
- "Hire candidate from application 3 for the Frontend role"`,
			schema: z.object({
				positionId: z.string().describe("The job position ID to close (e.g., 'JOB001')"),
				applicationId: z.number().describe("The application ID to select"),
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
							createSearchOpenPositionsTool(),
							createGetPositionMatchesTool(),
							createSearchApplicationsTool(),
							createClosePositionTool(),
						],
						checkpointSaver: AgentService.memorySaver,
						messageModifier: SYSTEM_PROMPT,
					});

					await streamingAgent.invoke(
						{
							messages: [
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
			tools: [
				createSearchTool(),
				createSearchOpenPositionsTool(),
				createGetPositionMatchesTool(),
				createSearchApplicationsTool(),
				createClosePositionTool(),
			],
			checkpointSaver: AgentService.memorySaver,
			messageModifier: SYSTEM_PROMPT,
		});

		const promptTemplate = PromptTemplate.fromTemplate(USER_PROMPT_TEMPLATE);
		const formattedPrompt = await promptTemplate.format({ message });

		const results = await agent.invoke(
			{
				messages: [
					{ role: "user", content: formattedPrompt },
				],
			},
			{ configurable: { thread_id } },
		);

		return results.messages.at(-1)?.content || "Something went wrong";
	}
}
