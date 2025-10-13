"use server";

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { emails } from "@/repo/schema";
import { desc, eq } from "drizzle-orm";
import type { EmailFormData, GeneratedEmail } from "./types";

// Check API key
const apiKey = process.env.ANTHROPIC_API_KEY;
console.log("=== API Key Check ===");
console.log("API Key exists:", !!apiKey);
console.log("API Key length:", apiKey?.length);
console.log("API Key prefix:", apiKey?.substring(0, 10));

const anthropic = new Anthropic({
	apiKey: apiKey,
});

function buildEmailPrompt(formData: EmailFormData): string {
	const { emailType, tone, rawText, recipientName, context } = formData;

	let prompt = `You are a professional email writing assistant. Your task is to transform the user's raw text into a well-formatted, professional email.

Email Type: ${emailType}
Tone: ${tone}
${recipientName ? `Recipient Name: ${recipientName}` : ""}
${context ? `Additional Context: ${context}` : ""}

Raw Message from User:
${rawText}

Instructions:
1. Create a compelling subject line (max 60 characters)
2. Write a professional email body with proper greeting, content, and closing
3. Match the requested tone (${tone}) and type (${emailType})
4. Use proper email formatting with paragraphs
5. ${recipientName ? `Address the email to ${recipientName}` : "Use an appropriate generic greeting"}
6. Keep it concise but complete
7. End with an appropriate sign-off

Return ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "subject": "Your subject line here",
  "body": "Your email body here with \\n for line breaks"
}`;

	return prompt;
}

export async function generateEmailAction(formData: EmailFormData): Promise<{
	success: boolean;
	email?: GeneratedEmail;
	error?: string;
}> {
	try {
		console.log("=== Generate Email Action ===");
		console.log("Form data:", JSON.stringify(formData, null, 2));

		// Validate input
		if (!formData.rawText.trim()) {
			return {
				success: false,
				error: "Please provide your message content",
			};
		}

		// Build prompt
		const prompt = buildEmailPrompt(formData);
		console.log("Prompt length:", prompt.length);

		// Call Claude API (using Haiku for faster, cheaper email generation)
		console.log("Calling Claude API with model: claude-3-5-haiku-20250110");
		const message = await anthropic.messages.create({
			model: "claude-3-5-haiku-20250110",
			max_tokens: 1500,
			messages: [{ role: "user", content: prompt }],
		});
		console.log("Claude API response received");

		// Extract response
		const response =
			message.content[0].type === "text" ? message.content[0].text : "";

		// Parse JSON response
		const generatedEmail: GeneratedEmail = JSON.parse(response);

		return {
			success: true,
			email: generatedEmail,
		};
	} catch (error) {
		console.error("Error generating email:", error);
		return {
			success: false,
			error: "Failed to generate email. Please try again.",
		};
	}
}

export async function saveEmailAction(
	formData: EmailFormData,
	generatedEmail: GeneratedEmail,
): Promise<{ success: boolean; emailId?: number; error?: string }> {
	try {
		const result = await db
			.insert(emails)
			.values({
				emailType: formData.emailType,
				tone: formData.tone,
				keyPoints: [formData.rawText], // Store raw text in keyPoints array
				context: formData.context || null,
				generatedSubject: generatedEmail.subject,
				generatedBody: generatedEmail.body,
			})
			.returning({ id: emails.id });

		return {
			success: true,
			emailId: result[0].id,
		};
	} catch (error) {
		console.error("Error saving email:", error);
		return {
			success: false,
			error: "Failed to save email",
		};
	}
}

export async function getEmailsAction() {
	try {
		const allEmails = await db
			.select()
			.from(emails)
			.orderBy(desc(emails.createdAt));

		return {
			success: true,
			emails: allEmails,
		};
	} catch (error) {
		console.error("Error fetching emails:", error);
		return {
			success: false,
			emails: [],
		};
	}
}

export async function deleteEmailAction(emailId: number) {
	try {
		await db.delete(emails).where(eq(emails.id, emailId));

		return {
			success: true,
		};
	} catch (error) {
		console.error("Error deleting email:", error);
		return {
			success: false,
			error: "Failed to delete email",
		};
	}
}
