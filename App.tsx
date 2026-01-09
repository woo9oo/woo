import React, { useState } from 'react';
import { analyzeLegalText, generateSingleImage } from './services/geminiService';
import { GeneratedImage, AppStatus } from './types';
import ImageCard from './components/ImageCard';

const DEFAULT_STYLE_PROMPT = `(Photorealistic:1.3), (8k resolution:1.2), (Cinematic lighting),
Constraints:
- Aspect Ratio: 16:9
- Style: Real life photography, high quality, documentary style.
- Context: South Korea, Korean people, Korean architecture/streets/courtroom.
- Negative prompt: text, watermark, signature, cartoon, anime, illustration, distorted hands, blur, english text.`;

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [stylePrompt, setStylePrompt] = useState(DEFAULT_STYLE_PROMPT);
  const [showStyleSettings, setShowStyleSettings] = useState(true);
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
      setProgressMessage('완료되었습니다.');

    } catch (error) {
      console.error("Process failed:", error);
      setStatus('idle');
      alert("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleRegenerate = async (id: number) => {
    const targetImage = images.find(img => img.id === id);
    if (!targetImage) return;

    // Reset state to loading for this specific image
    setImages((prev) => 
      prev.map((item) => 
        item.id === id 
          ? { ...item, isLoading: true, error: undefined } 
          : item
      )
    );

    try {
      // Use the current style prompt state
      const base64 = await generateSingleImage(targetImage.prompt, stylePrompt);
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

    // Removed confirm dialog to prevent losing user gesture token which causes popup blockers to intervene more aggressively
    
    // Sequentially download images
    validImages.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${img.base64}`;
        link.download = `LegalLens_Scene_${img.id}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300); // 300ms delay between downloads
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
            Gemini 2.5 Flash & Nano Banana
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Input Section - Left Side */}
          <section className="flex-1 bg-white rounded-2xl shadow-sm border border-legal-200 p-6">
            <label htmlFor="legal-text" className="block text-sm font-bold text-legal-700 mb-2 uppercase tracking-wide">
              법률 콘텐츠 입력
            </label>
            <textarea
              id="legal-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="판결문, 법률 조항, 사건 개요 등 시각화하고 싶은 텍스트를 붙여넣으세요..."
              className="w-full h-40 p-4 bg-legal-50 border border-legal-200 rounded-xl resize-none outline-none focus:bg-white focus:border-legal-400 transition-colors text-legal-800 placeholder:text-legal-400 leading-relaxed mb-4"
              disabled={status === 'analyzing' || status === 'generating'}
            />
            
            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={status === 'analyzing' || status === 'generating' || !inputText.trim()}
                className="bg-legal-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black disabled:bg-legal-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-legal-900/10 flex items-center gap-2"
              >
                {status === 'analyzing' ? (
                  <>
                    <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    분석 중...
                  </>
                ) : status === 'generating' ? (
                  <>
                    <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    생성 중...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    시각화 시작
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Style Settings - Right Side/Collapsible */}
          <section className="w-full lg:w-1/3 bg-legal-50 rounded-2xl border border-legal-200 overflow-hidden flex flex-col">
             <button 
               onClick={() => setShowStyleSettings(!showStyleSettings)}
               className="w-full flex items-center justify-between p-4 bg-white border-b border-legal-200 text-left"
             >
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-legal-600"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                   <span className="font-bold text-sm text-legal-700">톤앤매너 / 스타일 설정</span>
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
               <div className="p-4 bg-white flex-1 flex flex-col gap-2">
                 <p className="text-xs text-legal-500 mb-1">
                   모든 이미지 생성에 공통으로 적용되는 스타일, 화질, 배경, 네거티브 프롬프트 설정입니다.
                 </p>
                 <textarea
                   value={stylePrompt}
                   onChange={(e) => setStylePrompt(e.target.value)}
                   className="w-full flex-1 min-h-[120px] text-xs font-mono text-legal-600 bg-legal-50 border border-legal-200 rounded-lg p-3 focus:ring-1 focus:ring-legal-600 focus:border-legal-600 outline-none resize-y leading-relaxed"
                   placeholder="스타일 프롬프트를 입력하세요..."
                 />
                 <div className="text-[10px] text-legal-400 flex gap-2 justify-end">
                    <span>* 변경 시 다음 생성부터 적용됩니다.</span>
                    <button 
                      onClick={() => setStylePrompt(DEFAULT_STYLE_PROMPT)} 
                      className="text-legal-600 underline hover:text-legal-800"
                    >
                      기본값 복원
                    </button>
                 </div>
               </div>
             )}
          </section>
        </div>

        {/* Status Message & Download All */}
        {(status === 'analyzing' || status === 'generating' || status === 'complete') && (
          <div className="flex items-center justify-between px-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              {status !== 'complete' && (
                <div className="w-2 h-2 rounded-full bg-legal-600 animate-pulse"></div>
              )}
              <span className="text-legal-600 font-medium">{progressMessage}</span>
            </div>

            {images.length > 0 && status === 'complete' && (
               <button 
                 onClick={handleDownloadAll}
                 className="flex items-center gap-2 bg-white border border-legal-300 hover:bg-legal-50 text-legal-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                 전체 이미지 다운로드 (개별 파일)
               </button>
            )}
          </div>
        )}

        {/* Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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