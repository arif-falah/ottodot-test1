export interface MathProblem {
  problem_text: string;
  final_answer: number;
}

export interface ProblemSession {
  id: string;
  problem_text: string;
  correct_answer: number;
  created_at: string;
}

export interface Submission {
  id: string;
  session_id: string;
  user_answer: number;
  is_correct: boolean;
  feedback_text: string;
  created_at: string;
}

export interface GenerateProblemResponse {
  success: boolean;
  session?: ProblemSession;
  error?: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  submission?: Submission;
  error?: string;
}
