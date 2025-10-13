import { User, Star, FileText } from "lucide-react";
import Link from "next/link";

interface Application {
	applicationId: number;
	candidateName: string;
	overallScore: number;
	relevantText?: string;
	similarity?: number;
}

interface ApplicationResultsProps {
	applications: Application[];
	searchQuery?: string;
}

export default function ApplicationResults({
	applications,
	searchQuery,
}: ApplicationResultsProps) {
	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600 dark:text-green-400";
		if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
		return "text-red-600 dark:text-red-400";
	};

	if (applications.length === 0) {
		return (
			<div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
				<p className="text-sm text-gray-600 dark:text-gray-400">
					No applications found
					{searchQuery && ` for "${searchQuery}"`}.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="text-sm text-gray-600 dark:text-gray-400">
				Found {applications.length} application
				{applications.length !== 1 ? "s" : ""}
				{searchQuery && ` matching "${searchQuery}"`}
			</div>

			<div className="space-y-2">
				{applications.map((app) => (
					<Link
						key={app.applicationId}
						href={`/jobs/applications/${app.applicationId}`}
						className="block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
					>
						<div className="flex items-start gap-3">
							<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
								<User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="font-semibold text-gray-900 dark:text-gray-100">
										{app.candidateName}
									</h4>
									<span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
										ID: {app.applicationId}
									</span>
								</div>

								<div className="flex items-center gap-3 mb-2">
									<div className="flex items-center gap-1">
										<Star className="h-4 w-4 text-yellow-500" />
										<span
											className={`text-sm font-medium ${getScoreColor(app.overallScore)}`}
										>
											{app.overallScore}/100
										</span>
									</div>

									{app.similarity !== undefined && (
										<div className="text-xs text-gray-500 dark:text-gray-500">
											Match: {(app.similarity * 100).toFixed(1)}%
										</div>
									)}
								</div>

								{app.relevantText && (
									<div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
										{app.relevantText}
									</div>
								)}
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
