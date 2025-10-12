"use client";

import {
	BookOpen,
	Mail,
	MessageSquare,
	Moon,
	Sparkles,
	Sun,
	FileStack,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const navigation: Array<{
	name: string;
	href: string;
	icon: typeof Sparkles;
	color: string;
	indent?: boolean;
}> = [
	{
		name: "Dashboard",
		href: "/",
		icon: Sparkles,
		color: "text-blue-600 dark:text-blue-400",
	},
	{
		name: "Bedtime Story Writer",
		href: "/bedtime-story",
		icon: BookOpen,
		color: "text-purple-600 dark:text-purple-400",
	},
	{
		name: "Story Library",
		href: "/story-library",
		icon: BookOpen,
		color: "text-pink-600 dark:text-pink-400",
		indent: true,
	},
	{
		name: "Email Helper",
		href: "/email-helper",
		icon: Mail,
		color: "text-green-600 dark:text-green-400",
	},
	{
		name: "RAG Chat",
		href: "/rag-chat",
		icon: MessageSquare,
		color: "text-purple-600 dark:text-purple-400",
	},
	{
		name: "Document Management",
		href: "/rag-documents",
		icon: FileStack,
		color: "text-blue-600 dark:text-blue-400",
		indent: true,
	},
];

export default function Sidebar() {
	const pathname = usePathname();
	const [theme, setTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		// Check system preference or localStorage
		const savedTheme = localStorage.getItem("theme");
		const isDark =
			savedTheme === "dark" ||
			(!savedTheme &&
				window.matchMedia("(prefers-color-scheme: dark)").matches);
		setTheme(isDark ? "dark" : "light");
		document.documentElement.classList.toggle("dark", isDark);
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);

		if (newTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	return (
		<aside className="w-64 h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors duration-200">
			{/* Logo */}
			<div className="p-6 border-b border-gray-200 dark:border-gray-800">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
						<Sparkles className="h-6 w-6 text-white" />
					</div>
					<div>
						<h2 className="text-lg font-bold text-gray-900 dark:text-white">
							AI Preza
						</h2>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							Demo Suite
						</p>
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 p-4 space-y-1">
				{navigation.map((item) => {
					const isActive = pathname === item.href;
					const Icon = item.icon;

					return (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								"flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
								item.indent && "ml-4",
								isActive
									? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
									: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
							)}
						>
							<Icon
								className={cn("h-5 w-5", isActive ? item.color : "opacity-70")}
							/>
							<span className="text-sm">{item.name}</span>
						</Link>
					);
				})}
			</nav>

			{/* Theme Toggle */}
			<div className="p-4 border-t border-gray-200 dark:border-gray-800">
				<button
					type="button"
					onClick={toggleTheme}
					className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				>
					{theme === "light" ? (
						<Moon className="h-5 w-5 opacity-70" />
					) : (
						<Sun className="h-5 w-5 opacity-70" />
					)}
					<span className="text-sm">
						{theme === "light" ? "Dark Mode" : "Light Mode"}
					</span>
				</button>
			</div>
		</aside>
	);
}
