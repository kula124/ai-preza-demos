import { CheckCircle2, Briefcase, User } from "lucide-react";
import Link from "next/link";

interface Confirmation {
	positionId: string;
	positionTitle: string;
	applicationId: number;
	candidateName: string;
	message: string;
}

interface JobActionConfirmationProps {
	confirmation: Confirmation;
}

export default function JobActionConfirmation({
	confirmation,
}: JobActionConfirmationProps) {
	return (
		<div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
			<div className="flex items-start gap-3">
				<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
					<CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
				</div>

				<div className="flex-1">
					<h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
						Position Filled Successfully
					</h4>

					<p className="text-sm text-green-800 dark:text-green-200 mb-4">
						{confirmation.message}
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<Link
							href={`/jobs/positions/${confirmation.positionId}`}
							className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-lg hover:border-green-300 dark:hover:border-green-700 transition-colors"
						>
							<Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
							<div className="flex-1 min-w-0">
								<div className="text-xs text-gray-500 dark:text-gray-500">
									Position
								</div>
								<div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
									{confirmation.positionTitle}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-500">
									{confirmation.positionId}
								</div>
							</div>
						</Link>

						<Link
							href={`/jobs/applications/${confirmation.applicationId}`}
							className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-lg hover:border-green-300 dark:hover:border-green-700 transition-colors"
						>
							<User className="h-4 w-4 text-green-600 dark:text-green-400" />
							<div className="flex-1 min-w-0">
								<div className="text-xs text-gray-500 dark:text-gray-500">
									Selected Candidate
								</div>
								<div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
									{confirmation.candidateName}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-500">
									App ID: {confirmation.applicationId}
								</div>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
