"use client";

import { useState } from "react";
import type { EmailFormData, EmailTone, EmailType } from "../types";
import {
	Mail,
	Sparkles,
	User,
	MessageSquare,
	FileText,
} from "lucide-react";

interface EmailFormProps {
	onSubmit: (formData: EmailFormData) => void;
	isGenerating: boolean;
	initialData?: EmailFormData;
}

const EMAIL_TYPES: { value: EmailType; label: string; icon: string }[] = [
	{ value: "professional", label: "Professional", icon: "💼" },
	{ value: "casual", label: "Casual", icon: "😊" },
	{ value: "marketing", label: "Marketing", icon: "📢" },
	{ value: "sales", label: "Sales", icon: "💰" },
	{ value: "support", label: "Support", icon: "🤝" },
];

const EMAIL_TONES: { value: EmailTone; label: string }[] = [
	{ value: "formal", label: "Formal" },
	{ value: "friendly", label: "Friendly" },
	{ value: "persuasive", label: "Persuasive" },
	{ value: "apologetic", label: "Apologetic" },
	{ value: "enthusiastic", label: "Enthusiastic" },
	{ value: "neutral", label: "Neutral" },
];

export default function EmailForm({
	onSubmit,
	isGenerating,
	initialData,
}: EmailFormProps) {
	const [formData, setFormData] = useState<EmailFormData>(
		initialData || {
			emailType: "professional",
			tone: "formal",
			rawText: "",
			recipientName: "",
			context: "",
		},
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!formData.rawText.trim()) {
			alert("Please enter your email content");
			return;
		}

		onSubmit(formData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Email Type Selection */}
			<div>
				<label className="block text-sm font-medium mb-3 flex items-center gap-2">
					<Mail className="h-4 w-4" />
					Email Type
				</label>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
					{EMAIL_TYPES.map((type) => (
						<button
							key={type.value}
							type="button"
							onClick={() =>
								setFormData({ ...formData, emailType: type.value })
							}
							className={`p-4 rounded-xl border-2 transition-all ${
								formData.emailType === type.value
									? "border-green-500 bg-green-50 dark:bg-green-950"
									: "border-gray-200 dark:border-gray-700 hover:border-green-300"
							}`}
						>
							<div className="text-2xl mb-1">{type.icon}</div>
							<div className="text-sm font-medium">{type.label}</div>
						</button>
					))}
				</div>
			</div>

			{/* Tone Selection */}
			<div>
				<label className="block text-sm font-medium mb-3 flex items-center gap-2">
					<Sparkles className="h-4 w-4" />
					Tone
				</label>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{EMAIL_TONES.map((tone) => (
						<button
							key={tone.value}
							type="button"
							onClick={() => setFormData({ ...formData, tone: tone.value })}
							className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
								formData.tone === tone.value
									? "border-green-500 bg-green-50 dark:bg-green-950"
									: "border-gray-200 dark:border-gray-700 hover:border-green-300"
							}`}
						>
							{tone.label}
						</button>
					))}
				</div>
			</div>

			{/* Recipient Name (Optional) */}
			<div>
				<label className="block text-sm font-medium mb-2 flex items-center gap-2">
					<User className="h-4 w-4" />
					Recipient Name <span className="text-gray-400">(optional)</span>
				</label>
				<input
					type="text"
					value={formData.recipientName}
					onChange={(e) =>
						setFormData({ ...formData, recipientName: e.target.value })
					}
					placeholder="e.g., John Smith"
					className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent"
				/>
			</div>

			{/* Raw Text Input */}
			<div>
				<label className="block text-sm font-medium mb-2 flex items-center gap-2">
					<FileText className="h-4 w-4" />
					Your Message <span className="text-red-500">*</span>
				</label>
				<textarea
					value={formData.rawText}
					onChange={(e) =>
						setFormData({ ...formData, rawText: e.target.value })
					}
					placeholder="Just write what you want to say... we'll make it professional!"
					rows={8}
					className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
				/>
				<p className="text-xs text-gray-500 mt-1">
					Don't worry about grammar or formatting - just write naturally!
				</p>
			</div>

			{/* Additional Context (Optional) */}
			<div>
				<label className="block text-sm font-medium mb-2 flex items-center gap-2">
					<MessageSquare className="h-4 w-4" />
					Additional Context <span className="text-gray-400">(optional)</span>
				</label>
				<textarea
					value={formData.context}
					onChange={(e) => setFormData({ ...formData, context: e.target.value })}
					placeholder="e.g., This is a follow-up email, we met at a conference, urgent request, etc."
					rows={3}
					className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
				/>
			</div>

			{/* Submit Button */}
			<button
				type="submit"
				disabled={isGenerating}
				className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
			>
				{isGenerating ? (
					<>
						<div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
						Generating Email...
					</>
				) : (
					<>
						<Sparkles className="h-5 w-5" />
						Generate Professional Email
					</>
				)}
			</button>
		</form>
	);
}
