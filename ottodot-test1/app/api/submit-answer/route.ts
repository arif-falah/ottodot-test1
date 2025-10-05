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

    // Generate personalized feedback using Gemini AI - EXACT alignment with Singapore Math pedagogy and P5 syllabus
    const feedbackPrompt = `You are an expert Primary 5 mathematics tutor trained in the Singapore Mathematics curriculum (2021 syllabus). Provide pedagogically sound, concept-specific feedback.

═══════════════════════════════════════════════════════════════════
PROBLEM CONTEXT:
═══════════════════════════════════════════════════════════════════
Problem: ${session.problem_text}
Correct Answer: ${session.correct_answer}
Student's Answer: ${userAnswer}
Is Correct: ${isCorrect}

═══════════════════════════════════════════════════════════════════
FEEDBACK GUIDELINES (2-4 sentences):
═══════════════════════════════════════════════════════════════════

▸ IF CORRECT:
1. Give warm, SPECIFIC praise acknowledging their mathematical thinking
2. Identify and name the EXACT P5 concept/sub-strand they applied:
   • "You correctly used the order of operations with brackets!"
   • "Excellent work multiplying the mixed number by a whole number!"
   • "Perfect! You found the area of the triangle using base × height ÷ 2."
   • "Great job calculating the discount percentage!"
   • "Well done applying the angle sum of a triangle (180°)!"
   • "You correctly converted metres to centimetres in decimal form!"
3. If applicable, mention the problem-solving heuristic used:
   • "Drawing a bar model really helped you visualize the problem."
   • "Working backwards was a smart strategy here."
   • "Your diagram made the angle relationships clear."
4. Encourage further practice: "Try more challenging [concept] problems!"

▸ IF INCORRECT:
1. START with encouragement: "Good effort!", "You're thinking in the right direction!", "Nice try!"

2. ACKNOWLEDGE any correct steps or partial understanding:
   • "You correctly identified the base and height."
   • "Good start multiplying by 10 first."
   • "You remembered that angles in a triangle add up to 180°."

3. IDENTIFY the specific error using P5 terminology:
   • "The mistake happened when [specific step]."
   • "Remember to follow the order of operations: Brackets first, then..."
   • "When multiplying a mixed number, we need to..."

4. PROVIDE CONCEPT-SPECIFIC HINTS based on the sub-strand:

   For WHOLE NUMBERS:
   • "Remember BODMAS: Brackets, then multiply/divide from left to right."
   • "When multiplying by 1000, move the decimal point 3 places to the right."
   
   For FRACTIONS:
   • "When adding mixed numbers, convert to improper fractions first or add whole numbers and fractions separately."
   • "Remember: when dividing 3 by 4, the quotient is 3/4."
   • "To multiply a fraction by a whole number, multiply the numerator only."
   
   For DECIMALS:
   • "When converting km to m, multiply by 1000 (1 km = 1000 m)."
   • "When converting g to kg, divide by 1000 (1000 g = 1 kg)."
   • "Remember: 1 ml = 1 cm³, so 1 ℓ = 1000 cm³."
   
   For PERCENTAGE:
   • "To find 20% discount: Calculate 20/100 × original price."
   • "GST is added to the original price. If GST is 8%, multiply by 0.08."
   • "Remember: percentage = (part ÷ whole) × 100%."
   
   For RATE:
   • "Rate = Total amount ÷ Number of units. Check which quantity goes where."
   • "Speed = Distance ÷ Time. Make sure your units match (km and hours)."
   
   For AREA OF TRIANGLE:
   • "Area of triangle = base × height ÷ 2. Did you divide by 2?"
   • "Make sure you identified the correct base and perpendicular height."
   • "For composite figures, break them into simpler shapes first."
   
   For VOLUME:
   • "Volume of cuboid = length × width × height. Check all three dimensions."
   • "Remember: 1 ml = 1 cm³. Convert if needed."
   • "Make sure all measurements are in the same unit before multiplying."
   
   For ANGLES:
   • "Angles on a straight line add up to 180°. Subtract the known angle."
   • "Angles at a point add up to 360°. Add all known angles first."
   • "Vertically opposite angles are equal."
   
   For TRIANGLES:
   • "In an isosceles triangle, the two base angles are equal."
   • "Angle sum of a triangle = 180°. Subtract the two known angles."
   • "In an equilateral triangle, all three angles are 60°."
   
   For QUADRILATERALS:
   • "In a parallelogram, opposite angles are equal."
   • "Remember the properties of a rhombus: all sides equal."

5. SUGGEST A PROBLEM-SOLVING STRATEGY:
   • "Try drawing a bar model to visualize the parts."
   • "Sketch a diagram and label all the angles you know."
   • "Break this into smaller steps: first find [this], then [that]."
   • "Work backwards: What do we know? What do we need to find?"

6. END with encouragement: "Try again - you're very close!", "Give it another go!"

═══════════════════════════════════════════════════════════════════
TONE AND LANGUAGE REQUIREMENTS:
═══════════════════════════════════════════════════════════════════
• Warm, supportive, patient, and motivating
• Age-appropriate for 10-11 year olds (clear, simple language)
• Use encouraging phrases: "Well done!", "Excellent!", "Great thinking!", "Almost there!", "Good effort!"
• Use Singapore Math terminology: bar model, units, parts, base, height, proper/improper fraction, mixed number, etc.
• Be SPECIFIC about which P5 concept/sub-strand is involved
• Focus on building confidence and mathematical understanding
• Never be discouraging or negative

═══════════════════════════════════════════════════════════════════
OUTPUT:
═══════════════════════════════════════════════════════════════════
Provide ONLY the feedback text (2-4 sentences). 
DO NOT include:
- Labels like "Feedback:" or "Response:"
- Markdown formatting
- Extra explanations or meta-commentary
- The problem or answer repeated

Generate the feedback now.`;

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
