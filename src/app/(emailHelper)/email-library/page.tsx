"use client";

import { useEffect, useState } from "react";
import { Mail, Trash2, X, Calendar, Tag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getEmailsAction, deleteEmailAction } from "../email-helper/actions";
import type { SavedEmail } from "../email-helper/types";

export default function EmailLibraryPage() {
	const [emails, setEmails] = useState<SavedEmail[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedEmail, setSelectedEmail] = useState<SavedEmail | null>(null);

	useEffect(() => {
		loadEmails();
	}, []);

	const loadEmails = async () => {
		setIsLoading(true);
		try {
			const result = await getEmailsAction();
			if (result.success) {
				setEmails(result.emails);
			}
		} catch (error) {
			console.error("Error loading emails:", error);
			toast.error("Failed to load emails");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (emailId: number) => {
		if (!confirm("Are you sure you want to delete this email?")) {
			return;
		}

		try {
			const result = await deleteEmailAction(emailId);
			if (result.success) {
				setEmails(emails.filter((email) => email.id !== emailId));
				setSelectedEmail(null);
				toast.success("Email deleted successfully");
			} else {
				toast.error(result.error || "Failed to delete email");
			}
		} catch (error) {
			console.error("Error deleting email:", error);
			toast.error("Failed to delete email");
		}
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="max-w-6xl mx-auto">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
						<Mail className="h-6 w-6 text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold">Email Library</h1>
						<p className="text-gray-600 dark:text-gray-400">
							{emails.length} saved email{emails.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>

				<Link
					href="/email-helper"
					className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Create New
				</Link>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
				</div>
			) : emails.length === 0 ? (
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
					<Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-xl font-semibold mb-2">No Saved Emails Yet</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						Start by creating your first professional email
					</p>
					<Link
						href="/email-helper"
						className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
					>
						Create Email
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{emails.map((email) => (
						<div
							key={email.id}
							className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer group"
							onClick={() => setSelectedEmail(email)}
						>
							{/* Header */}
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
										{email.generatedSubject}
									</h3>
									<div className="flex items-center gap-2 text-xs text-gray-500">
										<Calendar className="h-3 w-3" />
										{formatDate(email.createdAt)}
									</div>
								</div>
							</div>

							{/* Tags */}
							<div className="flex flex-wrap gap-2 mb-3">
								<span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
									{email.emailType}
								</span>
								<span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-xs">
									{email.tone}
								</span>
							</div>

							{/* Preview */}
							<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
								{email.generatedBody}
							</p>

							{/* Delete Button */}
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete(email.id);
								}}
								className="mt-4 w-full py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
							>
								<Trash2 className="h-4 w-4" />
								Delete
							</button>
						</div>
					))}
				</div>
			)}

			{/* Modal for viewing full email */}
			{selectedEmail && (
				<div
					className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
					onClick={() => setSelectedEmail(null)}
				>
					<div
						className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Modal Header */}
						<div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
									<Mail className="h-5 w-5 text-white" />
								</div>
								<div>
									<h2 className="text-xl font-bold">Saved Email</h2>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{formatDate(selectedEmail.createdAt)}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setSelectedEmail(null)}
								className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						{/* Modal Content */}
						<div className="p-6 space-y-6">
							{/* Tags */}
							<div className="flex flex-wrap gap-2">
								<span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm flex items-center gap-1">
									<Tag className="h-3 w-3" />
									{selectedEmail.emailType}
								</span>
								<span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm flex items-center gap-1">
									<Tag className="h-3 w-3" />
									{selectedEmail.tone}
								</span>
							</div>

							{/* Subject */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
									Subject:
								</label>
								<div className="text-lg font-semibold bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
									{selectedEmail.generatedSubject}
								</div>
							</div>

							{/* Body */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
									Body:
								</label>
								<div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg whitespace-pre-wrap leading-relaxed">
									{selectedEmail.generatedBody}
								</div>
							</div>

							{/* Original Input */}
							{selectedEmail.keyPoints.length > 0 && (
								<div>
									<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
										Original Input:
									</label>
									<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-400">
										{selectedEmail.keyPoints[0]}
									</div>
								</div>
							)}

							{/* Context */}
							{selectedEmail.context && (
								<div>
									<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
										Context:
									</label>
									<div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-400">
										{selectedEmail.context}
									</div>
								</div>
							)}

							{/* Actions */}
							<div className="flex gap-3 pt-4">
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText(
											`Subject: ${selectedEmail.generatedSubject}\n\n${selectedEmail.generatedBody}`,
										);
										toast.success("Email copied to clipboard!");
									}}
									className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
								>
									Copy Email
								</button>
								<button
									type="button"
									onClick={() => {
										handleDelete(selectedEmail.id);
									}}
									className="px-6 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-xl font-semibold hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
