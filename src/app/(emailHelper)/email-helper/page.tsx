"use client";

import { useState } from "react";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import EmailForm from "./(components)/EmailForm";
import EmailDisplay from "./(components)/EmailDisplay";
import { generateEmailAction } from "./actions";
import type { EmailFormData, GeneratedEmail } from "./types";

type PageStep = "form" | "loading" | "email";

export default function EmailHelperPage() {
	const [currentStep, setCurrentStep] = useState<PageStep>("form");
	const [isGenerating, setIsGenerating] = useState(false);
	const [formData, setFormData] = useState<EmailFormData | null>(null);
	const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(
		null,
	);

	const handleGenerateEmail = async (data: EmailFormData) => {
		setIsGenerating(true);
		setFormData(data);
		setCurrentStep("loading");

		try {
			const result = await generateEmailAction(data);

			if (result.success && result.email) {
				setGeneratedEmail(result.email);
				setCurrentStep("email");
				toast.success("Email generated successfully!");
			} else {
				toast.error(result.error || "Failed to generate email");
				setCurrentStep("form");
			}
		} catch (error) {
			console.error("Error generating email:", error);
			toast.error("An unexpected error occurred");
			setCurrentStep("form");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleRewrite = () => {
		setCurrentStep("form");
		// Keep the form data so user can edit it
	};

	return (
		<div className="max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
						<Mail className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold">Email Helper</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Professional email writing assistant
						</p>
					</div>
				</div>

				<Link
					href="/email-library"
					className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center gap-2"
				>
					Library
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>

			{/* Content */}
			<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
				{currentStep === "form" && (
					<EmailForm
						onSubmit={handleGenerateEmail}
						isGenerating={isGenerating}
						initialData={formData || undefined}
					/>
				)}

				{currentStep === "loading" && (
					<div className="flex flex-col items-center justify-center py-20">
						<div className="relative mb-6">
							<Mail className="h-16 w-16 text-green-500 animate-pulse" />
							<Loader2 className="h-8 w-8 text-green-600 animate-spin absolute -bottom-2 -right-2" />
						</div>
						<h3 className="text-xl font-semibold mb-2">
							Crafting Your Professional Email...
						</h3>
						<p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
							Our AI is transforming your message into a polished, professional
							email
						</p>
					</div>
				)}

				{currentStep === "email" && generatedEmail && formData && (
					<EmailDisplay
						email={generatedEmail}
						formData={formData}
						onRewrite={handleRewrite}
					/>
				)}
			</div>
		</div>
	);
}
