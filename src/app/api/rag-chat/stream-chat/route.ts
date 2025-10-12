import { NextRequest } from "next/server";
import { AgentService } from "@/services/AgentService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StreamChatRequest {
	message: string;
	thread_id: string;
}

export async function POST(request: NextRequest) {
	try {
		const body: StreamChatRequest = await request.json();
		const { message, thread_id } = body;

		if (!message || !thread_id) {
			return new Response("Missing required fields", { status: 400 });
		}

		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			async start(controller) {
				try {
					const observable = AgentService.streamChat(message, thread_id);

					observable.subscribe({
						next: (chunk) => {
							if (typeof chunk === "string") {
								// Text chunk from LLM
								controller.enqueue(encoder.encode(chunk));
							} else {
								// Tool data
								const toolDataString = `__TOOL_DATA_START__\n${JSON.stringify(chunk)}\n__TOOL_DATA_END__`;
								controller.enqueue(encoder.encode(toolDataString));
							}
						},
						error: (error) => {
							console.error("Stream error:", error);
							controller.error(error);
						},
						complete: () => {
							controller.close();
						},
					});
				} catch (error) {
					console.error("Error in stream start:", error);
					controller.error(error);
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Transfer-Encoding": "chunked",
			},
		});
	} catch (error) {
		console.error("Error in POST handler:", error);
		return new Response("Internal server error", { status: 500 });
	}
}
