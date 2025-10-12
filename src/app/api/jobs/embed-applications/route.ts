import { NextRequest, NextResponse } from "next/server";
import { ApplicationEmbeddingService } from "@/services/ApplicationEmbeddingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/embed-applications/stats
 * Get embedding statistics
 */
export async function GET(request: NextRequest) {
	try {
		const service = new ApplicationEmbeddingService();
		const stats = await service.getEmbeddingStats();

		return NextResponse.json({
			success: true,
			stats,
		});
	} catch (error) {
		console.error("Error getting embedding stats:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to get embedding statistics",
			},
			{ status: 500 },
		);
	}
}

/**
 * POST /api/jobs/embed-applications
 * Embed all unembed applications
 */
export async function POST(request: NextRequest) {
	try {
		const service = new ApplicationEmbeddingService();

		// First, get stats to show what we're about to do
		const statsBefore = await service.getEmbeddingStats();

		if (statsBefore.unembeddedApplications === 0) {
			return NextResponse.json({
				success: true,
				message: "All applications are already embedded",
				processed: 0,
				errors: [],
				stats: statsBefore,
			});
		}

		// Embed unembed applications
		const result = await service.embedUnembeddedApplications();

		// Get updated stats
		const statsAfter = await service.getEmbeddingStats();

		return NextResponse.json({
			success: true,
			message: `Successfully embedded ${result.processed} applications`,
			processed: result.processed,
			errors: result.errors,
			statsBefore,
			statsAfter,
		});
	} catch (error) {
		console.error("Error embedding applications:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to embed applications",
			},
			{ status: 500 },
		);
	}
}
