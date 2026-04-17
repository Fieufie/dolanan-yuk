'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question, MemoryCard } from '@/lib/types';
import { Trophy } from 'lucide-react';

interface Props {
  question: Question;
  onAnswer: (answer: string, timeTaken: number) => void;
  startTime: number;
}

interface Card {
  id: string;
  value: string;
  image_url?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame({ question, onAnswer, startTime }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const sourceCards: MemoryCard[] = question.memory_cards as MemoryCard[] || [
      { id: '1', value: 'A' }, { id: '2', value: 'A' },
      { id: '3', value: 'B' }, { id: '4', value: 'B' },
      { id: '5', value: 'C' }, { id: '6', value: 'C' },
      { id: '7', value: 'D' }, { id: '8', value: 'D' },
    ];

    const shuffled = [...sourceCards].sort(() => Math.random() - 0.5).map((c, i) => ({
      id: `${c.id}-${i}`,
      value: c.value,
      image_url: c.image_url,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(shuffled);
    setFlippedIds([]);
    setMatchCount(0);
  }, [question.id]);

  const handleCardClick = useCallback((id: string) => {
    if (isChecking || flippedIds.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 2) {
      setIsChecking(true);
      const [firstId, secondId] = newFlipped;
      const first = cards.find((c) => c.id === firstId);
      const second = cards.find((c) => c.id === secondId);

      setTimeout(() => {
        if (first?.value === second?.value) {
          const newMatchCount = matchCount + 1;
          setMatchCount(newMatchCount);
          setCards((prev) => prev.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          ));

          const totalPairs = cards.length / 2;
          if (newMatchCount === totalPairs) {
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);
            setTimeout(() => onAnswer('completed', timeTaken), 800);
          }
        } else {
          setCards((prev) => prev.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
          ));
        }
        setFlippedIds([]);
        setIsChecking(false);
      }, 700);
    }
  }, [cards, flippedIds, isChecking, matchCount, startTime, onAnswer]);

  const totalPairs = cards.length / 2;
  const gridCols = cards.length <= 8 ? 'grid-cols-4' : cards.length <= 12 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold">{question.question_text || 'Temukan Semua Pasangan!'}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">{matchCount}/{totalPairs} pasangan</span>
        </div>
      </div>

      <div className={`grid ${gridCols} gap-2`}>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || isChecking}
            className={`aspect-square rounded-xl font-bold text-lg transition-all duration-300 btn-bounce ${
              card.isMatched
                ? 'bg-green-100 border-2 border-green-400 text-green-600'
                : card.isFlipped
                ? 'bg-sky-50 border-2 border-sky-400 text-sky-700'
                : 'bg-gradient-to-br from-sky-400 to-pink-500 text-white shadow-md hover:from-sky-500 hover:to-pink-600'
            }`}
          >
            {(card.isFlipped || card.isMatched) ? (
              card.image_url ? (
                <img src={card.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                card.value
              )
            ) : (
              <span className="text-white/60 text-2xl">?</span>
            )}
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Klik dua kartu untuk mencocokkan!
      </div>
    </div>
  );
}
