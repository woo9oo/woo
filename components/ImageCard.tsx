
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onRegenerate: (id: number, newPrompt: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onRegenerate }) => {
  const [editedPrompt, setEditedPrompt] = useState(image.prompt);

  useEffect(() => {
    setEditedPrompt(image.prompt);
  }, [image.prompt]);

  const handleDownload = () => {
    if (image.base64) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${image.base64}`;
      link.download = `legal_scene_${image.id}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col border border-legal-200 h-full group transition-all hover:shadow-lg">
      {/* Image Area */}
      <div className="relative w-full aspect-video bg-legal-100 flex-shrink-0 overflow-hidden">
        {image.isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse z-10 bg-legal-50">
            <div className="w-10 h-10 border-4 border-legal-200 border-t-legal-600 rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-legal-500 font-medium">생성 중...</span>
          </div>
        ) : image.base64 ? (
          <>
            <img 
              src={`data:image/jpeg;base64,${image.base64}`} 
              alt={`Scene ${image.id}`} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 gap-2">
              <button 
                onClick={handleDownload}
                className="bg-white text-legal-900 px-4 py-2 rounded-full transition-colors flex items-center gap-2 font-bold text-xs shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                이미지 저장
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center z-10 bg-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <span className="text-xs font-medium mb-3">생성 실패</span>
          </div>
        )}
      </div>

      {/* Description Area */}
      <div className="p-4 bg-white flex-1 flex flex-col gap-2">
         <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-legal-500 uppercase tracking-wider">Scene {image.id}</span>
            <button 
              onClick={() => onRegenerate(image.id, editedPrompt)}
              disabled={image.isLoading}
              className="bg-legal-100 hover:bg-legal-200 text-legal-700 px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-30 flex items-center gap-1"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={image.isLoading ? 'animate-spin' : ''}>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>
               </svg>
               재생성
            </button>
         </div>
         <textarea
           value={editedPrompt}
           onChange={(e) => setEditedPrompt(e.target.value)}
           placeholder="장면 묘사를 수정해보세요..."
           className="text-xs text-legal-700 leading-relaxed w-full h-20 p-2 bg-legal-50 border border-transparent focus:border-legal-200 focus:bg-white rounded-lg outline-none resize-none transition-all scrollbar-hide"
           disabled={image.isLoading}
         />
      </div>
    </div>
  );
};

export default ImageCard;
