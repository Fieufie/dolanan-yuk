'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, QuestionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Sparkles, Puzzle, Zap, Star, Music, Image, Plus, X, Save, Upload, Loader2 } from 'lucide-react';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(editQuestion?.image_url || null);
  const [imageEffect, setImageEffect] = useState<string>(editQuestion?.image_effect || 'none');
  const [puzzlePieces, setPuzzlePieces] = useState(editQuestion?.puzzle_pieces || 36);
  const [mathExpression, setMathExpression] = useState(editQuestion?.math_expression || '');
  const [points, setPoints] = useState(editQuestion?.points || 100);
  const [timeLimit, setTimeLimit] = useState(editQuestion?.time_limit || 30);
  const [hint, setHint] = useState(editQuestion?.hint || '');
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const localURL = URL.createObjectURL(file);
    setPreviewUrl(localURL);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const path = `uploads/${fileName}`;

      const { data, error } = await supabase.storage.from('game-assets').upload(path, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('game-assets').getPublicUrl(data.path);
      setImageUrl(urlData.publicUrl);
      setPreviewUrl(urlData.publicUrl);
    } catch (err: any) {
      alert("Gagal upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const questionData = {
      session_id: sessionId,
      type,
      question_text: questionText,
      options: type === 'multiple_choice' ? options.filter(o => o !== '') : null,
      correct_answer: correctAnswer,
      image_url: imageUrl || null,
      image_effect: imageEffect,
      puzzle_pieces: puzzlePieces,
      math_expression: mathExpression || null,
      media_url: mediaUrl || null,
      points,
      time_limit: timeLimit,
      hint: hint || null
    };

    try {
      const { error } = editQuestion?.id 
        ? await supabase.from('questions').update(questionData).eq('id', editQuestion.id)
        : await supabase.from('questions').insert([questionData]);

      if (error) throw error;
      onSaved();
    } catch (err: any) {
      alert("Gagal simpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pilih Tipe */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {questionTypes.map((qt) => (
          <button key={qt.value} onClick={() => setType(qt.value as QuestionType)}
            className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-2 transition-all ${type === qt.value ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-gray-100 text-gray-500'}`}>
            <qt.icon className="w-5 h-5" /> {qt.label}
          </button>
        ))}
      </div>

      {/* Konten Berdasarkan Tipe */}
      <div className="space-y-4 pt-4 border-t">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Pertanyaan / Judul</Label>
          <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Tuliskan pertanyaan di sini..." />
        </div>

        {/* Math Game */}
        {type === 'math_game' && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Ekspresi Matematika (Contoh: 12 + 5)</Label>
            <Input value={mathExpression} onChange={(e) => setMathExpression(e.target.value)} placeholder="12 + 5" />
          </div>
        )}

        {/* Puzzle & Tebak Gambar */}
        {(type === 'puzzle' || type === 'image_guess') && (
          <div className="p-4 bg-sky-50 rounded-xl space-y-3">
             <Label className="text-sm font-medium">Gambar (Upload/URL)</Label>
             <div className="flex gap-2">
                <Input value={imageUrl} onChange={(e) => {setImageUrl(e.target.value); setPreviewUrl(e.target.value);}} placeholder="http://..." className="bg-white" />
                <Button type="button" variant="outline" className="bg-white" onClick={() => document.getElementById('up-img')?.click()}>
                   <Upload className="w-4 h-4 mr-2" /> {uploading ? '...' : 'Pilih'}
                </Button>
                <input id="up-img" type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
             </div>
             {previewUrl && <img src={previewUrl} className="w-full h-32 object-contain bg-white rounded-lg border" />}
             
             {type === 'image_guess' && (
                <div className="pt-2">
                   <Label className="text-xs">Efek Gambar</Label>
                   <Select value={imageEffect} onValueChange={setImageEffect}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="none">Normal</SelectItem>
                         <SelectItem value="blur">Blur (Kabur)</SelectItem>
                         <SelectItem value="crop">Potong (Hanya sebagian)</SelectItem>
                         <SelectItem value="grayscale">Hitam Putih</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             )}
          </div>
        )}

        {/* Input Jawaban */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Jawaban Benar</Label>
          <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Kunci jawaban..." />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || uploading} className="w-full py-6 gradient-rose text-white font-bold">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan Soal
      </Button>
    </div>
  );
}
