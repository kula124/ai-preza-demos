import type {
	OpenPosition,
	ReviewedApplication,
	ApplicationPositionMatch,
} from "@/repo/schema";

// Form data types
export interface PositionFormData {
	id: string;
	title: string;
	department: string;
	requiredSkills: string[];
	experienceLevel: string;
	location: string;
	employmentType: string;
	salaryMin?: number;
	salaryMax?: number;
	description?: string;
}

export type PositionStatus = "open" | "closed" | "filled";

export type RecommendationType = "HIRE" | "MAYBE" | "REJECT";

// Extended types with relations
export interface ApplicationWithMatches extends ReviewedApplication {
	matches: ApplicationPositionMatch[];
}

export interface PositionWithApplicationCount extends OpenPosition {
	applicationCount?: number;
}

// Filter/sort types
export interface ApplicationFilters {
	recommendation?: RecommendationType;
	minScore?: number;
	maxScore?: number;
}

export interface PositionFilters {
	status?: PositionStatus;
	department?: string;
}
