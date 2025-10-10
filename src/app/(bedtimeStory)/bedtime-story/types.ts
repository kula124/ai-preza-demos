export interface StoryFormData {
	age: string;
	gender: "boy" | "girl" | "other" | "";
	interests: string[];
	style: string;
	lesson: string;
}

export interface GeneratedStory {
	id?: number;
	content: string;
	formData: StoryFormData;
	createdAt?: Date;
}

export const INTERESTS = [
	"Animals",
	"Space & Stars",
	"Ocean & Sea Life",
	"Dinosaurs",
	"Magic & Fantasy",
	"Sports",
	"Music",
	"Art & Drawing",
	"Nature & Forest",
	"Superheroes",
	"Vehicles & Transportation",
	"Cooking & Food",
	"Science & Experiments",
] as const;

export const STORY_STYLES = [
	{ value: "funny", label: "Funny & Silly", emoji: "😄" },
	{ value: "adventurous", label: "Adventurous & Exciting", emoji: "🌟" },
	{ value: "gentle", label: "Gentle & Calming", emoji: "🌙" },
	{ value: "magical", label: "Magical & Enchanting", emoji: "✨" },
	{ value: "educational", label: "Educational & Learning", emoji: "📚" },
] as const;
