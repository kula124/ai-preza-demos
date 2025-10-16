#!/usr/bin/env tsx
/**
 * Script to seed the database with sample job positions
 */

// Load environment variables FIRST, before any other imports
import { config } from "dotenv";
config({ path: ".env" });

import { getDb } from "../src/lib/db";
import { openPositions, reviewedApplications, applicationPositionMatches } from "../src/repo/schema";
import { sql } from "drizzle-orm";

const samplePositions = [
	{
		id: "JOB001",
		title: "React Developer",
		department: "Engineering",
		requiredSkills: ["React", "JavaScript", "Redux", "CSS", "Git"],
		experienceLevel: "Mid-level",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 80000,
		salaryMax: 110000,
		status: "open",
		description: "We're seeking a talented React Developer to build responsive web applications. You'll work with modern React patterns, hooks, and state management.",
	},
	{
		id: "JOB002",
		title: "Full Stack Developer",
		department: "Engineering",
		requiredSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "Docker"],
		experienceLevel: "Senior",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 100000,
		salaryMax: 150000,
		status: "open",
		description: "Join our team as a Full Stack Developer to build end-to-end features. You'll work across the entire stack from database to UI, using modern technologies.",
	},
	{
		id: "JOB003",
		title: "Senior Frontend Developer",
		department: "Engineering",
		requiredSkills: ["React", "TypeScript", "Next.js", "TailwindCSS", "REST APIs"],
		experienceLevel: "Senior",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 90000,
		salaryMax: 130000,
		status: "open",
		description: "We're looking for a Senior Frontend Developer to lead our web development initiatives. You'll work with React, Next.js, and TypeScript to build scalable applications.",
	},
	{
		id: "JOB004",
		title: "Backend Engineer (Python)",
		department: "Engineering",
		requiredSkills: ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
		experienceLevel: "Mid-level",
		location: "San Francisco, CA",
		employmentType: "Full-time",
		salaryMin: 100000,
		salaryMax: 140000,
		status: "open",
		description: "Join our backend team to build robust APIs and microservices. Experience with Python, Django, and cloud infrastructure required.",
	},
	{
		id: "JOB005",
		title: "DevOps Engineer",
		department: "Engineering",
		requiredSkills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Docker", "Linux"],
		experienceLevel: "Senior",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 110000,
		salaryMax: 150000,
		status: "open",
		description: "We need an experienced DevOps Engineer to manage our cloud infrastructure and deployment pipelines.",
	},
	{
		id: "JOB006",
		title: "Product Designer",
		department: "Design",
		requiredSkills: ["Figma", "UI/UX Design", "Prototyping", "User Research", "Design Systems"],
		experienceLevel: "Mid-level",
		location: "New York, NY",
		employmentType: "Full-time",
		salaryMin: 85000,
		salaryMax: 120000,
		status: "open",
		description: "Create beautiful and intuitive user experiences. You'll work closely with product and engineering teams to design features that delight users.",
	},
	{
		id: "JOB007",
		title: "Senior UX Designer",
		department: "Design",
		requiredSkills: ["User Research", "Wireframing", "Prototyping", "Figma", "Adobe XD", "Usability Testing"],
		experienceLevel: "Senior",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 95000,
		salaryMax: 135000,
		status: "open",
		description: "Lead UX initiatives and conduct user research to inform product decisions. Experience with design thinking and user testing required.",
	},
	{
		id: "JOB008",
		title: "Content Marketing Manager",
		department: "Marketing",
		requiredSkills: ["Content Strategy", "SEO", "Copywriting", "Analytics", "Marketing Automation"],
		experienceLevel: "Mid-level",
		location: "Austin, TX",
		employmentType: "Full-time",
		salaryMin: 70000,
		salaryMax: 95000,
		status: "open",
		description: "Develop and execute content marketing strategies to drive engagement and conversions. Strong writing and SEO skills required.",
	},
	{
		id: "JOB009",
		title: "Digital Marketing Specialist",
		department: "Marketing",
		requiredSkills: ["Google Ads", "Facebook Ads", "SEO", "Google Analytics", "A/B Testing"],
		experienceLevel: "Junior",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 55000,
		salaryMax: 75000,
		status: "open",
		description: "Manage paid advertising campaigns across multiple platforms. Experience with Google Ads and social media advertising preferred.",
	},
	{
		id: "JOB010",
		title: "Growth Marketing Manager",
		department: "Marketing",
		requiredSkills: ["Growth Hacking", "Analytics", "Conversion Optimization", "Product Marketing", "Data Analysis"],
		experienceLevel: "Senior",
		location: "San Francisco, CA",
		employmentType: "Full-time",
		salaryMin: 95000,
		salaryMax: 130000,
		status: "open",
		description: "Drive user acquisition and retention through data-driven growth strategies. Strong analytical and experimentation skills required.",
	},
	{
		id: "JOB011",
		title: "Data Scientist",
		department: "Data",
		requiredSkills: ["Python", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Pandas"],
		experienceLevel: "Mid-level",
		location: "Seattle, WA",
		employmentType: "Full-time",
		salaryMin: 105000,
		salaryMax: 145000,
		status: "open",
		description: "Build predictive models and extract insights from large datasets. Strong background in statistics and machine learning required.",
	},
	{
		id: "JOB012",
		title: "Data Engineer",
		department: "Data",
		requiredSkills: ["Python", "SQL", "ETL", "Airflow", "Spark", "Data Warehousing"],
		experienceLevel: "Mid-level",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 100000,
		salaryMax: 135000,
		status: "open",
		description: "Design and maintain data pipelines and infrastructure. Experience with ETL processes and data warehousing required.",
	},
	{
		id: "JOB013",
		title: "Product Manager",
		department: "Product",
		requiredSkills: ["Product Strategy", "Agile", "User Stories", "Roadmapping", "Analytics"],
		experienceLevel: "Senior",
		location: "New York, NY",
		employmentType: "Full-time",
		salaryMin: 110000,
		salaryMax: 155000,
		status: "open",
		description: "Define product vision and strategy. Work cross-functionally to deliver features that drive business value.",
	},
	{
		id: "JOB014",
		title: "Mobile Developer (iOS)",
		department: "Engineering",
		requiredSkills: ["Swift", "SwiftUI", "iOS SDK", "REST APIs", "Core Data"],
		experienceLevel: "Mid-level",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 95000,
		salaryMax: 130000,
		status: "open",
		description: "Build native iOS applications using Swift and SwiftUI. Experience with modern iOS development practices required.",
	},
	{
		id: "JOB015",
		title: "Brand Designer",
		department: "Design",
		requiredSkills: ["Branding", "Illustration", "Adobe Creative Suite", "Typography", "Visual Identity"],
		experienceLevel: "Mid-level",
		location: "Los Angeles, CA",
		employmentType: "Full-time",
		salaryMin: 75000,
		salaryMax: 105000,
		status: "open",
		description: "Create compelling brand identities and visual assets. Strong portfolio demonstrating branding and illustration skills required.",
	},
	{
		id: "JOB016",
		title: "Customer Success Manager",
		department: "Customer Success",
		requiredSkills: ["Customer Service", "Account Management", "Communication", "CRM Software", "Problem Solving"],
		experienceLevel: "Mid-level",
		location: "Remote",
		employmentType: "Full-time",
		salaryMin: 65000,
		salaryMax: 90000,
		status: "open",
		description: "Ensure customer satisfaction and drive product adoption. Experience managing enterprise accounts preferred.",
	},
	{
		id: "JOB017",
		title: "QA Engineer",
		department: "Engineering",
		requiredSkills: ["Test Automation", "Selenium", "JavaScript", "API Testing", "CI/CD"],
		experienceLevel: "Mid-level",
		location: "Austin, TX",
		employmentType: "Full-time",
		salaryMin: 80000,
		salaryMax: 110000,
		status: "open",
		description: "Develop automated test suites and ensure product quality. Experience with test automation frameworks required.",
	},
];

