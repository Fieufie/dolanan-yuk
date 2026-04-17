'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Eye } from 'lucide-react';

interface Props {
  question: Question;
  onAnswer: (answer: string, timeTaken: number) => void;
  startTime: number;
}

export default function ImageGuess({ question, onAnswer, startTime }: Props) {
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [blurAmount, setBlurAmount] = useState(20);
  const [hintUsed, setHintUsed] = useState(false);

  useEffect(() => {
    setUserAnswer('');
    setRevealed(false);
    setBlurAmount(20);
    setHintUsed(false);
  }, [question.id]);

  const getImageStyle = () => {
    if (revealed) return {};
    if (question.image_effect === 'blur') return { filter: `blur(${blurAmount}px)` };
    if (question.image_effect === 'crop') {
      return {
        clipPath: 'inset(35% 35% 35% 35%)',
        transform: 'scale(3)',
        transformOrigin: 'center',
      };
    }
    return {};
  };

  const handleHint = () => {
    setBlurAmount((b) => Math.max(0, b - 8));
    setHintUsed(true);
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || revealed) return;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correct = userAnswer.toLowerCase().trim() === (question.correct_answer || '').toLowerCase().trim();
    setIsCorrect(correct);
    setRevealed(true);
    setTimeout(() => onAnswer(userAnswer.trim(), timeTaken), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-lg font-bold">{question.question_text || 'Gambar Apakah Ini?'}</h2>
        {question.hint && <p className="text-sm text-muted-foreground mt-1">Petunjuk: {question.hint}</p>}
      </div>

      {question.image_url && (
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden" style={{ height: '200px' }}>
          <img
            src={question.image_url}
            alt="Tebak gambar"
            className="w-full h-full object-cover transition-all duration-500"
            style={getImageStyle()}
          />
          {!revealed && question.image_effect === 'blur' && blurAmount > 0 && (
            <div className="absolute inset-0 flex items-end justify-end p-3">
              <button
                onClick={handleHint}
                className="flex items-center gap-1 text-xs bg-white/80 backdrop-blur-sm px-2.5 py-1.5 rounded-lg font-medium text-gray-700 hover:bg-white shadow"
              >
                <Eye className="w-3.5 h-3.5" />
                Perjelas {hintUsed ? 'Lagi' : ''}
              </button>
            </div>
          )}
          {revealed && !isCorrect && (
            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <X className="w-16 h-16 text-red-500" />
            </div>
          )}
          {revealed && isCorrect && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <Check className="w-16 h-16 text-green-500" />
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Input
          placeholder="Apa yang ada di gambar?"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={revealed}
          className="border-sky-100 focus-visible:ring-sky-300"
        />
        {!revealed && (
          <Button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full gradient-rose text-white border-0 hover:opacity-90"
          >
            Jawab!
          </Button>
        )}
        {revealed && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold justify-center ${
            isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {isCorrect ? 'Benar!' : `Jawaban: ${question.correct_answer}`}
          </div>
        )}
      </div>
    </div>
  );
}
