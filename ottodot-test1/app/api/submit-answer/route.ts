import { NextRequest, NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userAnswer } = body;

    if (!sessionId || userAnswer === undefined || userAnswer === null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the problem session from database
    const { data: session, error: sessionError } = await supabase
      .from('math_problem_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Problem session not found' },
        { status: 404 }
      );
    }

    // Check if answer is correct
    const isCorrect = Math.abs(Number(userAnswer) - session.correct_answer) < 0.01;

    // Generate personalized feedback using Gemini AI
    const feedbackPrompt = `You are a friendly and encouraging Primary 5 math tutor.
    
Problem: ${session.problem_text}
Correct Answer: ${session.correct_answer}
Student's Answer: ${userAnswer}
Is Correct: ${isCorrect}

Generate personalized feedback for the student (2-3 sentences). 

If correct:
- Praise the student
- Briefly explain why the answer is correct or mention the key concept they applied

If incorrect:
- Be encouraging and positive
- Gently point out where they might have gone wrong
- Give a helpful hint or explain the correct approach without directly giving away the full answer

Keep the tone warm, supportive, and age-appropriate for a 10-11 year old.`;

    const feedbackResult = await geminiModel.generateContent(feedbackPrompt);
    const feedbackResponse = await feedbackResult.response;
    const feedback = feedbackResponse.text().trim();

    // Save submission to database
    const { data: submission, error: submissionError } = await supabase
      .from('math_problem_submissions')
      .insert({
        session_id: sessionId,
        user_answer: Number(userAnswer),
        is_correct: isCorrect,
        feedback_text: feedback,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Database error:', submissionError);
      throw new Error('Failed to save submission');
    }

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit answer',
      },
      { status: 500 }
    );
  }
}