async function main() {
	try {
		const db = getDb();
		console.log("🧹 Truncating tables...\n");

		// Truncate tables in the correct order (respecting foreign key constraints)
		await db.execute(sql`TRUNCATE TABLE application_position_matches CASCADE`);
		console.log("✓ Truncated application_position_matches");

		await db.execute(sql`TRUNCATE TABLE reviewed_applications CASCADE`);
		console.log("✓ Truncated reviewed_applications");

		await db.execute(sql`TRUNCATE TABLE open_positions CASCADE`);
		console.log("✓ Truncated open_positions");

		console.log("\n🚀 Starting to seed job positions...\n");

		for (const position of samplePositions) {
			try {
				await db.insert(openPositions).values(position);
				console.log(`✅ Created: ${position.id} - ${position.title} (${position.department})`);
			} catch (error) {
				console.log(`⚠️  Skipped: ${position.id} - Already exists`);
			}
		}

		console.log("\n🎉 Seeding completed!");
		console.log(`📊 Total positions: ${samplePositions.length}`);
		console.log("\nBreakdown by department:");

		const departments = samplePositions.reduce((acc, pos) => {
			acc[pos.department] = (acc[pos.department] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		for (const [dept, count] of Object.entries(departments)) {
			console.log(`  - ${dept}: ${count} positions`);
		}

	} catch (error) {
		console.error("\n❌ Error seeding positions:", error);
		process.exit(1);
	}
}

main();
