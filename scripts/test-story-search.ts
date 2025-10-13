import { StoryEmbeddingService } from "../src/services/StoryEmbeddingService";

async function testStorySearch() {
	console.log("Testing Story Embedding Search...\n");

	const storyService = new StoryEmbeddingService();

	// Test 1: Search for "animals"
	console.log("Test 1: Searching for 'animals'...");
	const results1 = await storyService.similaritySearch("animals", 3);
	console.log(`Found ${results1.length} results:`);
	results1.forEach((result, idx) => {
		console.log(`\nResult ${idx + 1}:`);
		console.log(`  Story ID: ${result.entityId}`);
		console.log(`  Topic: ${result.entity.topic}`);
		console.log(`  Age: ${result.entity.childAge || result.entity.child_age}`);
		console.log(`  Similarity: ${result.similarity}`);
		console.log(
			`  Chunk Text: ${result.chunkText?.substring(0, 100)}...`,
		);
	});

	// Test 2: Search for "lamb"
	console.log("\n\nTest 2: Searching for 'lamb'...");
	const results2 = await storyService.similaritySearch("lamb", 3);
	console.log(`Found ${results2.length} results:`);
	results2.forEach((result, idx) => {
		console.log(`\nResult ${idx + 1}:`);
		console.log(`  Story ID: ${result.entityId}`);
		console.log(`  Topic: ${result.entity.topic}`);
		console.log(`  Similarity: ${result.similarity}`);
	});

	// Test 3: Search for "bedtime story"
	console.log("\n\nTest 3: Searching for 'bedtime story'...");
	const results3 = await storyService.similaritySearch("bedtime story", 3);
	console.log(`Found ${results3.length} results:`);
	results3.forEach((result, idx) => {
		console.log(`\nResult ${idx + 1}:`);
		console.log(`  Story ID: ${result.entityId}`);
		console.log(`  Topic: ${result.entity.topic}`);
		console.log(`  Similarity: ${result.similarity}`);
	});

	console.log("\n\nTest completed!");
	process.exit(0);
}

testStorySearch().catch((error) => {
	console.error("Error during test:", error);
	process.exit(1);
});
