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
import { getDb } from "@/lib/db";
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
		toolUsage?: {
			name: string;
			input: any;
		};
		toolType?: string;
	};
}

const SYSTEM_PROMPT = `You are a helpful AI assistant with access to multiple systems:
1. Document database - Search uploaded documents for information
2. Bedtime stories database - Personalized stories for children
3. Job management system - Search positions, find candidate matches, and manage job closures
4. Job applications database - Reviewed job applications

Available capabilities:
- Search documents: Use 'search_documents' to find information in uploaded PDFs
- Search stories: Use 'search_stories' to find bedtime stories
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

Please search the appropriate database and provide a helpful answer.`;

/**
 * Tool for searching documents via vector similarity
 */
const createSearchTool = () => {
	return tool(
		// biome-ignore lint/suspicious/noExplicitAny: LangChain tool type compatibility
		async (input: any) => {
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
		// biome-ignore lint/suspicious/noExplicitAny: LangChain tool type compatibility
		async (input: any) => {
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
 * Tool for searching open job positions
 */
const createSearchOpenPositionsTool = () => {
	return tool(
		// biome-ignore lint/suspicious/noExplicitAny: LangChain tool type compatibility
		async (input: any) => {
			try {
				const keywords = input.keywords.toLowerCase();

				// Search in title, department, skills, description
				const results = await getDb()
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
		// biome-ignore lint/suspicious/noExplicitAny: LangChain tool type compatibility
		async (input: any) => {
			try {
				const matches = await getDb()
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
 * Tool for semantic search across applications (combined both implementations)
 */
const createSearchApplicationsTool = () => {
	return tool(
		// biome-ignore lint/suspicious/noExplicitAny: LangChain tool type compatibility
		async (input: any) => {
			try {
				const embeddingService = new ApplicationEmbeddingService();
				const results = await embeddingService.similaritySearch(
					input.query,
					input.limit || 5
				);

				// Get full application details
				const applicationIds = results.map(r => r.entityId);
				const applications = await getDb()
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

KEYWORD RULES - Use this tool if the user's question mentions ANY of these keywords:
- "job", "jobs", "application", "applications", "applicant", "applicants"
- "candidate", "candidates", "resume", "resumes", "CV"
- "hire", "hiring", "recruit", "recruiting"

Uses vector embeddings to find applications matching the search query.
Great for finding candidates by skills, experience, or qualifications.

Use this when the user asks:
- "Find Python developers"
- "Show me candidates with React experience"
- "Who has worked with AWS?"
- "Find applications from software engineers"`,
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
		// biome-ignore lint/suspicious/noExplicitAny: LangChain tool type compatibility
		async (input: any) => {
			try {
				// Get position and application details for confirmation
				const [position] = await getDb()
					.select()
					.from(openPositions)
					.where(eq(openPositions.id, input.positionId))
					.limit(1);

				const [application] = await getDb()
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
				await getDb()
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
							createStorySearchTool(),
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
							messages: [{ role: "user", content: formattedPrompt }],
						},
						{
							configurable: { thread_id },
							callbacks: [
								{
									// biome-ignore lint/suspicious/noExplicitAny: LangChain callback type
									handleToolStart(tool: any, input: string) {
										try {
											const toolName = tool.name || "unknown_tool";
											const toolInput = typeof input === 'string' ? JSON.parse(input) : input;

											subscriber.next({
												data: {
													toolUsage: {
														name: toolName,
														input: toolInput,
													},
													toolType: "tool_start",
												},
											});
										} catch (error) {
											console.error("Error handling tool start:", error);
										}
									},
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
				messages: [{ role: "user", content: formattedPrompt }],
			},
			{ configurable: { thread_id } },
		);

		const lastMessage = results.messages.at(-1);
		const content = lastMessage?.content;

		// Handle both string and array content types
		if (typeof content === "string") {
			return content;
		} else if (Array.isArray(content)) {
			return content.map(c => typeof c === "string" ? c : JSON.stringify(c)).join("");
		}

		return "Something went wrong";
	}
}
