import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageMarkdownProps {
	content: string;
}

const MessageMarkdown = memo(({ content }: MessageMarkdownProps) => {
	const processedMarkdown = useMemo(() => {
		if (!content.trim()) return null;

		return (
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					h1: ({ children, ...props }) => (
						<h1
							className="mb-4 text-2xl font-bold text-gray-900 dark:text-slate-50"
							{...props}
						>
							{children}
						</h1>
					),
					h2: ({ children, ...props }) => (
						<h2
							className="mb-3 text-xl font-bold text-gray-900 dark:text-slate-50"
							{...props}
						>
							{children}
						</h2>
					),
					h3: ({ children, ...props }) => (
						<h3
							className="mb-2 text-lg font-bold text-gray-900 dark:text-slate-50"
							{...props}
						>
							{children}
						</h3>
					),
					h4: ({ children, ...props }) => (
						<h4
							className="mb-2 text-base font-bold text-gray-900 dark:text-slate-50"
							{...props}
						>
							{children}
						</h4>
					),
					p: ({ children, ...props }) => (
						<p className="mb-4 leading-relaxed text-gray-900 dark:text-slate-50" {...props}>
							{children}
						</p>
					),
					ul: ({ children, ...props }) => (
						<ul className="ml-6 list-disc mb-4 space-y-1 text-gray-900 dark:text-slate-50" {...props}>
							{children}
						</ul>
					),
					ol: ({ children, ...props }) => (
						<ol className="ml-6 mb-4 space-y-1 list-decimal text-gray-900 dark:text-slate-50" {...props}>
							{children}
						</ol>
					),
					li: ({ children, ...props}) => (
						<li className="leading-relaxed text-gray-900 dark:text-slate-50" {...props}>
							{children}
						</li>
					),
					strong: ({ children, ...props }) => (
						<strong className="font-bold" {...props}>
							{children}
						</strong>
					),
					em: ({ children, ...props }) => (
						<em className="italic" {...props}>
							{children}
						</em>
					),
					code: ({ children, className, ...props }) => {
						const isBlockCode = className?.includes("language-");
						return isBlockCode ? (
							<pre className="overflow-x-auto bg-gray-300 dark:bg-slate-700 rounded-md p-3 my-2">
								<code
									className={`font-mono text-sm whitespace-pre-wrap text-gray-900 dark:text-slate-50 ${className || ""}`}
									{...props}
								>
									{children}
								</code>
							</pre>
						) : (
							<code
								className="rounded-md bg-gray-300 dark:bg-slate-700 font-mono text-sm px-1 py-0.5 inline text-gray-900 dark:text-slate-50"
								{...props}
							>
								{children}
							</code>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		);
	}, [content]);

	return (
		<div className="w-full max-w-full break-words first:*:!mt-0">
			{processedMarkdown}
		</div>
	);
});

MessageMarkdown.displayName = "MessageMarkdown";

export default MessageMarkdown;
