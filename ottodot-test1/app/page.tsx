'use client';

import { useState } from 'react';
import type { ProblemSession, Submission } from '@/types';

export default function Home() {
  const [session, setSession] = useState<ProblemSession | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewProblem = async () => {
    setIsLoading(true);
    setError(null);
    setSubmission(null);
    setUserAnswer('');

    try {
      const response = await fetch('/api/generate-problem', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSession(data.session);
      } else {
        setError(data.error || 'Failed to generate problem');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !userAnswer.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          userAnswer: parseFloat(userAnswer),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmission(data.submission);
      } else {
        setError(data.error || 'Failed to submit answer');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
      <main className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Math Practice
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Developed By: Arif Fayyadh <span role="img" aria-label="love">❤️</span> For Ottodot (Test 1)
          </p>
        </div>

        {/* Generate Problem Button */}
        <div className="mb-8 text-center">
          <button
            onClick={generateNewProblem}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 text-lg"
          >
            {isLoading && !session ? 'Generating...' : 'Generate New Problem'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Problem Display */}
        {session && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Problem
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              {session.problem_text}
            </p>

            {/* Answer Form */}
            {!submission && (
              <form onSubmit={submitAnswer} className="space-y-4">
                <div>
                  <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Answer
                  </label>
                  <input
                    type="number"
                    id="answer"
                    step="any"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                    placeholder="Enter your answer"
                    disabled={isLoading}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !userAnswer.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200"
                >
                  {isLoading ? 'Submitting...' : 'Submit Answer'}
                </button>
              </form>
            )}

            {/* Feedback Display */}
            {submission && (
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg ${submission.is_correct
                  ? 'bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700'
                  : 'bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-700'
                  }`}>
                  <h3 className={`text-xl font-semibold mb-2 ${submission.is_correct
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                    }`}>
                    {submission.is_correct ? '✓ Correct!' : '✗ Not Quite'}
                  </h3>
                  <p className={`text-lg ${submission.is_correct
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                    }`}>
                    Your answer: {submission.user_answer}
                  </p>
                  {!submission.is_correct && (
                    <p className="text-lg text-yellow-700 dark:text-yellow-300 mt-1">
                      Correct answer: {session.correct_answer}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    Feedback
                  </h3>
                  <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                    {submission.feedback_text}
                  </p>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!session && !isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Welcome! 👋
            </h2>
            <div className="text-gray-700 dark:text-gray-300 space-y-3">
              <p>Click the button above to generate a new math word problem aligned with the Singapore Primary 5 syllabus.</p>
              <p>Problems may cover any of the Primary 5 sub-strands, including:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Whole numbers (up to 10,000,000), order of operations, brackets</li>
                <li>Fractions (proper, improper, mixed) — addition, subtraction, multiplication</li>
                <li>Decimals and unit conversions (km↔m, kg↔g, ℓ↔ml)</li>
                <li>Percentages (discount, GST, interest) and rates</li>
                <li>Area of triangle and volume of cuboid/cube</li>
                <li>Angle properties, triangle and quadrilateral reasoning</li>
              </ul>
              <p className="mt-2">Answer format helper:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Enter integers or decimals (accepted up to 2 decimal places). Example: <code>42</code> or <code>3.5</code>.</li>
                <li>If a fraction is expected, enter the decimal equivalent unless asked otherwise. Example: <code>3/4</code> → enter <code>0.75</code>.</li>
                <li>Some problems are explicitly set to be solved without a calculator — use mental strategies or paper working.</li>
              </ul>
              <p className="mt-4">After submitting your answer, you'll receive warm, syllabus-aligned feedback that points out the concept involved and gives a helpful hint or praise.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
