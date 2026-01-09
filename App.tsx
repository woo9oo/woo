import React, { useState } from 'react';
import { analyzeLegalText, generateSingleImage } from './services/geminiService';
import { GeneratedImage, AppStatus } from './types';
import ImageCard from './components/ImageCard';

const DEFAULT_STYLE = `(Photorealistic:1.3), (8k resolution:1.2), (Cinematic lighting),
Constraints:
- Aspect Ratio: 16:9
- Style: Real life photography, high quality, documentary style.
- Context: South Korea, Korean
- Negative prompt: text, watermark, signature, cartoon, anime, illustration, distorted hands, blur, text.`;

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [stylePrompt, setStylePrompt] = useState(DEFAULT_STYLE);
  const [showStyle, setShowStyle] = useState(false);
  const [status, setStatus] = useState<AppStatus>('idle');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [msg, setMsg] = useState('');

  const handleGenerate = async () => {
    if (!inputText.trim()) return alert("내용을 입력해주세요.");

    setStatus('analyzing');
    setMsg('장면을 분석하고 있습니다...');
    setImages([]);

    try {
      const scenes = await analyzeLegalText(inputText);
      const initial = scenes.map((prompt, i) => ({ id: i + 1, prompt, base64: null, isLoading: true }));
      setImages(initial);
      
      setStatus('generating');
      setMsg('이미지를 생성 중입니다...');

      await Promise.all(initial.map(async (img) => {
        try {
          const base64 = await generateSingleImage(img.prompt, stylePrompt);
          setImages(prev => prev.map(item => item.id === img.id ? { ...item, base64, isLoading: false } : item));
        } catch {
          setImages(prev => prev.map(item => item.id === img.id ? { ...item, isLoading: false, error: '실패' } : item));
        }
      }));

      setStatus('complete');
      setMsg('시각화가 완료되었습니다.');
    } catch {
      setStatus('idle');
      alert("오류가 발생했습니다.");
    }
  };

  const handleRegen = async (id: number, prompt: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, prompt, isLoading: true, base64: null } : img));
    try {
      const base64 = await generateSingleImage(prompt, stylePrompt);
      setImages(prev => prev.map(img => img.id === id ? { ...img, base64, isLoading: false } : img));
    } catch {
      setImages(prev => prev.map(img => img.id === id ? { ...img, isLoading: false } : img));
    }
  };

  const downloadAll = () => {
    images.filter(img => img.base64).forEach((img, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = `data:image/jpeg;base64,${img.base64}`;
        a.download = `Legal_Scene_${img.id}.jpg`;
        a.click();
      }, i * 500);
    });
  };

  return (
    <div className="min-h-screen bg-legal-50 text-legal-900 font-sans p-4 md:p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black tracking-tighter">LEGAL<span className="text-legal-500 font-light">VIS</span></h1>
        <div className="text-[10px] font-bold bg-legal-200 px-2 py-1 rounded">NANO BANANA</div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-legal-200 shadow-sm">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="법률 텍스트를 입력하세요..."
              className="w-full h-32 p-4 bg-legal-50 rounded-xl resize-none outline-none mb-4"
            />
            <div className="flex justify-end">
              <button onClick={handleGenerate} disabled={status !== 'idle' && status !== 'complete'} className="bg-legal-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50">
                8컷 시각화 생성
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-legal-200 overflow-hidden shadow-sm">
            <button onClick={() => setShowStyle(!showStyle)} className="w-full p-4 text-left font-bold border-b border-legal-100 flex justify-between">
              <span>스타일 설정</span>
              <span>{showStyle ? '▲' : '▼'}</span>
            </button>
            {showStyle && (
              <div className="p-4">
                <textarea value={stylePrompt} onChange={e => setStylePrompt(e.target.value)} className="w-full h-32 text-[10px] font-mono p-2 bg-legal-50 rounded outline-none" />
              </div>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-legal-600">{msg}</p>
              {status === 'complete' && (
                <button onClick={downloadAll} className="bg-legal-900 text-white px-4 py-2 rounded-lg text-sm font-bold">전체 다운로드</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {images.map(img => <ImageCard key={img.id} image={img} onRegenerate={handleRegen} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;