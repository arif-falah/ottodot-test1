import { NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';
import { supabase } from '@/lib/supabaseClient';
import type { MathProblem } from '@/types';

export async function POST() {
  try {
    // Choose a random Primary 5 sub-strand/micro-topic to ensure variety
    const topics = [
      // WHOLE NUMBERS
      "WHOLE NUMBERS — Numbers up to 10 million: reading & writing in numerals and words",
      "WHOLE NUMBERS — Four operations: order of operations with brackets (no calculator)",
      "WHOLE NUMBERS — Multiply/divide by 10, 100, 1000 and multiples (no calculator)",

      // FRACTIONS
      "FRACTIONS — Division: whole number ÷ whole number with quotient as a fraction (e.g., 3 ÷ 4 = 3/4)",
      "FRACTIONS — Expressing fractions as decimals",
      "FRACTIONS — Add and subtract mixed numbers",
      "FRACTIONS — Multiply proper/improper fraction × whole number (no calculator)",
      "FRACTIONS — Multiply proper fraction × proper/improper fraction (no calculator)",
      "FRACTIONS — Multiply two improper fractions",
      "FRACTIONS — Multiply mixed number × whole number",

      // DECIMALS
      "DECIMALS — Multiply/divide decimals (≤ 3 dp) by 10/100/1000 and multiples (no calculator)",
      "DECIMALS — Unit conversions in decimal form: kilometres ↔ metres",
      "DECIMALS — Unit conversions in decimal form: metres ↔ centimetres",
      "DECIMALS — Unit conversions in decimal form: kilograms ↔ grams",
      "DECIMALS — Unit conversions in decimal form: litres ↔ millilitres",

      // PERCENTAGE
      "PERCENTAGE — Expressing part of a whole as a percentage; use of %",
      "PERCENTAGE — Finding a percentage part of a whole",
      "PERCENTAGE — Real-world: finding discount / GST / annual interest",

      // RATE
      "RATE — rate as amount per unit; find rate, total, or units given two quantities",

      // AREA & VOLUME
      "AREA — Triangle: identify base & height; area = base × height ÷ 2",
      "AREA — Composite figures made of rectangles, squares, triangles",
      "VOLUME — Cube/Cuboid: build with unit cubes; volume = length × width × height",
      "VOLUME — Liquid volume in rectangular tank; 1 ml = 1 cm³; 1 ℓ = 1000 cm³",

      // GEOMETRY
      "GEOMETRY — Angles on a straight line (180°); at a point (360°); vertically opposite angles",
      "GEOMETRY — Triangles: properties (isosceles/equilateral/right-angled); angle sum = 180°",
      "GEOMETRY — Quadrilaterals: properties (parallelogram/rhombus/trapezium); find unknown angles"
    ] as const;

    const chosen = topics[Math.floor(Math.random() * topics.length)];

    // Generate math problem using Gemini AI - EXACT alignment with Singapore Primary 5 Mathematics Syllabus (2021)
    const prompt = `Generate a single math word problem STRICTLY aligned with the Singapore Primary 5 Mathematics Syllabus (2021) for students aged 10-11.

CHOSEN SUB-STRAND/MICRO-TOPIC (use this ONLY): ${chosen}

═══════════════════════════════════════════════════════════════════
NUMBERS AND ALGEBRA - SELECT ONE SUB-STRAND:
═══════════════════════════════════════════════════════════════════

▸ WHOLE NUMBERS:
  • Numbers up to 10 million (reading, writing in numerals and words)
  • Four Operations:
    - Multiplying and dividing by 10, 100, 1000 and their multiples (without calculator)
    - Order of operations (without calculator) - BODMAS/PEMDAS
    - Use of brackets (without calculator)
  Example contexts: Large quantities, population, money, distances

▸ FRACTIONS:
  • Fraction and Division:
    - Dividing a whole number by a whole number with quotient as a fraction (e.g., 3 ÷ 4 = 3/4)
    - Expressing fractions as decimals
  • Four Operations:
    - Adding and subtracting mixed numbers
    - Multiplying: proper/improper fraction × whole number (without calculator)
    - Multiplying: proper fraction × proper/improper fraction (without calculator)
    - Multiplying: two improper fractions
    - Multiplying: mixed number × whole number
  Example contexts: Sharing food, portions, distances, measurements

▸ DECIMALS:
  • Four Operations:
    - Multiplying and dividing decimals (up to 3 decimal places) by 10, 100, 1000 and their multiples (without calculator)
    - Converting measurements between units in decimal form:
      * kilometres ↔ metres (e.g., 2.5 km = 2500 m)
      * metres ↔ centimetres (e.g., 1.75 m = 175 cm)
      * kilograms ↔ grams (e.g., 3.25 kg = 3250 g)
      * litres ↔ millilitres (e.g., 1.5 ℓ = 1500 ml)
  Example contexts: Shopping, cooking, science experiments

▸ PERCENTAGE:
  • Expressing a part of a whole as a percentage
  • Use of % symbol
  • Finding a percentage part of a whole
  • REAL-WORLD APPLICATIONS (Important!):
    - Finding discount (e.g., 20% off $50)
    - Finding GST (Goods and Services Tax, typically 7-9%)
    - Finding annual interest (e.g., 3% interest per year)
  Example contexts: Shopping sales, savings accounts, tax calculations

▸ RATE:
  • Rate as the amount of a quantity per unit of another quantity
  • Finding rate, total amount, or number of units given the other two quantities
  • Common rates: speed (km/h), price rate ($/kg), work rate (pages/hour)
  Example contexts: Travel speed, unit pricing, productivity

═══════════════════════════════════════════════════════════════════
MEASUREMENT AND GEOMETRY - SELECT ONE SUB-STRAND:
═══════════════════════════════════════════════════════════════════

▸ AREA OF TRIANGLE:
  • Concepts of base and height of a triangle
  • Area of triangle = base × height ÷ 2
  • Finding the area of composite figures made up of rectangles, squares and triangles
  Example contexts: Land plots, garden design, craft projects

▸ VOLUME OF CUBE AND CUBOID:
  • Building solids with unit cubes (visualization)
  • Measuring volume in cubic units: cm³ or m³ (NO conversion between cm³ and m³ required)
  • Drawing cubes and cuboids on isometric grid
  • Volume of cube/cuboid = length × width × height
  • Finding the volume of liquid in a rectangular tank
  • Relationship between ℓ (or ml) and cm³: 1 ml = 1 cm³, 1 ℓ = 1000 cm³
  Example contexts: Water tanks, boxes, containers, aquariums

▸ GEOMETRY - ANGLES:
  • Angles on a straight line = 180°
  • Angles at a point = 360°
  • Vertically opposite angles (equal)
  • Finding unknown angles using these properties
  Example contexts: Clock problems, intersecting roads, geometric patterns

▸ GEOMETRY - TRIANGLES:
  • Properties of triangles:
    - Isosceles triangle (2 equal sides, 2 equal angles)
    - Equilateral triangle (3 equal sides, all angles 60°)
    - Right-angled triangle (one 90° angle)
  • Angle sum of a triangle = 180°
  • Finding unknown angles WITHOUT additional construction of lines
  Example contexts: Structural supports, flags, signs

▸ GEOMETRY - QUADRILATERALS:
  • Properties of:
    - Parallelogram (opposite sides parallel and equal)
    - Rhombus (all sides equal, opposite angles equal)
    - Trapezium (one pair of parallel sides)
  • Finding unknown angles WITHOUT additional construction of lines
  Example contexts: Tiles, kites, building structures

═══════════════════════════════════════════════════════════════════
PROBLEM-SOLVING HEURISTICS (incorporate naturally):
═══════════════════════════════════════════════════════════════════
• Bar models/strip diagrams (for comparison, part-whole, before-after)
• Drawing clear diagrams or models
• Making systematic lists or tables
• Looking for patterns and relationships
• Working backwards from the answer
• Before-after concept
• Making suppositions ("What if...")
• Simplifying the problem first

═══════════════════════════════════════════════════════════════════
STRICT REQUIREMENTS:
═══════════════════════════════════════════════════════════════════
1. USE THE CHOSEN SUB-STRAND/MICRO-TOPIC ABOVE ONLY (do not choose another)
2. Create a realistic, engaging scenario relevant to a 10-11 year old's daily life
3. Problem difficulty: Requires 2-4 logical steps to solve
4. Language: Clear, precise, age-appropriate (avoid ambiguity)
5. Context: Use specific names, objects, realistic numbers, and relatable situations
6. Constraints:
   • Use ONLY Primary 5 level concepts (no advanced algebra, trigonometry, etc.)
   • Answer must be a single numerical value
   • If decimal answer: round to maximum 2 decimal places
   • If fraction answer: convert to decimal (up to 2 dp)
   • Ensure the problem is solvable WITHOUT calculator (where specified in syllabus)
7. Numbers to use:
   • Whole numbers: up to 10 million range
   • Decimals: up to 3 decimal places maximum
   • Fractions: Use proper, improper, and mixed numbers appropriately
   • Percentages: Realistic values (5%, 10%, 15%, 20%, 25%, etc.)

═══════════════════════════════════════════════════════════════════
JSON OUTPUT FORMAT (EXACT):
═══════════════════════════════════════════════════════════════════
Return ONLY this JSON object with NO additional text, markdown, or explanations:

{
  "problem_text": "[Complete word problem with clear context, specific details, and all necessary information]",
  "final_answer": 42.5
}

CRITICAL VALIDATION CHECKLIST:
✓ final_answer is a NUMBER (not a string)
✓ final_answer is rounded to max 2 decimal places
✓ problem_text is complete and self-contained
✓ Problem matches ONE specific sub-strand from syllabus
✓ Problem is solvable using ONLY P5 concepts
✓ Context is realistic and age-appropriate
✓ NO solution steps included in problem_text
✓ NO markdown formatting (no \`\`\`json or extra text outside JSON)

Generate the problem now.`;

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
