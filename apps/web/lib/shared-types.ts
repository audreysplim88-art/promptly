export type Domain = "general" | "creative" | "technical" | "professional";

export type OutputStyle = "standard" | "concise" | "developer";

export type QuestionType = "text" | "radio" | "checkbox";

export type Dimension =
  | "goal"
  | "context"
  | "audience"
  | "format"
  | "constraints"
  | "tone";

export interface Question {
  id: string;
  dimension: Dimension;
  type: QuestionType;
  prompt: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
}

export interface Answer {
  questionId: string;
  value: string | string[];
}

export interface InterviewRequest {
  goal: string;
}

export interface InterviewResponse {
  sessionId: string;
  domain: Domain;
  domainConfidence: number;
  domainRationale: string;
  questions: Question[];
}

export interface SynthesizeRequest {
  sessionId: string;
  goal: string;
  domain: Domain;
  questions: Question[];
  answers: Answer[];
  outputStyle: OutputStyle;
}

export type Tier = "free" | "pro";

export interface UserUsage {
  tier: Tier;
  todayCount: number;
  dailyLimit: number;
}
