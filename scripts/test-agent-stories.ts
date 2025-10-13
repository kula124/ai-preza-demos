import { AgentService } from "../src/services/AgentService";

async function testAgentStoryQuestion() {
	console.log("Testing Agent Story Question...\n");

	const questions = [
		"What bedtime stories do we have?",
		"Tell me about the bedtime stories in the database",
		"What characters are in our bedtime stories?",
	];

	for (const question of questions) {
		console.log(`\n${"=".repeat(80)}`);
		console.log(`Question: ${question}`);
		console.log("=".repeat(80));

		try {
			const response = await AgentService.chat(question, "test-thread-1");
			console.log("\nAgent Response:");
			console.log(response);
		} catch (error) {
			console.error("Error:", error);
		}
	}

	console.log("\n\nTest completed!");
	process.exit(0);
}

testAgentStoryQuestion().catch((error) => {
	console.error("Error during test:", error);
	process.exit(1);
});
