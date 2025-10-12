export interface IMessage {
	id: string;
	text: string;
	isUser: boolean;
	isStreaming?: boolean;
	sources?: Array<{ content: string; filename: string }>;
	searchQuery?: string;
}
