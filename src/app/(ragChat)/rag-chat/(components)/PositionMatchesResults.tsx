import { User, Star, Target, Calendar } from "lucide-react";
import Link from "next/link";

interface Match {
	applicationId: number;
	candidateName: string;
	overallScore: number;
	matchingScore: number;
	matchReasoning?: string;
	dateReviewed: Date;
}

interface PositionMatchesResultsProps {
	matches: Match[];
	positionId: string;
}

export default function PositionMatchesResults({
	matches,
	positionId,
}: PositionMatchesResultsProps) {
	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600 dark:text-green-400";
		if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
		return "text-red-600 dark:text-red-400";
	};

	const getMatchColor = (score: number) => {
		if (score >= 80)
			return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
		if (score >= 60)
			return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
		return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
	};

	if (matches.length === 0) {
		return (
			<div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
				<p className="text-sm text-gray-600 dark:text-gray-400">
					No candidate matches found for position {positionId}.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="text-sm text-gray-600 dark:text-gray-400">
				Found {matches.length} candidate{matches.length !== 1 ? "s" : ""} for
				position {positionId}
			</div>

			<div className="space-y-2">
				{matches.map((match) => (
					<Link
						key={match.applicationId}
						href={`/jobs/applications/${match.applicationId}`}
						className="block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
					>
						<div className="flex items-start gap-3">
							<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
								<User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-2">
									<h4 className="font-semibold text-gray-900 dark:text-gray-100">
										{match.candidateName}
									</h4>
									<span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
										ID: {match.applicationId}
									</span>
								</div>

								<div className="flex flex-wrap items-center gap-3 mb-3">
									<div className="flex items-center gap-1.5">
										<Star className="h-4 w-4 text-yellow-500" />
										<span
											className={`text-sm font-medium ${getScoreColor(match.overallScore)}`}
										>
											Score: {match.overallScore}/100
										</span>
									</div>

									<div className="flex items-center gap-1.5">
										<Target className="h-4 w-4 text-purple-500" />
										<span
											className={`text-sm font-semibold px-2 py-0.5 rounded ${getMatchColor(match.matchingScore)}`}
										>
											Match: {match.matchingScore}%
										</span>
									</div>

									<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
										<Calendar className="h-3 w-3" />
										{new Date(match.dateReviewed).toLocaleDateString()}
									</div>
								</div>

								{match.matchReasoning && (
									<div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
										<span className="font-medium text-gray-900 dark:text-gray-100">
											Why this match:{" "}
										</span>
										{match.matchReasoning}
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
