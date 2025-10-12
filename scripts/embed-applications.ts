#!/usr/bin/env tsx
/**
 * CLI Script to embed job applications
 *
 * Usage:
 *   npm run embed-applications          # Embed all unembed applications
 *   npm run embed-applications -- stats # Show embedding statistics
 */

import { ApplicationEmbeddingService } from "../src/services/ApplicationEmbeddingService";

async function main() {
	const command = process.argv[2] || "embed";
	const service = new ApplicationEmbeddingService();

	try {
		if (command === "stats") {
			// Show statistics
			console.log("📊 Fetching embedding statistics...\n");
			const stats = await service.getEmbeddingStats();

			console.log("=== Application Embedding Statistics ===");
			console.log(`Total Applications:      ${stats.totalApplications}`);
			console.log(`Embedded Applications:   ${stats.embeddedApplications}`);
			console.log(`Unembed Applications:  ${stats.unembeddedApplications}`);
			console.log(`Total Embedding Chunks:  ${stats.totalChunks}`);
			console.log(
				`Average Chunks/App:      ${stats.embeddedApplications > 0 ? (stats.totalChunks / stats.embeddedApplications).toFixed(2) : "N/A"}`,
			);

			if (stats.unembeddedApplications > 0) {
				console.log(
					`\n💡 Run 'npm run embed-applications' to embed ${stats.unembeddedApplications} pending applications`,
				);
			} else {
				console.log("\n✅ All applications are embedded!");
			}
		} else if (command === "embed") {
			// Show initial stats
			console.log("📊 Checking for unembed applications...\n");
			const statsBefore = await service.getEmbeddingStats();

			if (statsBefore.unembeddedApplications === 0) {
				console.log("✅ All applications are already embedded!");
				process.exit(0);
			}

			console.log(
				`Found ${statsBefore.unembeddedApplications} unembed applications\n`,
			);
			console.log("🚀 Starting embedding process...\n");

			// Embed applications
			const result = await service.embedUnembeddedApplications();

			// Show results
			console.log("\n" + "=".repeat(50));
			console.log("📈 Embedding Results");
			console.log("=".repeat(50));
			console.log(`✅ Successfully processed: ${result.processed}`);

			if (result.errors.length > 0) {
				console.log(`❌ Failed: ${result.errors.length}`);
				console.log("\nErrors:");
				for (const error of result.errors) {
					console.log(`  - Application ${error.id}: ${error.error}`);
				}
			}

			// Show final stats
			const statsAfter = await service.getEmbeddingStats();
			console.log("\n=== Final Statistics ===");
			console.log(`Total Applications:      ${statsAfter.totalApplications}`);
			console.log(`Embedded Applications:   ${statsAfter.embeddedApplications}`);
			console.log(`Remaining Unembed:     ${statsAfter.unembeddedApplications}`);
			console.log(`Total Embedding Chunks:  ${statsAfter.totalChunks}`);

			if (statsAfter.unembeddedApplications === 0) {
				console.log("\n🎉 All applications are now embedded!");
			}
		} else {
			console.error(`Unknown command: ${command}`);
			console.log("\nUsage:");
			console.log("  npm run embed-applications          # Embed all unembed");
			console.log("  npm run embed-applications -- stats # Show statistics");
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ Error:", error);
		process.exit(1);
	}
}

main();
