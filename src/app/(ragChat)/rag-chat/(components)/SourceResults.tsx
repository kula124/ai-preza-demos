"use client";

import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Source {
	content: string;
	filename: string;
}

interface SourceResultsProps {
	sources: Source[];
}

export default function SourceResults({ sources }: SourceResultsProps) {
	const [expanded, setExpanded] = useState<number[]>([]);

	const toggleExpand = (index: number) => {
		setExpanded((prev) =>
			prev.includes(index)
				? prev.filter((i) => i !== index)
				: [...prev, index],
		);
	};

	if (sources.length === 0) return null;

	return (
		<div className="mt-4 space-y-2">
			<div className="text-sm font-medium text-gray-900 dark:text-slate-50 mb-2">
				Sources ({sources.length})
			</div>
			<div className="space-y-2">
				{sources.map((source, index) => (
					<div
						key={index}
						className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
					>
						<button
							type="button"
							onClick={() => toggleExpand(index)}
							className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
						>
							<div className="flex items-center space-x-2">
								<FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-slate-50">
									{source.filename}
								</span>
							</div>
							{expanded.includes(index) ? (
								<ChevronUp className="w-4 h-4 text-gray-500 dark:text-slate-500" />
							) : (
								<ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-500" />
							)}
						</button>
						{expanded.includes(index) && (
							<div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 max-h-96 overflow-y-auto">
								<p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
									{source.content}
								</p>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
