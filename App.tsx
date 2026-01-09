import React, { useState } from 'react';
import { analyzeLegalText, generateSingleImage } from './services/geminiService';
import { GeneratedImage, AppStatus } from './types';
import ImageCard from './components/ImageCard';

const DEFAULT_STYLE_PROMPT = `(Photorealistic:1.3), (8k resolution:1.2), (Cinematic lighting),
Constraints:
- Aspect Ratio: 16:9
- Style: Real life photography, high quality, documentary style.
- Context: South Korea, Korean
- Negative prompt: text, watermark, signature, cartoon, anime, illustration, distorted hands, blur, text.`;

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [stylePrompt, setStylePrompt] = useState(DEFAULT_STYLE_PROMPT);
  const [showStyleSettings, setShowStyleSettings] = useState(false);
  const [status, setStatus] = useState<AppStatus>('idle');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [progressMessage, setProgressMessage] = useState('');

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      alert("법률 콘텐츠를 입력해주세요.");
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setStatus('analyzing');
    setProgressMessage('법률 콘텐츠를 분석하여 시각화 장면을 기획하고 있습니다...');
    setImages([]);

    try {
      const scenes = await analyzeLegalText(inputText);
      
      const initialImages: GeneratedImage[] = scenes.map((prompt, index) => ({
        id: index + 1,
        prompt,
        base64: null,
        isLoading: true,
      }));

      setImages(initialImages);
      setStatus('generating');
      setProgressMessage('장면별 이미지를 생성하고 있습니다...');

      await Promise.all(initialImages.map(async (image) => {
        try {
          const base64 = await generateSingleImage(image.prompt, stylePrompt);
          setImages((prev) => 
            prev.map((item) => 
              item.id === image.id 
                ? { ...item, base64, isLoading: false } 
                : item
            )
          );
        } catch (error) {
          console.error(`Failed to generate image ${image.id}:`, error);
          setImages((prev) => 
            prev.map((item) => 
              item.id === image.id 
                ? { ...item, isLoading: false, error: '생성 실패' } 
                : item
            )
          );
        }
      }));

      setStatus('complete');
      setProgressMessage('모든 장면이 시각화되었습니다.');

    } catch (error) {
      console.error("Process failed:", error);
      setStatus('idle');
      alert("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleRegenerate = async (id: number, newPrompt: string) => {
    // Update the prompt locally first
    setImages((prev) => 
      prev.map((item) => 
        item.id === id 
          ? { ...item, prompt: newPrompt, isLoading: true, error: undefined, base64: null } 
          : item
      )
    );

    try {
      const base64 = await generateSingleImage(newPrompt, stylePrompt);
      setImages((prev) => 
        prev.map((item) => 
          item.id === id 
            ? { ...item, base64, isLoading: false } 
            : item
        )
      );
    } catch (error) {
      console.error(`Failed to regenerate image ${id}:`, error);
      setImages((prev) => 
        prev.map((item) => 
          item.id === id 
            ? { ...item, isLoading: false, error: '생성 실패' } 
            : item
        )
      );
    }
  };

  const handleDownloadAll = () => {
    const validImages = images.filter(img => img.base64);
    if (validImages.length === 0) {
      alert("다운로드할 이미지가 없습니다.");
      return;
    }

    // Sequentially download with a slight longer delay and no blocking confirm
    // This is the most reliable way without ZIP compression
    validImages.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${img.base64}`;
        link.download = `LegalLens_Scene_${img.id}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500); // 500ms delay to help browser handle multiple streams
    });
  };

  return (
    <div className="min-h-screen bg-legal-50 text-legal-900 font-sans">
      <header className="bg-white border-b border-legal-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-legal-800 rounded flex items-center justify-center text-white font-serif font-bold text-xl">L</div>
            <h1 className="text-lg font-bold text-legal-900 tracking-tight">LegalVis <span className="text-legal-400 font-normal">AI Director</span></h1>
          </div>
          <div className="text-xs font-medium text-legal-500 bg-legal-100 px-3 py-1 rounded-full">
            Nano Banana Series
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <section className="flex-1 bg-white rounded-2xl shadow-sm border border-legal-200 p-6">
            <label htmlFor="legal-text" className="block text-sm font-bold text-legal-700 mb-2 uppercase tracking-wide">
              법률 콘텐츠 입력
            </label>
            <textarea
              id="legal-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="판결문, 법률 조항, 사건 개요 등을 입력하면 8개의 장면으로 시각화합니다..."
              className="w-full h-40 p-4 bg-legal-50 border border-legal-200 rounded-xl resize-none outline-none focus:bg-white focus:border-legal-400 transition-colors text-legal-800 placeholder:text-legal-400 leading-relaxed mb-4"
              disabled={status === 'analyzing' || status === 'generating'}
            />
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={status === 'analyzing' || status === 'generating' || !inputText.trim()}
                className="bg-legal-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black disabled:bg-legal-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-legal-900/10 flex items-center gap-2"
              >
                {status === 'analyzing' || status === 'generating' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    작업 진행 중...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    8컷 시각화 생성
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="w-full lg:w-1/3 bg-white rounded-2xl border border-legal-200 overflow-hidden flex flex-col shadow-sm">
             <button 
               onClick={() => setShowStyleSettings(!showStyleSettings)}
               className="w-full flex items-center justify-between p-4 border-b border-legal-100 text-left hover:bg-legal-50 transition-colors"
             >
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-legal-600"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                   <span className="font-bold text-sm text-legal-700">전체 스타일 설정</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  className={`text-legal-400 transition-transform ${showStyleSettings ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
             </button>
             
             {showStyleSettings && (
               <div className="p-4 flex-1 flex flex-col gap-2">
                 <textarea
                   value={stylePrompt}
                   onChange={(e) => setStylePrompt(e.target.value)}
                   className="w-full h-48 text-[11px] font-mono text-legal-600 bg-legal-50 border border-legal-200 rounded-lg p-3 focus:bg-white focus:ring-1 focus:ring-legal-600 outline-none resize-none leading-relaxed"
                 />
                 <div className="flex justify-end">
                    <button 
                      onClick={() => setStylePrompt(DEFAULT_STYLE_PROMPT)} 
                      className="text-[10px] text-legal-500 underline hover:text-legal-800"
                    >
                      설정 초기화
                    </button>
                 </div>
               </div>
             )}
          </section>
        </div>

        {(status === 'analyzing' || status === 'generating' || status === 'complete') && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              {status !== 'complete' && <div className="w-2 h-2 rounded-full bg-legal-600 animate-pulse"></div>}
              <span className="text-legal-600 font-bold text-sm">{progressMessage}</span>
            </div>

            {images.length > 0 && status === 'complete' && (
               <button 
                 onClick={handleDownloadAll}
                 className="flex items-center gap-2 bg-legal-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                 전체 이미지 다운로드
               </button>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
            {images.map((img) => (
              <ImageCard 
                key={img.id} 
                image={img} 
                onRegenerate={handleRegenerate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;