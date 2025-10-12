"use server";

import { db } from "@/lib/db";
import { openPositions } from "@/repo/schema";
import { eq, desc } from "drizzle-orm";
import type { PositionFormData } from "../types";

export async function createPositionAction(formData: PositionFormData) {
	try {
		const result = await db
			.insert(openPositions)
			.values({
				id: formData.id,
				title: formData.title,
				department: formData.department,
				requiredSkills: formData.requiredSkills,
				experienceLevel: formData.experienceLevel,
				location: formData.location,
				employmentType: formData.employmentType,
				salaryMin: formData.salaryMin,
				salaryMax: formData.salaryMax,
				description: formData.description,
				status: "open",
			})
			.returning();

		return {
			success: true,
			position: result[0],
		};
	} catch (error) {
		console.error("Error creating position:", error);
		return {
			success: false,
			error: "Failed to create position",
		};
	}
}

export async function updatePositionAction(
	id: string,
	formData: Partial<PositionFormData>,
) {
	try {
		const result = await db
			.update(openPositions)
			.set({
				...formData,
				updatedAt: new Date(),
			})
			.where(eq(openPositions.id, id))
			.returning();

		return {
			success: true,
			position: result[0],
		};
	} catch (error) {
		console.error("Error updating position:", error);
		return {
			success: false,
			error: "Failed to update position",
		};
	}
}

export async function deletePositionAction(id: string) {
	try {
		await db.delete(openPositions).where(eq(openPositions.id, id));

		return {
			success: true,
		};
	} catch (error) {
		console.error("Error deleting position:", error);
		return {
			success: false,
			error: "Failed to delete position",
		};
	}
}

export async function getPositionsAction() {
	try {
		const positions = await db
			.select()
			.from(openPositions)
			.orderBy(desc(openPositions.createdAt));

		return {
			success: true,
			positions,
		};
	} catch (error) {
		console.error("Error fetching positions:", error);
		return {
			success: false,
			positions: [],
		};
	}
}

export async function getPositionByIdAction(id: string) {
	try {
		const result = await db
			.select()
			.from(openPositions)
			.where(eq(openPositions.id, id))
			.limit(1);

		if (result.length === 0) {
			return {
				success: false,
				error: "Position not found",
			};
		}

		return {
			success: true,
			position: result[0],
		};
	} catch (error) {
		console.error("Error fetching position:", error);
		return {
			success: false,
			error: "Failed to fetch position",
		};
	}
}
