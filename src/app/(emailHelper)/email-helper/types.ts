export type EmailType =
  | "professional"
  | "casual"
  | "marketing"
  | "sales"
  | "support";

export type EmailTone =
  | "formal"
  | "friendly"
  | "persuasive"
  | "apologetic"
  | "enthusiastic"
  | "neutral";

export interface EmailFormData {
  emailType: EmailType;
  tone: EmailTone;
  rawText: string;
  recipientName?: string;
  context?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export interface SavedEmail {
  id: number;
  emailType: string;
  tone: string;
  keyPoints: string[];
  context: string | null;
  generatedSubject: string;
  generatedBody: string;
  createdAt: Date;
}
