import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Sidebar from "./(common)/(components)/Sidebar";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		template: "%s | AI Preza Demos",
		default: "AI Preza Demos - AI-Powered Tools",
	},
	description:
		"Three AI-powered demo applications: Bedtime Story Writer, Email Helper, and RAG Chat",
	keywords: [
		"AI",
		"Claude",
		"LangChain",
		"Story Generator",
		"Email Assistant",
		"RAG",
		"Chat",
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-50`}
			>
				<div className="flex h-screen overflow-hidden">
					<Sidebar />
					<main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
						<div className="p-8">{children}</div>
					</main>
				</div>
				<Toaster richColors position="top-right" />
			</body>
		</html>
	);
}
