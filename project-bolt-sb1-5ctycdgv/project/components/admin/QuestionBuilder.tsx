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

  const handleFileUpload = async (file: File, field: 'media' | 'image') => {
    if (!file) return;
    setUploading(true);
    
    // Tampilkan preview lokal agar user senang
    const localURL = URL.createObjectURL(file);
    if (field === 'image') setPreviewUrl(localURL);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const path = `questions/${fileName}`;

      const { data, error } = await supabase.storage
        .from('game-assets') // Pastikan nama bucket ini benar di Supabase
        .upload(path, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('game-assets').getPublicUrl(data.path);
      
      if (field === 'media') setMediaUrl(urlData.publicUrl);
      else {
        setImageUrl(urlData.publicUrl);
        setPreviewUrl(urlData.publicUrl);
      }
    } catch (err: any) {
      alert("Gagal upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);

    const questionData = {
      session_id: sessionId,
      type,
      question_text: questionText,
      options: type === 'multiple_choice' ? options.filter(opt => opt !== '') : null,
      correct_answer: correctAnswer,
      media_url: mediaUrl || null,
      image_url: imageUrl || null,
      image_effect: imageEffect,
      puzzle_pieces: puzzlePieces,
      math_expression: mathExpression || null,
      points,
      time_limit: timeLimit,
      hint: hint || null,
    };

    try {
      let error;
      if (editQuestion?.id) {
        const { error: err } = await supabase.from('questions').update(questionData).eq('id', editQuestion.id);
        error = err;
      } else {
        const { error: err } = await supabase.from('questions').insert([questionData]);
        error = err;
      }

      if (error) throw error;
      
      // Reset form jika berhasil
      setQuestionText('');
      setCorrectAnswer('');
      setImageUrl('');
      setPreviewUrl(null);
      
      onSaved(); // Refresh daftar soal
    } catch (err: any) {
      alert("Gagal simpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-4 rounded-2xl border border-sky-50 shadow-sm">
      {/* TIPE SOAL - Ikon Cantik */}
      <div>
        <Label className="text-sm font-bold mb-3 block text-sky-900">Pilih Jenis Permainan</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {questionTypes.map((qt) => (
            <button
              key={qt.value}
              type="button"
              onClick={() => setType(qt.value as QuestionType)}
              className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all flex flex-col items-center gap-2 ${
                type === qt.value
                  ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-inner'
                  : 'border-gray-100 hover:border-sky-200 text-gray-500'
              }`}
            >
              <qt.icon className={`w-5 h-5 ${type === qt.value ? 'text-sky-600' : qt.color}`} />
              {qt.label}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT UTAMA */}
      <div className="space-y-4 pt-4 border-t border-gray-50">
        {type !== 'math_game' && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Pertanyaan / Petunjuk</Label>
            <Textarea
              placeholder="Apa yang harus dilakukan peserta?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="border-sky-100 focus-visible:ring-sky-300 min-h-[80px]"
            />
          </div>
        )}

        {/* KHUSUS PILIHAN GANDA */}
        {type === 'multiple_choice' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pilihan Jawaban (Klik huruf untuk kunci jawaban)</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(opt)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-colors ${
                    correctAnswer === opt && opt !== ''
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-200 text-gray-400'
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <Input
                  placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[i] = e.target.value;
                    setOptions(updated);
                  }}
                  className="border-sky-50"
                />
              </div>
            ))}
          </div>
        )}

        {/* KHUSUS PUZZLE & TEBAK GAMBAR */}
        {(type === 'puzzle' || type === 'image_guess') && (
          <div className="space-y-3 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
            <Label className="text-sm font-medium">Upload Gambar Kuis</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL Gambar..."
                value={imageUrl}
                onChange={(e) => {setImageUrl(e.target.value); setPreviewUrl(e.target.value);}}
                className="bg-white"
              />
              <label className="cursor-pointer">
                <Button type="button" variant="outline" className="bg-white border-sky-200 text-sky-600">
                  <Upload className="w-4 h-4 mr-2" /> {uploading ? '...' : 'Pilih'}
                </Button>
                <input type="file" accept="image/*" className="hidden" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} 
                />
              </label>
            </div>
            {previewUrl && (
              <div className="mt-2 relative group">
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-contain rounded-lg border bg-white" />
                <button onClick={() => {setPreviewUrl(null); setImageUrl('');}} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-4 h-4"/></button>
              </div>
            )}
            {type === 'puzzle' && (
               <div className="mt-2">
                <Label className="text-xs">Jumlah Kepingan: {puzzlePieces}</Label>
                <select className="w-full text-sm p-2 rounded-lg mt-1" value={puzzlePieces} onChange={(e)=>setPuzzlePieces(Number(e.target.value))}>
                  <option value={36}>36 Keping (Mudah)</option>
                  <option value={64}>64 Keping (Sedang)</option>
                  <option value={100}>100 Keping (Sulit)</option>
                </select>
               </div>
            )}
          </div>
        )}

        {/* KHUSUS TEBAK LAGU */}
        {type === 'song_guess' && (
          <div className="space-y-3 bg-pink-50/30 p-4 rounded-xl border border-pink-100">
            <Label className="text-sm font-medium">Audio Lagu</Label>
            <Input
              placeholder="Masukkan link audio atau upload"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="bg-white"
            />
            <Input
              placeholder="Judul Lagu (Jawaban Benar)"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="bg-white"
            />
          </div>
        )}
      </div>

      {/* TOMBOL SIMPAN */}
      <Button 
        onClick={handleSave} 
        disabled={saving || uploading} 
        className="w-full py-6 gradient-rose text-white border-0 shadow-lg hover:opacity-90 transition-all font-bold text-lg"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
        {editQuestion ? 'Perbarui Soal' : 'Simpan Soal Sekarang'}
      </Button>
    </div>
  );
}
