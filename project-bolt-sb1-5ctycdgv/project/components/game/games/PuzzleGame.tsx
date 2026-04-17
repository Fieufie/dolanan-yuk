'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RotateCcw, CircleCheck as CheckCircle, Lightbulb, Download, Share2, Clock, X, Trophy, Gamepad2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  question: Question;
  onAnswer: (answer: string, timeTaken: number) => void;
  startTime: number;
}

interface Piece {
  id: string;
  index: number;
  correctIndex: number;
}

function PuzzlePiece({ id, imageUrl, cols, correctIndex, size }: {
  id: string;
  imageUrl: string;
  cols: number;
  correctIndex: number;
  size: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const col = correctIndex % cols;
  const row = Math.floor(correctIndex / cols);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: size,
    height: size,
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${cols * size}px ${cols * size}px`,
    backgroundPosition: `-${col * size}px -${row * size}px`,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="puzzle-piece border border-white/40 cursor-grab active:cursor-grabbing select-none"
    />
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m > 0 ? `${m}m ` : ''}${s}s`;
}

export default function PuzzleGame({ question, onAnswer, startTime }: Props) {
  const pieces = question.puzzle_pieces || 36;
  const [difficulty, setDifficulty] = useState(pieces);
  const cols = Math.sqrt(difficulty);
  const pieceSize = Math.floor(300 / cols);

  const [order, setOrder] = useState<Piece[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const puzzleStartRef = useRef<number>(Date.now());

  const initPuzzle = useCallback((numPieces: number) => {
    const arr = Array.from({ length: numPieces }, (_, i) => ({
      id: `piece-${i}`,
      index: i,
      correctIndex: i,
    }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setSolved(false);
    setShowHint(false);
    setElapsedSeconds(0);
    puzzleStartRef.current = Date.now();
  }, []);

  useEffect(() => {
    initPuzzle(difficulty);
  }, [question.id, difficulty]);

  useEffect(() => {
    if (solved) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - puzzleStartRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [solved, difficulty]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = order.findIndex((p) => p.id === active.id);
    const newIndex = order.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...order];
    [newOrder[oldIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[oldIndex]];
    setOrder(newOrder);

    const isSolved = newOrder.every((p, i) => p.correctIndex === i);
    if (isSolved) {
      const elapsed = Math.floor((Date.now() - puzzleStartRef.current) / 1000);
      setFinalTime(elapsed);
      setSolved(true);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setTimeout(() => {
        setShowShareCard(true);
        onAnswer('solved', timeTaken);
      }, 600);
    }
  };

  const handleHint = () => {
    setShowHint(true);
    setHintCount((c) => c + 1);
    setTimeout(() => setShowHint(false), 3000);
  };

  const activePiece = order.find((p) => p.id === activeId);
  const activeCols = Math.sqrt(difficulty);
  const activePieceSize = Math.floor(300 / activeCols);

  const handleDownload = () => {
    const card = shareCardRef.current;
    if (!card || !question.image_url) return;

    const canvas = document.createElement('canvas');
    const W = 400, H = 500;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#fce4ec');
    gradient.addColorStop(1, '#fce7d4');
    ctx.fillStyle = gradient;
    ctx.roundRect(0, 0, W, H, 24);
    ctx.fill();

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgSize = 280;
      const imgX = (W - imgSize) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, 40, imgSize, imgSize, 16);
      ctx.clip();
      ctx.drawImage(img, imgX, 40, imgSize, imgSize);
      ctx.restore();

      ctx.fillStyle = 'rgba(236,72,153,0.9)';
      ctx.roundRect(W / 2 - 80, 335, 160, 36, 18);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Waktu: ${formatTime(finalTime)}`, W / 2, 359);

      ctx.fillStyle = '#374151';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('Puzzle Selesai!', W / 2, 405);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(`${difficulty} kepingan  •  ${hintCount} petunjuk digunakan`, W / 2, 430);

      ctx.fillStyle = 'hsl(340,82%,58%)';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText('DolananYuk!', W / 2, 460);

      const link = document.createElement('a');
      link.download = `puzzle-result-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = question.image_url;
  };

  const handleShare = async () => {
    const text = `Aku baru selesai puzzle di DolananYuk!\n🧩 ${difficulty} kepingan\n⏱ Waktu: ${formatTime(finalTime)}\n💡 Petunjuk: ${hintCount}x\n\nYuk ikutan main! #DolananYuk #IbuProfesionalBanyumasRaya`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Teks hasil disalin! Tempel di WAG atau Instagram Story kamu.');
    }
  };

  if (!question.image_url) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Gambar puzzle tidak tersedia</p>
      </div>
    );
  }

  if (showShareCard) {
    return (
      <div className="space-y-4">
        <div
          ref={shareCardRef}
          className="relative mx-auto rounded-3xl overflow-hidden shadow-2xl"
          style={{ maxWidth: 340 }}
        >
          <div className="absolute inset-0 gradient-soft" />
          <div className="relative p-5">
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-1.5 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                <Trophy className="w-3.5 h-3.5" />
                Puzzle Selesai!
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg mb-4 border-4 border-white">
              <img
                src={question.image_url}
                alt="Solved puzzle"
                className="w-full object-cover"
                style={{ aspectRatio: '1/1' }}
                crossOrigin="anonymous"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-white/80 rounded-xl p-2.5">
                <Clock className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                <p className="text-xs font-black text-rose-600">{formatTime(finalTime)}</p>
                <p className="text-xs text-muted-foreground">Waktu</p>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5">
                <Gamepad2 className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-xs font-black text-amber-600">{difficulty}</p>
                <p className="text-xs text-muted-foreground">Kepingan</p>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5">
                <Lightbulb className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                <p className="text-xs font-black text-sky-600">{hintCount}x</p>
                <p className="text-xs text-muted-foreground">Petunjuk</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-rose-500">DolananYuk!</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={handleDownload}
            className="gradient-rose text-white border-0 hover:opacity-90 flex-1 max-w-[160px]"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Unduh
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 flex-1 max-w-[160px]"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Bagikan
          </Button>
        </div>

        <button
          onClick={() => setShowShareCard(false)}
          className="block mx-auto text-xs text-muted-foreground hover:text-foreground"
        >
          Tutup
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-bold">{question.question_text || 'Susun Puzzle!'}</h2>
        <p className="text-sm text-muted-foreground">Seret kepingan untuk menyusun gambar</p>
      </div>

      <div className="flex items-center justify-between bg-rose-50 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-rose-600 font-bold">
          <Clock className="w-4 h-4" />
          <span className="text-base font-black font-mono">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {[36, 49, 64, 81, 100].map((n) => (
            <button
              key={n}
              onClick={() => { setDifficulty(n); initPuzzle(n); }}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium border-2 transition-colors ${
                difficulty === n ? 'border-rose-400 bg-rose-100 text-rose-700' : 'border-gray-200 bg-white hover:border-rose-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          className="border-amber-200 text-amber-600 hover:bg-amber-50 text-xs"
          onClick={handleHint}
          disabled={showHint}
        >
          <Lightbulb className="w-3.5 h-3.5 mr-1" />
          {showHint ? 'Lihat gambar...' : `Petunjuk ${hintCount > 0 ? `(${hintCount}x)` : ''}`}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs hover:text-rose-500"
          onClick={() => initPuzzle(difficulty)}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Acak Ulang
        </Button>
      </div>

      {showHint && (
        <div className="relative mx-auto rounded-2xl overflow-hidden border-2 border-amber-300 shadow-lg" style={{ maxWidth: 300 }}>
          <img
            src={question.image_url}
            alt="Hint"
            className="w-full object-cover"
            style={{ aspectRatio: '1/1', filter: 'blur(3px) brightness(0.85)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-amber-400 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
              <Lightbulb className="w-4 h-4" />
              Bocoran 3 detik!
            </div>
          </div>
          <button
            onClick={() => setShowHint(false)}
            className="absolute top-2 right-2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={order.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div
            className="grid mx-auto border-2 border-rose-200 rounded-2xl overflow-hidden shadow-lg"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${pieceSize}px)`,
              width: 300,
              height: 300,
            }}
          >
            {order.map((piece) => (
              <PuzzlePiece
                key={piece.id}
                id={piece.id}
                imageUrl={question.image_url!}
                cols={cols}
                correctIndex={piece.correctIndex}
                size={pieceSize}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeId && activePiece && (
            <div
              style={{
                width: activePieceSize,
                height: activePieceSize,
                backgroundImage: `url(${question.image_url})`,
                backgroundSize: `${activeCols * activePieceSize}px ${activeCols * activePieceSize}px`,
                backgroundPosition: `-${(activePiece.correctIndex % activeCols) * activePieceSize}px -${Math.floor(activePiece.correctIndex / activeCols) * activePieceSize}px`,
                border: '2px solid hsl(340, 82%, 58%)',
                borderRadius: '4px',
                boxShadow: '0 10px 30px rgba(236, 72, 153, 0.5)',
              }}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
