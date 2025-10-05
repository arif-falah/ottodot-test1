import { NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';
import { supabase } from '@/lib/supabaseClient';
import type { MathProblem } from '@/types';

export async function POST() {
  try {
    // Generate math problem using Gemini AI
    const prompt = `Generate a single math word problem suitable for a Primary 5 student (age 10-11). 
    The problem should cover topics like fractions, decimals, percentages, ratios, areas, volumes, or algebraic thinking.
    
    Return your response as a JSON object with this EXACT format:
    {
      "problem_text": "The word problem text here",
      "final_answer": 42
    }
    
    Important:
    - final_answer must be a number (integer or decimal)
    - problem_text should be a complete, clear word problem
    - Do not include any additional text outside the JSON
    - Make the problem engaging and age-appropriate`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let problemData: MathProblem;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      problemData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response
    if (!problemData.problem_text || typeof problemData.final_answer !== 'number') {
      throw new Error('Invalid problem format from AI');
    }

    // Save to Supabase
    const { data: session, error: dbError } = await supabase
      .from('math_problem_sessions')
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.final_answer,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save problem to database');
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error generating problem:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate problem',
      },
      { status: 500 }
    );
  }
}
