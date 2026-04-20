'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, QuestionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Sparkles, Puzzle, Zap, Star, Music, Image, Plus, X, Save, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Asumsi menggunakan sonner/toast untuk feedback

interface Props {
  sessionId: string;
  onSaved: () => void;
  editQuestion?: Question | null;
}

// ... (questionTypes constant tetap sama)

export default function QuestionBuilder({ sessionId, onSaved, editQuestion }: Props) {
  // State Management
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
  
  const [memoryPairs, setMemoryPairs] = useState<Array<{ value: string; image_url?: string }>>(
    editQuestion?.memory_cards 
      ? (editQuestion.memory_cards as any[]).filter((_, i) => i % 2 === 0) 
      : [{ value: '' }, { value: '' }]
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Perbaikan Upload & Preview
  const handleFileUpload = async (file: File, field: 'media' | 'image') => {
    if (!file) return;
    
    // Validasi ukuran (contoh max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File terlalu besar. Maksimal 2MB");
      return;
    }

    setUploading(true);
    
    // Tampilkan preview lokal segera (UX lebih cepat)
    const localPreview = URL.createObjectURL(file);
    if (field === 'image') setPreviewUrl(localPreview);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
      const path = `${sessionId}/${fileName}`;

      // Perbaikan Bucket Name: 'game-assets'
      const { data, error } = await supabase.storage
        .from('game-assets')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('game-assets').getPublicUrl(data.path);
      
      if (field === 'media') setMediaUrl(urlData.publicUrl);
      else setImageUrl(urlData.publicUrl);
      
      toast.success("Upload berhasil");
    } catch (error: any) {
      toast.error("Upload gagal: " + error.message);
      setPreviewUrl(editQuestion?.image_url || null); // Revert preview jika gagal
    } finally {
      setUploading(false);
    }
  };

  // 2. Perbaikan Logic Simpan
  const handleSave = async () => {
    // Validasi dasar
    if (!questionText && type !== 'math_game' && type !== 'memory_game') {
      toast.error("Pertanyaan wajib diisi");
      return;
    }

    setSaving(true);
    try {
      // Logic ID unik untuk memory cards
      const memoryCards = memoryPairs.flatMap((pair, idx) => [
        { id: `card-${idx}-a`, value: pair.value, image_url: pair.image_url },
        { id: `card-${idx}-b`, value: pair.value, image_url: pair.image_url },
      ]);

      const questionData = {
        session_id: sessionId,
        type,
        question_text: questionText,
        options: type === 'multiple_choice' ? options.filter(opt => opt.trim() !== '') : null,
        correct_answer: correctAnswer,
        media_url: mediaUrl || null,
        media_type: mediaUrl ? (type === 'song_guess' ? 'audio' : 'video') : null,
        image_url: imageUrl || null,
        image_effect: imageEffect,
        puzzle_pieces: puzzlePieces,
        memory_cards: type === 'memory_game' ? memoryCards : null,
        math_expression: type === 'math_game' ? mathExpression : null,
        points,
        time_limit: timeLimit,
        hint: hint || null,
      };

      let error;
      if (editQuestion?.id) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editQuestion.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('questions')
          .insert([questionData]);
        error = insertError;
      }

      if (error) throw error;

      toast.success("Soal berhasil disimpan!");
      
      // Reset form jika bukan mode edit
      if (!editQuestion) resetForm();
      
      // Trigger refresh daftar soal di parent
      onSaved();
      
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setQuestionText('');
    setCorrectAnswer('');
    setImageUrl('');
    setPreviewUrl(null);
    setOptions(['', '', '', '']);
    // Reset state lainnya sesuai kebutuhan
  };

  return (
    <div className="space-y-5 p-1">
      {/* ... (Tipe Soal tetap sama) ... */}

      {/* Preview Gambar (UX diperbaiki) */}
      {(type === 'puzzle' || type === 'image_guess') && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Gambar Kuis</Label>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="URL gambar..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                className="border-sky-100"
              />
              <label className="relative cursor-pointer">
                <Button type="button" variant="outline" disabled={uploading} className="border-sky-200 text-sky-600">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')}
                />
              </label>
            </div>
            
            {previewUrl && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-dashed border-sky-200 bg-slate-50">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <button 
                  onClick={() => {setPreviewUrl(null); setImageUrl('');}}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ... (Input lainnya tetap sama, pastikan menggunakan state yang benar) ... */}

      <Button 
        onClick={handleSave} 
        disabled={saving || uploading} 
        className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg py-6"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
        {editQuestion ? 'Perbarui Soal' : 'Simpan Soal'}
      </Button>
    </div>
  );
}
