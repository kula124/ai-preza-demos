import { Briefcase, MapPin, DollarSign, Users } from "lucide-react";
import Link from "next/link";

interface Position {
	id: string;
	title: string;
	department: string;
	location: string;
	employmentType: string;
	requiredSkills: string[];
	experienceLevel: string;
	salaryMin?: number;
	salaryMax?: number;
	status: string;
}

interface JobPositionResultsProps {
	positions: Position[];
	searchQuery?: string;
}

export default function JobPositionResults({
	positions,
	searchQuery,
}: JobPositionResultsProps) {
	if (positions.length === 0) {
		return (
			<div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
				<p className="text-sm text-gray-600 dark:text-gray-400">
					No open positions found
					{searchQuery && ` for "${searchQuery}"`}.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="text-sm text-gray-600 dark:text-gray-400">
				Found {positions.length} position{positions.length !== 1 ? "s" : ""}
				{searchQuery && ` matching "${searchQuery}"`}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{positions.map((position) => (
					<Link
						key={position.id}
						href={`/jobs/positions/${position.id}`}
						className="block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
					>
						<div className="flex items-start gap-3">
							<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
								<Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
										{position.title}
									</h4>
									<span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
										{position.id}
									</span>
								</div>

								<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
									{position.department}
								</p>

								<div className="flex flex-col gap-1.5 mb-3">
									<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
										<MapPin className="h-3 w-3" />
										{position.location} • {position.employmentType}
									</div>

									{(position.salaryMin || position.salaryMax) && (
										<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
											<DollarSign className="h-3 w-3" />
											{position.salaryMin &&
												`$${position.salaryMin.toLocaleString()}`}
											{position.salaryMin && position.salaryMax && " - "}
											{position.salaryMax &&
												`$${position.salaryMax.toLocaleString()}`}
										</div>
									)}

									<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
										<Users className="h-3 w-3" />
										{position.experienceLevel}
									</div>
								</div>

								<div className="flex flex-wrap gap-1.5">
									{position.requiredSkills.slice(0, 3).map((skill) => (
										<span
											key={skill}
											className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
										>
											{skill}
										</span>
									))}
									{position.requiredSkills.length > 3 && (
										<span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
											+{position.requiredSkills.length - 3} more
										</span>
									)}
								</div>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
