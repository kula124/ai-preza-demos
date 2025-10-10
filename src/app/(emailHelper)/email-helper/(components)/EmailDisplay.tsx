"use client";

import { useState } from "react";
import { Copy, Check, Save, RotateCcw, Mail } from "lucide-react";
import { toast } from "sonner";
import { saveEmailAction } from "../actions";
import type { EmailFormData, GeneratedEmail } from "../types";

interface EmailDisplayProps {
	email: GeneratedEmail;
	formData: EmailFormData;
	onRewrite: () => void;
}

export default function EmailDisplay({
	email,
	formData,
	onRewrite,
}: EmailDisplayProps) {
	const [copiedSubject, setCopiedSubject] = useState(false);
	const [copiedBody, setCopiedBody] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const handleCopySubject = async () => {
		await navigator.clipboard.writeText(email.subject);
		setCopiedSubject(true);
		toast.success("Subject copied to clipboard!");
		setTimeout(() => setCopiedSubject(false), 2000);
	};

	const handleCopyBody = async () => {
		await navigator.clipboard.writeText(email.body);
		setCopiedBody(true);
		toast.success("Email body copied to clipboard!");
		setTimeout(() => setCopiedBody(false), 2000);
	};

	const handleCopyAll = async () => {
		const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;
		await navigator.clipboard.writeText(fullEmail);
		toast.success("Full email copied to clipboard!");
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const result = await saveEmailAction(formData, email);
			if (result.success) {
				setIsSaved(true);
				toast.success("Email saved successfully!");
			} else {
				toast.error(result.error || "Failed to save email");
			}
		} catch (error) {
			toast.error("Failed to save email");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header with Actions */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
						<Mail className="h-6 w-6 text-white" />
					</div>
					<div>
						<h2 className="text-2xl font-bold">Your Professional Email</h2>
						<p className="text-gray-600 dark:text-gray-400 text-sm">
							{formData.emailType} • {formData.tone} tone
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onRewrite}
					className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
				>
					<RotateCcw className="h-4 w-4" />
					Edit & Rewrite
				</button>
			</div>

			{/* Email Content */}
			<div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-2xl p-8 border border-green-200 dark:border-green-800">
				{/* Subject Line */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-2">
						<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
							Subject:
						</label>
						<button
							type="button"
							onClick={handleCopySubject}
							className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
							title="Copy subject"
						>
							{copiedSubject ? (
								<Check className="h-4 w-4 text-green-600" />
							) : (
								<Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
							)}
						</button>
					</div>
					<div className="text-lg font-semibold bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
						{email.subject}
					</div>
				</div>

				{/* Email Body */}
				<div>
					<div className="flex items-center justify-between mb-2">
						<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
							Body:
						</label>
						<button
							type="button"
							onClick={handleCopyBody}
							className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
							title="Copy body"
						>
							{copiedBody ? (
								<Check className="h-4 w-4 text-green-600" />
							) : (
								<Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
							)}
						</button>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg whitespace-pre-wrap leading-relaxed">
						{email.body}
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-4">
				<button
					type="button"
					onClick={handleCopyAll}
					className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
				>
					<Copy className="h-5 w-5" />
					Copy Full Email
				</button>

				{!isSaved && (
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="flex-1 py-3 bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600 dark:text-green-400 rounded-xl font-semibold hover:bg-green-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
					>
						{isSaving ? (
							<>
								<div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="h-5 w-5" />
								Save to Library
							</>
						)}
					</button>
				)}

				{isSaved && (
					<div className="flex-1 py-3 bg-green-100 dark:bg-green-900 border-2 border-green-500 text-green-700 dark:text-green-300 rounded-xl font-semibold flex items-center justify-center gap-2">
						<Check className="h-5 w-5" />
						Saved to Library
					</div>
				)}
			</div>

			{/* Metadata */}
			<div className="flex flex-wrap gap-2">
				<span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm">
					{formData.emailType}
				</span>
				<span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
					{formData.tone}
				</span>
				{formData.recipientName && (
					<span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
						To: {formData.recipientName}
					</span>
				)}
			</div>
		</div>
	);
}
