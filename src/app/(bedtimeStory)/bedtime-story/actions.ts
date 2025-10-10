"use server";

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { stories } from "@/repo/schema";
import type { StoryFormData } from "./types";

if (!process.env.ANTHROPIC_API_KEY) {
	throw new Error("ANTHROPIC_API_KEY is not set");
}

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateStoryAction(formData: StoryFormData) {
	try {
		// Validate form data
		if (
			!formData.age ||
			!formData.gender ||
			formData.interests.length === 0 ||
			!formData.style ||
			!formData.lesson
		) {
			return {
				success: false,
				error: "Please fill in all fields before generating a story.",
			};
		}

		// Create the prompt
		const prompt = `Create a bedtime story for a ${formData.age}-year-old ${formData.gender} who loves ${formData.interests.join(", ")}.

The story should be:
- Written in a ${formData.style} style
- Teach the lesson: ${formData.lesson}
- Appropriate for bedtime (calming ending)
- Engaging but not overstimulating
- Around 300-500 words long
- Include a gentle moral lesson naturally woven into the narrative
- Have a proper story structure with beginning, middle, and end
- Use age-appropriate language and concepts

Please write only the story content, no title or additional formatting. Start directly with "Once upon a time..." or a similar opening.`;

		// Generate story using Claude
		const message = await anthropic.messages.create({
			model: "claude-3-5-sonnet-20241022",
			max_tokens: 1500,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
		});

		const storyContent =
			message.content[0].type === "text" ? message.content[0].text : "";

		if (!storyContent) {
			return {
				success: false,
				error: "Failed to generate story. Please try again.",
			};
		}

		return {
			success: true,
			story: storyContent,
		};
	} catch (error) {
		console.error("Error generating story:", error);
		return {
			success: false,
			error: "An error occurred while generating the story. Please try again.",
		};
	}
}

export async function saveStoryAction(formData: StoryFormData, story: string) {
	try {
		const [savedStory] = await db
			.insert(stories)
			.values({
				topic: formData.interests.join(", "),
				childAge: Number.parseInt(formData.age),
				emphasis: [formData.style, formData.lesson],
				additionalInstructions: `Gender: ${formData.gender}`,
				generatedStory: story,
			})
			.returning();

		return {
			success: true,
			storyId: savedStory.id,
		};
	} catch (error) {
		console.error("Error saving story:", error);
		return {
			success: false,
			error: "Failed to save story. Please try again.",
		};
	}
}

export async function getStoriesAction() {
	try {
		const { desc } = await import("drizzle-orm");
		const allStories = await db
			.select()
			.from(stories)
			.orderBy(desc(stories.createdAt));

		return {
			success: true,
			stories: allStories,
		};
	} catch (error) {
		console.error("Error fetching stories:", error);
		return {
			success: false,
			error: "Failed to fetch stories.",
			stories: [],
		};
	}
}

export async function deleteStoryAction(storyId: number) {
	try {
		const { eq } = await import("drizzle-orm");
		await db.delete(stories).where(eq(stories.id, storyId));

		return {
			success: true,
		};
	} catch (error) {
		console.error("Error deleting story:", error);
		return {
			success: false,
			error: "Failed to delete story.",
		};
	}
}
