'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/types';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  question: Question;
  onAnswer: (answer: string, timeTaken: number) => void;
  startTime: number;
}

export default function MathGame({ question, onAnswer, startTime }: Props) {
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setUserAnswer('');
    setRevealed(false);
  }, [question.id]);

  const handleSubmit = () => {
    if (!userAnswer.trim() || revealed) return;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correct = userAnswer.trim() === (question.correct_answer || '').trim();
    setIsCorrect(correct);
    setRevealed(true);
    setTimeout(() => onAnswer(userAnswer.trim(), timeTaken), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-muted-foreground mb-3">Hitung dengan Cepat!</h2>
        <div className="bg-gradient-to-br from-sky-50 to-amber-50 rounded-2xl p-8 border-2 border-sky-100">
          <p className="text-4xl sm:text-5xl font-black text-foreground font-mono">
            {question.math_expression || question.question_text}
          </p>
        </div>
      </div>

      <div className="max-w-xs mx-auto space-y-3">
        <Input
          type="number"
          placeholder="Ketik jawabanmu..."
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={revealed}
          className="text-center text-2xl font-bold h-14 border-sky-100 focus-visible:ring-sky-300"
          autoFocus
        />

        {!revealed && (
          <Button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full gradient-rose text-white border-0 h-12 text-base font-bold hover:opacity-90"
          >
            Jawab!
          </Button>
        )}

        {revealed && (
          <div className={`flex items-center gap-2 p-4 rounded-xl text-center justify-center font-bold ${
            isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {isCorrect ? 'Benar!' : `Jawaban: ${question.correct_answer}`}
          </div>
        )}
      </div>
    </div>
  );
}
