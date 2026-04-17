'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, QuestionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Sparkles, Puzzle, Zap, Star, Music, Image, Plus, X, Save, Upload } from 'lucide-react';

interface Props {
  sessionId: string;
  onSaved: () => void;
  editQuestion?: Question | null;
}

const questionTypes = [
  { value: 'multiple_choice', label: 'Pilihan Ganda', icon: Brain, color: 'text-sky-600' },
  { value: 'word_guess', label: 'Tebak Kata', icon: Sparkles, color: 'text-amber-500' },
  { value: 'puzzle', label: 'Puzzle Gambar', icon: Puzzle, color: 'text-sky-500' },
  { value: 'memory_game', label: 'Memory Game', icon: Zap, color: 'text-green-500' },
  { value: 'math_game', label: 'Math Game', icon: Star, color: 'text-orange-500' },
  { value: 'song_guess', label: 'Tebak Lagu', icon: Music, color: 'text-pink-500' },
  { value: 'image_guess', label: 'Tebak Gambar', icon: Image, color: 'text-purple-500' },
];

export default function QuestionBuilder({ sessionId, onSaved, editQuestion }: Props) {
  const [type, setType] = useState<QuestionType>(editQuestion?.type || 'multiple_choice');
  const [questionText, setQuestionText] = useState(editQuestion?.question_text || '');
  const [options, setOptions] = useState<string[]>(editQuestion?.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(editQuestion?.correct_answer || '');
  const [mediaUrl, setMediaUrl] = useState(editQuestion?.media_url || '');
  const [imageUrl, setImageUrl] = useState(editQuestion?.image_url || '');
  const [imageEffect, setImageEffect] = useState<string>(editQuestion?.image_effect || 'none');
  const [puzzlePieces, setPuzzlePieces] = useState(editQuestion?.puzzle_pieces || 36);
  const [mathExpression, setMathExpression] = useState(editQuestion?.math_expression || '');
  const [points, setPoints] = useState(editQuestion?.points || 100);
  const [timeLimit, setTimeLimit] = useState(editQuestion?.time_limit || 30);
  const [hint, setHint] = useState(editQuestion?.hint || '');
  const [memoryPairs, setMemoryPairs] = useState<Array<{ value: string; image_url?: string }>>(
    editQuestion?.memory_cards ? (editQuestion.memory_cards as any[]).filter((_: any, i: number) => i % 2 === 0) : [{ value: '' }, { value: '' }]
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (file: File, field: 'media' | 'image') => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `uploads/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('game-media').upload(path, file);
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('game-media').getPublicUrl(data.path);
      if (field === 'media') setMediaUrl(urlData.publicUrl);
      else setImageUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const memoryCards = memoryPairs.flatMap((pair) => [
      { id: `${Date.now()}-a`, value: pair.value, image_url: pair.image_url },
      { id: `${Date.now()}-b`, value: pair.value, image_url: pair.image_url },
    ]);

    const questionData: Partial<Question> = {
      session_id: sessionId,
      type,
      question_text: questionText,
      options: type === 'multiple_choice' ? options.filter(Boolean) : undefined,
      correct_answer: correctAnswer || undefined,
      media_url: mediaUrl || undefined,
      media_type: mediaUrl ? (type === 'song_guess' ? 'audio' : 'video') : undefined,
      image_url: imageUrl || undefined,
      image_effect: imageEffect as any,
      puzzle_pieces: puzzlePieces,
      memory_cards: type === 'memory_game' ? memoryCards as any : undefined,
      math_expression: type === 'math_game' ? mathExpression : undefined,
      points,
      time_limit: timeLimit,
      hint: hint || undefined,
    };

    if (editQuestion?.id) {
      await supabase.from('questions').update(questionData).eq('id', editQuestion.id);
    } else {
      await supabase.from('questions').insert(questionData);
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-medium mb-2 block">Tipe Soal</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {questionTypes.map((qt) => (
            <button
              key={qt.value}
              type="button"
              onClick={() => setType(qt.value as QuestionType)}
              className={`p-3 rounded-xl border-2 text-xs font-medium transition-all flex items-center gap-2 ${
                type === qt.value
                  ? 'border-sky-400 bg-sky-50 text-sky-700'
                  : 'border-gray-200 hover:border-sky-200 text-gray-600'
              }`}
            >
              <qt.icon className={`w-4 h-4 ${type === qt.value ? 'text-sky-600' : qt.color}`} />
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {type !== 'memory_game' && type !== 'math_game' && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {type === 'puzzle' ? 'Deskripsi Puzzle' : type === 'song_guess' ? 'Petunjuk Lagu' : 'Pertanyaan'}
          </Label>
          <Textarea
            placeholder="Masukkan pertanyaan atau petunjuk..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="border-sky-100 focus-visible:ring-sky-300 min-h-[80px]"
          />
        </div>
      )}

      {type === 'multiple_choice' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Pilihan Jawaban</Label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrectAnswer(opt)}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  correctAnswer === opt && opt !== ''
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 text-gray-400 hover:border-sky-400'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </button>
              <Input
                placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={(e) => {
                  const updated = [...options];
                  updated[i] = e.target.value;
                  setOptions(updated);
                }}
                className="border-sky-100 focus-visible:ring-sky-300"
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Klik huruf di sebelah kiri untuk pilih jawaban benar</p>
          {options.length < 6 && (
            <Button type="button" variant="ghost" size="sm" className="text-sky-600"
              onClick={() => setOptions([...options, ''])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Pilihan
            </Button>
          )}
        </div>
      )}

      {type === 'word_guess' && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Kata yang Harus Ditebak</Label>
          <Input
            placeholder="Contoh: KUCING"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value.toUpperCase())}
            className="border-sky-100 focus-visible:ring-sky-300 font-mono tracking-widest text-center"
          />
          <p className="text-xs text-muted-foreground">Huruf akan diacak untuk peserta</p>
        </div>
      )}

      {type === 'math_game' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Soal Matematika</Label>
            <Input
              placeholder="Contoh: 15 + 27 = ?"
              value={mathExpression}
              onChange={(e) => setMathExpression(e.target.value)}
              className="border-sky-100 focus-visible:ring-sky-300 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Jawaban Benar</Label>
            <Input
              placeholder="Contoh: 42"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="border-sky-100 focus-visible:ring-sky-300 font-mono"
            />
          </div>
        </div>
      )}

      {(type === 'puzzle' || type === 'image_guess') && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Gambar</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL gambar atau upload file"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="border-sky-100 focus-visible:ring-sky-300"
              />
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="border-sky-200 text-sky-600" asChild>
                  <span>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {uploading ? '...' : 'Upload'}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                />
              </label>
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl mt-2 border border-sky-100" />
            )}
          </div>

          {type === 'image_guess' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Efek Gambar</Label>
              <Select value={imageEffect} onValueChange={setImageEffect}>
                <SelectTrigger className="border-sky-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Efek</SelectItem>
                  <SelectItem value="blur">Blur (Kabur)</SelectItem>
                  <SelectItem value="crop">Crop (Potongan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'puzzle' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Jumlah Kepingan Puzzle</Label>
              <div className="flex gap-2 flex-wrap">
                {[36, 49, 64, 81, 100].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPuzzlePieces(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                      puzzlePieces === n ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-gray-200 hover:border-sky-200'
                    }`}
                  >
                    {n} kepingan
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {type === 'song_guess' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Audio / Video Lagu</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL audio/video atau upload file"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="border-sky-100 focus-visible:ring-sky-300"
              />
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="border-sky-200 text-sky-600" asChild>
                  <span>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {uploading ? '...' : 'Upload'}
                  </span>
                </Button>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'media')}
                />
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Jawaban (Judul Lagu)</Label>
            <Input
              placeholder="Nama lagu yang harus ditebak"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="border-sky-100 focus-visible:ring-sky-300"
            />
          </div>
        </div>
      )}

      {type === 'memory_game' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Pasangan Kartu</Label>
          {memoryPairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-sky-50 rounded-xl">
                <Input
                  placeholder={`Pasangan ${i + 1} (kata/emoji)`}
                  value={pair.value}
                  onChange={(e) => {
                    const updated = [...memoryPairs];
                    updated[i] = { ...updated[i], value: e.target.value };
                    setMemoryPairs(updated);
                  }}
                  className="border-sky-100 focus-visible:ring-sky-300"
                />
              </div>
              {memoryPairs.length > 2 && (
                <Button type="button" variant="ghost" size="sm" className="text-red-400"
                  onClick={() => setMemoryPairs(memoryPairs.filter((_, j) => j !== i))}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {memoryPairs.length < 8 && (
            <Button type="button" variant="ghost" size="sm" className="text-sky-600"
              onClick={() => setMemoryPairs([...memoryPairs, { value: '' }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Pasangan
            </Button>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Petunjuk (opsional)</Label>
        <Input
          placeholder="Petunjuk untuk membantu peserta..."
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          className="border-sky-100 focus-visible:ring-sky-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Poin</Label>
          <Input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            min={10}
            max={1000}
            step={10}
            className="border-sky-100 focus-visible:ring-sky-300"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Waktu (detik)</Label>
          <Input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            min={5}
            max={300}
            step={5}
            className="border-sky-100 focus-visible:ring-sky-300"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gradient-rose text-white border-0 shadow-md hover:opacity-90">
        {saving ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Menyimpan...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Simpan Soal
          </span>
        )}
      </Button>
    </div>
  );
}
