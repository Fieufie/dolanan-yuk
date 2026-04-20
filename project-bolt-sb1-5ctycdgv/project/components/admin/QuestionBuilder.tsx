'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, QuestionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Sparkles, Puzzle, Zap, Star, Music, Image, Plus, X, Save, Upload, Loader2, CheckCircle2, Video } from 'lucide-react';

interface Props {
  sessionId: string;
  onSaved: () => void;
  editQuestion?: Question | null;
}

const questionTypes = [
  { value: 'multiple_choice', label: 'Pilihan Ganda', icon: Brain, color: 'text-sky-600' },
  { value: 'puzzle', label: 'Puzzle Gambar', icon: Puzzle, color: 'text-sky-500' },
  { value: 'image_guess', label: 'Tebak Gambar', icon: Image, color: 'text-purple-500' },
  { value: 'song_guess', label: 'Tebak Lagu/Video', icon: Music, color: 'text-pink-500' },
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
  const [mediaType, setMediaType] = useState(editQuestion?.media_type || 'audio');
  const [imageEffect, setImageEffect] = useState(editQuestion?.image_effect || 'none');
  const [puzzlePieces, setPuzzlePieces] = useState(editQuestion?.puzzle_pieces || 36);
  const [previewUrl, setPreviewUrl] = useState<string | null>(editQuestion?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset gambar jika pindah tipe game agar tidak campur aduk
  useEffect(() => {
    if (!editQuestion) {
      setImageUrl('');
      setPreviewUrl(null);
      setMediaUrl('');
    }
  }, [type]);

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
      image_effect: imageEffect,
      media_url: mediaUrl || null,
      media_type: mediaType,
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
      {/* Tipe Game */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {questionTypes.map((qt) => (
          <button key={qt.value} onClick={() => setType(qt.value as QuestionType)}
            className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center gap-2 transition-all ${type === qt.value ? 'border-sky-500 bg-sky-50' : 'border-gray-100'}`}>
            <qt.icon className="w-5 h-5" /> {qt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <Label className="text-sm font-bold">Instruksi Game</Label>
        <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Tulis instruksi untuk pemain..." />

        {/* PILIHAN GANDA */}
        {type === 'multiple_choice' && (
          <div className="space-y-3">
            <Label className="text-sm font-bold text-sky-700">Pilihan Jawaban (Centang yang benar)</Label>
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
                }} placeholder={`Opsi ${String.fromCharCode(65+i)}`} />
              </div>
            ))}
          </div>
        )}

        {/* PUZZLE & TEBAK GAMBAR */}
        {(type === 'puzzle' || type === 'image_guess') && (
          <div className="p-4 bg-sky-50 rounded-xl space-y-4">
            <Label className="font-bold">Gambar Kuis</Label>
            <div className="flex gap-2">
              <Input value={imageUrl} onChange={(e) => {setImageUrl(e.target.value); setPreviewUrl(e.target.value);}} placeholder="URL Gambar..." />
              <Button onClick={() => document.getElementById('up')?.click()} variant="outline" className="bg-white">
                <Upload className="w-4 h-4 mr-2" /> {uploading ? '...' : 'Pilih'}
              </Button>
              <input id="up" type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </div>

            {previewUrl && (
              <div className="relative mt-2">
                <img src={previewUrl} className="w-full h-40 object-contain bg-white rounded-lg border shadow-inner" />
                <button onClick={() => {setPreviewUrl(null); setImageUrl('');}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                   <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {type === 'image_guess' && (
               <div className="space-y-2">
                  <Label className="text-xs">Efek Gambar</Label>
                  <Select value={imageEffect} onValueChange={setImageEffect}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="none">Normal</SelectItem>
                       <SelectItem value="blur">Blur (Kabur)</SelectItem>
                       <SelectItem value="crop">Potong (Hanya Sebagian)</SelectItem>
                       <SelectItem value="grayscale">Hitam Putih</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            )}

            {type === 'puzzle' && (
              <div className="space-y-2">
                <Label className="text-xs">Potongan Puzzle</Label>
                <Select value={puzzlePieces.toString()} onValueChange={(v) => setPuzzlePieces(Number(v))}>
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="36">36 Potongan (Mudah)</SelectItem>
                    <SelectItem value="64">64 Potongan</SelectItem>
                    <SelectItem value="100">100 Potongan</SelectItem>
                    <SelectItem value="144">144 Potongan (Sulit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* TEBAK LAGU / VIDEO */}
        {type === 'song_guess' && (
          <div className="space-y-3 p-4 bg-pink-50 rounded-xl">
             <Label className="font-bold">Media Lagu/Video</Label>
             <div className="flex gap-2 mb-2">
                <Button onClick={() => setMediaType('audio')} variant={mediaType === 'audio' ? 'default' : 'outline'} className="flex-1">
                   <Music className="w-4 h-4 mr-2" /> Audio
                </Button>
                <Button onClick={() => setMediaType('video')} variant={mediaType === 'video' ? 'default' : 'outline'} className="flex-1">
                   <Video className="w-4 h-4 mr-2" /> Video
                </Button>
             </div>
             <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Link URL (MP3/MP4/YouTube)" />
             <Label className="font-bold">Kunci Jawaban (Judul Lagu)</Label>
             <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Tulis judul lagu..." />
          </div>
        )}

        {/* KUNCI JAWABAN LAINNYA */}
        {type !== 'puzzle' && type !== 'image_guess' && type !== 'multiple_choice' && type !== 'song_guess' && (
           <div className="space-y-1.5">
             <Label className="font-bold">Kunci Jawaban</Label>
             <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Jawaban yang benar..." />
           </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving || uploading} className="w-full py-6 gradient-rose text-white font-bold text-lg">
        {saving ? "Menyimpan..." : "Simpan Soal Sekarang"}
      </Button>
    </div>
  );
}
