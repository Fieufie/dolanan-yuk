'use client';

import { useState } from 'react';
import { Question } from '@/lib/types';
import { Check, X } from 'lucide-react';

interface Props {
  question: Question;
  onAnswer: (answer: string, timeTaken: number) => void;
  startTime: number;
}

export default function MultipleChoice({ question, onAnswer, startTime }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (option: string) => {
    if (revealed) return;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    setSelected(option);
    setRevealed(true);
    setTimeout(() => onAnswer(option, timeTaken), 1200);
  };

  const optionColors = (opt: string) => {
    if (!revealed) return 'bg-white border-sky-100 hover:border-sky-400 hover:bg-sky-50';
    if (opt === question.correct_answer) return 'bg-green-50 border-green-400 text-green-800';
    if (opt === selected && opt !== question.correct_answer) return 'bg-red-50 border-red-400 text-red-800';
    return 'bg-gray-50 border-gray-200 text-gray-400';
  };

  return (
    <div className="space-y-3">
      {question.image_url && (
        <img src={question.image_url} alt="" className="w-full h-40 object-cover rounded-xl" />
      )}
      <h2 className="text-lg font-bold text-center">{question.question_text}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {(question.options || []).map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            disabled={revealed}
            className={`p-4 rounded-xl border-2 text-left font-medium transition-all game-card-hover ${optionColors(opt)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-xs font-bold text-sky-700 shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </div>
              {revealed && opt === question.correct_answer && <Check className="w-4 h-4 text-green-600 shrink-0" />}
              {revealed && opt === selected && opt !== question.correct_answer && <X className="w-4 h-4 text-red-500 shrink-0" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
