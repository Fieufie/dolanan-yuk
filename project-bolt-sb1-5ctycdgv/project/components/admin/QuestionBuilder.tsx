'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, QuestionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Sparkles, Puzzle, Zap, Star, Music, Image, Plus, X, Save, Upload, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  sessionId: string;
  onSaved: () => void;
  editQuestion?: Question | null;
}

const questionTypes = [
  { value: 'multiple_choice', label: 'Pilihan Ganda', icon: Brain, color: 'text-sky-600' },
  { value: 'puzzle', label: 'Puzzle Gambar', icon: Puzzle, color: 'text-sky-500' },
  { value: 'song_guess', label: 'Tebak Lagu', icon: Music, color: 'text-pink-500' },
  { value: 'image_guess', label: 'Tebak Gambar', icon: Image, color: 'text-purple-500' },
  { value: 'math_game', label: 'Math Game', icon: Star, color: 'text-orange-500' },
  { value: 'word_guess', label: 'Tebak Kata', icon: Sparkles, color: 'text-amber-500' },
];

export default function QuestionBuilder({ sessionId, onSaved, editQuestion }: Props) {
  const [type, setType] = useState<QuestionType>(editQuestion?.type || 'multiple_choice');
  const [questionText, setQuestionText] = useState(editQuestion?.question_text || '');
  const [options, setOptions] = useState<string[]>(editQuestion?.options || ['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(editQuestion?.correct_answer || '');
  const [imageUrl, setImageUrl] = useState(editQuestion?.image_url || '');
  const [mediaUrl, setMediaUrl] = useState(editQuestion?.media_url || '');
  const [puzzlePieces, setPuzzlePieces] = useState(editQuestion?.puzzle_pieces || 36);
  const [previewUrl, setPreviewUrl] = useState<string | null>(editQuestion?.image_url || null);
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage.from('game-assets').upload(`uploads/${fileName}`, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('game-assets').getPublicUrl(data.path);
      setImageUrl(urlData.publicUrl);
      setPreviewUrl(urlData.publicUrl);
    } catch (err: any) { alert("Gagal upload: " + err.message); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      session_id: sessionId,
      type,
      question_text: questionText,
      options: type === 'multiple_choice' ? options.filter(o => o !== '') : null,
      correct_answer: (type === 'puzzle' || type === 'image_guess') ? 'COMPLETED' : correctAnswer,
      image_url: imageUrl || null,
      media_url: mediaUrl || null,
      puzzle_pieces: puzzlePieces,
      points: 100,
      time_limit: 60
    };

    try {
      const { error } = editQuestion?.id 
        ? await supabase.from('questions').update(data).eq('id', editQuestion.id)
        : await supabase.from('questions').insert([data]);
      if (error) throw error;
      onSaved();
    } catch (err: any) { alert("Gagal simpan: " + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border shadow-sm">
      {/* Pilih Tipe Game */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {questionTypes.map((qt) => (
          <button key={qt.value} onClick={() => setType(qt.value as QuestionType)}
            className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center gap-3 transition-all ${type === qt.value ? 'border-sky-500 bg-sky-50' : 'border-gray-100'}`}>
            <qt.icon className="w-5 h-5" /> {qt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <Label className="text-sm font-bold">Instruksi / Pertanyaan</Label>
        <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Tuliskan instruksi game..." />

        {/* LOGIC PILIHAN GANDA */}
        {type === 'multiple_choice' && (
          <div className="space-y-3">
            <Label className="text-sm font-bold text-sky-700">Opsi Jawaban (Centang yang benar)</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <button onClick={() => setCorrectAnswer(opt)} 
                  className={`p-2 rounded-full ${correctAnswer === opt && opt !== '' ? 'text-green-500' : 'text-gray-300'}`}>
                  <CheckCircle2 className="w-6 h-6" />
                </button>
                <Input value={opt} onChange={(e) => {
                  const newOpt = [...options];
                  newOpt[i] = e.target.value;
                  setOptions(newOpt);
                }} placeholder={`Pilihan ${i+1}`} />
              </div>
            ))}
          </div>
        )}

        {/* LOGIC PUZZLE & GAMBAR */}
        {(type === 'puzzle' || type === 'image_guess') && (
          <div className="p-4 bg-sky-50 rounded-xl space-y-4">
            <Label className="font-bold">Media Gambar</Label>
            <div className="flex gap-2">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL Gambar..." />
              <Button onClick={() => document.getElementById('up')?.click()} variant="outline" className="bg-white">
                <Upload className="w-4 h-4 mr-2" /> {uploading ? '...' : 'Upload'}
              </Button>
              <input id="up" type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </div>
            {previewUrl && <img src={previewUrl} className="w-full h-40 object-contain bg-white rounded-lg" />}
            
            {type === 'puzzle' && (
              <div className="space-y-2">
                <Label className="text-xs">Jumlah Kepingan</Label>
                <select className="w-full p-2 rounded-lg border" value={puzzlePieces} onChange={(e) => setPuzzlePieces(Number(e.target.value))}>
                  <option value={36}>36 Keping (Mudah)</option>
                  <option value={64}>64 Keping</option>
                  <option value={100}>100 Keping</option>
                  <option value={144}>144 Keping (Sulit)</option>
                </select>
                <p className="text-[10px] text-sky-600">*Fitur Hint & Timer otomatis aktif saat game dimulai</p>
              </div>
            )}
          </div>
        )}

        {/* LOGIC TEBAK LAGU */}
        {type === 'song_guess' && (
          <div className="space-y-3 p-4 bg-pink-50 rounded-xl">
             <Label className="font-bold">Link Audio (MP3/URL)</Label>
             <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://link-lagu.mp3" />
             <Label className="font-bold">Judul Lagu (Kunci Jawaban)</Label>
             <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Kunci jawaban..." />
          </div>
        )}

        {/* Kunci Jawaban (Hanya untuk yang butuh) */}
        {type !== 'puzzle' && type !== 'image_guess' && type !== 'multiple_choice' && type !== 'song_guess' && (
           <div className="space-y-1.5">
             <Label className="font-bold">Kunci Jawaban</Label>
             <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Jawaban yang benar..." />
           </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving || uploading} className="w-full py-6 gradient-rose text-white font-bold text-lg">
        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
        Simpan Game Sekarang
      </Button>
    </div>
  );
}
