"use server";

import { db } from "@/lib/db";
import {
	reviewedApplications,
	applicationPositionMatches,
} from "@/repo/schema";
import { eq, desc } from "drizzle-orm";

export async function getApplicationsAction() {
	try {
		const applications = await db
			.select()
			.from(reviewedApplications)
			.orderBy(desc(reviewedApplications.dateReviewed));

		return {
			success: true,
			applications,
		};
	} catch (error) {
		console.error("Error fetching applications:", error);
		return {
			success: false,
			applications: [],
		};
	}
}

export async function getApplicationByIdAction(id: number) {
	try {
		// Get application
		const applicationResult = await db
			.select()
			.from(reviewedApplications)
			.where(eq(reviewedApplications.id, id))
			.limit(1);

		if (applicationResult.length === 0) {
			return {
				success: false,
				error: "Application not found",
			};
		}

		// Get position matches
		const matches = await db
			.select()
			.from(applicationPositionMatches)
			.where(eq(applicationPositionMatches.applicationId, id));

		return {
			success: true,
			application: {
				...applicationResult[0],
				matches,
			},
		};
	} catch (error) {
		console.error("Error fetching application:", error);
		return {
			success: false,
			error: "Failed to fetch application",
		};
	}
}

export async function deleteApplicationAction(id: number) {
	try {
		await db
			.delete(reviewedApplications)
			.where(eq(reviewedApplications.id, id));

		return {
			success: true,
		};
	} catch (error) {
		console.error("Error deleting application:", error);
		return {
			success: false,
			error: "Failed to delete application",
		};
	}
}
