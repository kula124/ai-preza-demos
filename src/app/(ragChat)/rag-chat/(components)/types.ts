export interface IMessage {
	id: string;
	text: string;
	isUser: boolean;
	isStreaming?: boolean;
	sources?: Array<{ content: string; filename: string }>;
	searchQuery?: string;
	positions?: Array<any>;
	applications?: Array<any>;
	matches?: Array<any>;
	confirmation?: any;
	toolType?: string;
	toolUsage?: any;
}
