'use client';

import { useState, useRef, useEffect } from 'react';
import { Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, Volume2, Check, X, Music } from 'lucide-react';

interface Props {
  question: Question;
  onAnswer: (answer: string, timeTaken: number) => void;
  startTime: number;
}

export default function SongGuess({ question, onAnswer, startTime }: Props) {
  const [playing, setPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isVideo = question.media_url?.match(/\.(mp4|webm|mov|avi)/i) ||
    question.media_type === 'video';

  useEffect(() => {
    setUserAnswer('');
    setRevealed(false);
    setPlaying(false);
    setProgress(0);
  }, [question.id]);

  const togglePlay = () => {
    const media = audioRef.current || videoRef.current;
    if (!media) return;
    if (playing) {
      media.pause();
    } else {
      media.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    const media = audioRef.current || videoRef.current;
    if (!media || !media.duration) return;
    setProgress((media.currentTime / media.duration) * 100);
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
        <h2 className="text-lg font-bold">{question.question_text || 'Tebak Lagu Ini!'}</h2>
        {question.hint && <p className="text-sm text-muted-foreground mt-1">Petunjuk: {question.hint}</p>}
      </div>

      {question.media_url ? (
        <div className="bg-gradient-to-br from-sky-50 to-pink-50 rounded-2xl p-6 border border-sky-100">
          {isVideo ? (
            <video
              ref={videoRef}
              src={question.media_url}
              className="w-full rounded-xl max-h-48 object-cover"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <audio
              ref={audioRef}
              src={question.media_url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setPlaying(false)}
            />
          )}

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 gradient-rose rounded-full flex items-center justify-center text-white shadow-md btn-bounce"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-sky-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <Volume2 className="w-3 h-3 text-sky-400" />
                <span className="text-xs text-muted-foreground">
                  {playing ? 'Sedang diputar...' : 'Tekan play'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-sky-50 rounded-2xl p-8 text-center border border-sky-100">
          <Music className="w-12 h-12 text-sky-300 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">File audio tidak tersedia</p>
        </div>
      )}

      <div className="space-y-3">
        <Input
          placeholder="Ketik nama lagu..."
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
