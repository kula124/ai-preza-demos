import { BookOpen, Mail, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";

const apps = [
	{
		title: "Bedtime Story Writer",
		description:
			"Create personalized bedtime stories for children with AI. Choose topics, age-appropriate content, and character emphasis to generate engaging stories.",
		href: "/bedtime-story",
		icon: BookOpen,
		gradient: "from-purple-500 to-pink-500",
		bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
		features: [
			"Multi-step story creation",
			"Age-appropriate content",
			"Character trait emphasis",
			"Story library",
		],
	},
	{
		title: "Email Helper",
		description:
			"Craft professional emails with AI assistance. Select tone, style, and key points to generate perfectly formatted emails for any occasion.",
		href: "/email-helper",
		icon: Mail,
		gradient: "from-green-500 to-emerald-500",
		bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
		features: [
			"Multiple email types",
			"Tone customization",
			"Subject generation",
			"Email templates",
		],
	},
	{
		title: "RAG Chat",
		description:
			"Upload documents and ask questions using Retrieval-Augmented Generation. Get accurate answers with source citations from your documents.",
		href: "/rag-chat",
		icon: MessageSquare,
		gradient: "from-orange-500 to-red-500",
		bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
		features: [
			"PDF & text upload",
			"Vector search",
			"Source citations",
			"Chat history",
		],
	},
];

export default function HomePage() {
	return (
		<div className="max-w-7xl mx-auto">
			{/* Header */}
			<div className="mb-12">
				<div className="flex items-center gap-3 mb-4">
					<div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
						<Sparkles className="h-8 w-8 text-white" />
					</div>
					<div>
						<h1 className="text-4xl font-bold">AI Preza Demos</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Powered by Claude & LangChain
						</p>
					</div>
				</div>
				<p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl">
					Explore three powerful AI-powered applications designed to showcase
					the capabilities of modern language models. From creative storytelling
					to professional communication and intelligent document analysis.
				</p>
			</div>

			{/* App Cards */}
			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{apps.map((app) => {
					const Icon = app.icon;

					return (
						<Link
							key={app.title}
							href={app.href}
							className={`group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br ${app.bgGradient} p-6 transition-all hover:shadow-xl hover:scale-105`}
						>
							{/* Icon */}
							<div
								className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${app.gradient} mb-4 shadow-lg`}
							>
								<Icon className="h-6 w-6 text-white" />
							</div>

							{/* Content */}
							<h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
								{app.title}
							</h2>
							<p className="text-gray-600 dark:text-gray-300 mb-4">
								{app.description}
							</p>

							{/* Features */}
							<ul className="space-y-1.5 mb-4">
								{app.features.map((feature) => (
									<li
										key={feature}
										className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
									>
										<span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />
										{feature}
									</li>
								))}
							</ul>

							{/* CTA */}
							<div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-3 transition-all">
								Launch App
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</div>
						</Link>
					);
				})}
			</div>

			{/* Info Section */}
			<div className="mt-12 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
				<h3 className="text-xl font-bold mb-2">About These Demos</h3>
				<p className="text-gray-600 dark:text-gray-400 mb-4">
					These applications demonstrate various AI capabilities using
					Anthropic's Claude via LangChain. Each app showcases different use
					cases and interaction patterns with large language models.
				</p>
				<div className="flex flex-wrap gap-3">
					<span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
						Next.js 15
					</span>
					<span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
						Anthropic Claude
					</span>
					<span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
						LangChain
					</span>
					<span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium">
						PostgreSQL + pgvector
					</span>
				</div>
			</div>
		</div>
	);
}
