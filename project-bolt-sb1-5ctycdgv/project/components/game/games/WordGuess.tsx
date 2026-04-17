'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/types';
import { RotateCcw } from 'lucide-react';

interface Props {
  question: Question;
  onAnswer: (answer: string, timeTaken: number) => void;
  startTime: number;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function WordGuess({ question, onAnswer, startTime }: Props) {
  const word = (question.correct_answer || '').toUpperCase();
  const [shuffled, setShuffled] = useState<string[]>(() => shuffle(word.split('')));
  const [userWord, setUserWord] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setShuffled(shuffle(word.split('')));
    setUserWord([]);
    setRevealed(false);
  }, [question.id]);

  const addLetter = (index: number) => {
    if (revealed) return;
    const letter = shuffled[index];
    const newUser = [...userWord, letter];
    const newShuffled = shuffled.filter((_, i) => i !== index);
    setUserWord(newUser);
    setShuffled(newShuffled);

    if (newUser.length === word.length) {
      const answer = newUser.join('');
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setRevealed(true);
      setTimeout(() => onAnswer(answer, timeTaken), 1500);
    }
  };

  const removeLetter = (index: number) => {
    if (revealed) return;
    const letter = userWord[index];
    setShuffled([...shuffled, letter]);
    setUserWord(userWord.filter((_, i) => i !== index));
  };

  const resetWord = () => {
    setShuffled(shuffle(word.split('')));
    setUserWord([]);
  };

  const isCorrect = revealed && userWord.join('') === word;

  return (
    <div className="space-y-5">
      {question.image_url && (
        <img src={question.image_url} alt="" className="w-full h-36 object-cover rounded-xl" />
      )}
      <div className="text-center">
        <h2 className="text-lg font-bold">{question.question_text}</h2>
        {question.hint && <p className="text-sm text-muted-foreground mt-1">Petunjuk: {question.hint}</p>}
      </div>

      <div className="bg-sky-50 rounded-xl p-4 min-h-[64px] flex items-center justify-center gap-2 flex-wrap">
        {userWord.length === 0 ? (
          <span className="text-muted-foreground text-sm">Pilih huruf di bawah...</span>
        ) : (
          userWord.map((letter, i) => (
            <button
              key={i}
              onClick={() => removeLetter(i)}
              disabled={revealed}
              className={`w-10 h-10 rounded-lg font-bold text-lg transition-all btn-bounce ${
                revealed
                  ? isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  : 'bg-white border-2 border-sky-400 text-sky-700 hover:bg-sky-100 shadow-sm'
              }`}
            >
              {letter}
            </button>
          ))
        )}
      </div>

      <div className="flex items-center flex-wrap gap-2 justify-center">
        {shuffled.map((letter, i) => (
          <button
            key={i}
            onClick={() => addLetter(i)}
            disabled={revealed}
            className="w-10 h-10 bg-white border-2 border-gray-200 rounded-lg font-bold text-gray-700 hover:border-sky-400 hover:bg-sky-50 transition-all btn-bounce text-lg shadow-sm disabled:opacity-40"
          >
            {letter}
          </button>
        ))}
      </div>

      {!revealed && userWord.length > 0 && (
        <div className="text-center">
          <button onClick={resetWord} className="text-sm text-muted-foreground hover:text-sky-600 flex items-center gap-1 mx-auto">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      )}

      {revealed && (
        <div className={`text-center p-3 rounded-xl font-bold ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isCorrect ? 'Benar!' : `Jawaban: ${word}`}
        </div>
      )}
    </div>
  );
}
