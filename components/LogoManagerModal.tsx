import React, { useState, useRef, useEffect } from 'react';
import { SilverCorpLogo } from './SilverCorpLogo';

interface LogoManagerModalProps {
  currentLogoUrl: string;
  onSave: (newLogoUrl: string) => void;
  onClose: () => void;
}

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({ currentLogoUrl, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'new'>('current');
  
  // Current Logo State
  const [currentScale, setCurrentScale] = useState(1);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [currentBrightness, setCurrentBrightness] = useState(100);

  // New Logo State
  const [newImageSrc, setNewImageSrc] = useState<string | null>(null);
  const [newScale, setNewScale] = useState(1);
  const [newRotation, setNewRotation] = useState(0);
  const [newBrightness, setNewBrightness] = useState(100);
  const [newContrast, setNewContrast] = useState(100);
  const [newCropX, setNewCropX] = useState(0);
  const [newCropY, setNewCropY] = useState(0);
  const [newFlipH, setNewFlipH] = useState(false);
  const [newFlipV, setNewFlipV] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement>(null);
  const newCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw current logo
  useEffect(() => {
    if (activeTab !== 'current') return;
    const canvas = currentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentLogoUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        ctx.filter = `brightness(${currentBrightness}%)`;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.scale(currentScale, currentScale);
        
        // Calculate aspect ratio to fit within canvas
        const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      };
      img.src = currentLogoUrl;
    } else {
        // Draw a placeholder or text if no logo
        ctx.save();
        ctx.filter = `brightness(${currentBrightness}%)`;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.scale(currentScale, currentScale);
        
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(-20, 20);
        ctx.lineTo(-40, -10);
        ctx.lineTo(-30, -30);
        ctx.lineTo(-10, -10);
        ctx.lineTo(0, -30);
        ctx.lineTo(10, -10);
        ctx.lineTo(30, -30);
        ctx.lineTo(40, -10);
        ctx.lineTo(20, 20);
        ctx.fill();
        
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
  }, [currentLogoUrl, currentScale, currentRotation, currentBrightness, activeTab]);

  // Draw new logo
  useEffect(() => {
    if (activeTab !== 'new' || !newImageSrc) return;
    const canvas = newCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.filter = `brightness(${newBrightness}%) contrast(${newContrast}%)`;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((newRotation * Math.PI) / 180);
        ctx.scale(newScale * (newFlipH ? -1 : 1), newScale * (newFlipV ? -1 : 1));
        
        const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        
        // When flipped, the crop direction needs to be inverted to feel natural
        const drawX = -w / 2 + (newFlipH ? -newCropX : newCropX);
        const drawY = -h / 2 + (newFlipV ? -newCropY : newCropY);
        
        ctx.drawImage(img, drawX, drawY, w, h);
        ctx.restore();
    };
    img.src = newImageSrc;
  }, [newImageSrc, newScale, newRotation, newBrightness, newContrast, newCropX, newCropY, newFlipH, newFlipV, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageSrc(reader.result as string);
        setActiveTab('new');
        handleResetNew();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/svg+xml')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageSrc(reader.result as string);
        setActiveTab('new');
        handleResetNew();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetCurrent = () => {
    setCurrentScale(1);
    setCurrentRotation(0);
    setCurrentBrightness(100);
  };

  const handleResetNew = () => {
    setNewScale(1);
    setNewRotation(0);
    setNewBrightness(100);
    setNewContrast(100);
    setNewCropX(0);
    setNewCropY(0);
    setNewFlipH(false);
    setNewFlipV(false);
    setIsCropMode(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropMode || activeTab !== 'new') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - newCropX, y: e.clientY - newCropY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isCropMode || activeTab !== 'new') return;
    setNewCropX(e.clientX - dragStart.x);
    setNewCropY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCurrent = () => {
    const canvas = currentCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
      triggerToast();
    }
  };

  const handleSaveNew = () => {
    const canvas = newCanvasRef.current;
    if (canvas && newImageSrc) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
      triggerToast();
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1500);
  };

  const getPreviewUrl = () => {
    if (activeTab === 'current') {
        return currentCanvasRef.current?.toDataURL('image/png') || currentLogoUrl;
    } else {
        return newCanvasRef.current?.toDataURL('image/png') || '';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 flex flex-col z-[100] overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">Logo Management</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel - Current Logo */}
        <div className={`flex-1 flex flex-col border-r border-slate-700 bg-slate-800/50 transition-opacity ${activeTab === 'current' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`} onClick={() => setActiveTab('current')}>
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              Current Logo
              {activeTab === 'current' && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">Live</span>}
            </h3>
          </div>
          
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
            <div className="w-48 h-48 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner relative">
                <canvas ref={currentCanvasRef} width={256} height={256} className="max-w-full max-h-full" />
            </div>
          </div>

          <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Scale</span>
                  <span className="text-slate-400">{currentScale.toFixed(2)}x</span>
                </div>
                <input type="range" min="0.1" max="3" step="0.1" value={currentScale} onChange={(e) => setCurrentScale(parseFloat(e.target.value))} className="w-full accent-blue-500" disabled={activeTab !== 'current'} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Rotation</span>
                  <span className="text-slate-400">{currentRotation}°</span>
                </div>
                <input type="range" min="-180" max="180" value={currentRotation} onChange={(e) => setCurrentRotation(parseInt(e.target.value))} className="w-full accent-blue-500" disabled={activeTab !== 'current'} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Brightness</span>
                  <span className="text-slate-400">{currentBrightness}%</span>
                </div>
                <input type="range" min="0" max="200" value={currentBrightness} onChange={(e) => setCurrentBrightness(parseInt(e.target.value))} className="w-full accent-blue-500" disabled={activeTab !== 'current'} />
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button onClick={handleResetCurrent} disabled={activeTab !== 'current'} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                Reset
              </button>
              <button onClick={handleSaveCurrent} disabled={activeTab !== 'current'} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - New Logo */}
        <div className={`flex-1 flex flex-col bg-slate-800/50 transition-opacity ${activeTab === 'new' ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`} onClick={() => setActiveTab('new')}>
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              Upload New Logo
              {activeTab === 'new' && newImageSrc && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">Draft</span>}
            </h3>
          </div>
          
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
            {!newImageSrc ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-sm h-48 border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-slate-300 font-medium text-sm">Click or drag & drop to upload</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, SVG up to 5MB</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" className="hidden" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner relative">
                <canvas 
                    ref={newCanvasRef} 
                    width={256} 
                    height={256} 
                    className={`max-w-full max-h-full ${isCropMode ? 'cursor-move' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
                {isCropMode && (
                    <div className="absolute inset-0 pointer-events-none border-4 border-blue-500/50 rounded-lg">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-blue-500 rounded-full opacity-50"></div>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-blue-400 font-medium bg-slate-900/80 py-1">Drag image to pan</div>
                    </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3 overflow-y-auto max-h-[35vh] custom-scrollbar">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Scale</span>
                  <span className="text-slate-400">{newScale.toFixed(2)}x</span>
                </div>
                <input type="range" min="0.1" max="3" step="0.1" value={newScale} onChange={(e) => setNewScale(parseFloat(e.target.value))} className="w-full accent-blue-500" disabled={!newImageSrc || activeTab !== 'new'} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Rotation</span>
                  <span className="text-slate-400">{newRotation}°</span>
                </div>
                <input type="range" min="-180" max="180" value={newRotation} onChange={(e) => setNewRotation(parseInt(e.target.value))} className="w-full accent-blue-500" disabled={!newImageSrc || activeTab !== 'new'} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setNewFlipH(!newFlipH)} 
                    disabled={!newImageSrc || activeTab !== 'new'}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors border ${newFlipH ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                  >
                    Flip Horizontal
                  </button>
                  <button 
                    onClick={() => setNewFlipV(!newFlipV)} 
                    disabled={!newImageSrc || activeTab !== 'new'}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors border ${newFlipV ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                  >
                    Flip Vertical
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Brightness</span>
                      <span className="text-slate-400">{newBrightness}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={newBrightness} onChange={(e) => setNewBrightness(parseInt(e.target.value))} className="w-full accent-blue-500" disabled={!newImageSrc || activeTab !== 'new'} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">Contrast</span>
                      <span className="text-slate-400">{newContrast}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={newContrast} onChange={(e) => setNewContrast(parseInt(e.target.value))} className="w-full accent-blue-500" disabled={!newImageSrc || activeTab !== 'new'} />
                  </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button onClick={handleResetNew} disabled={!newImageSrc || activeTab !== 'new'} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                Reset
              </button>
              <button onClick={() => setIsCropMode(!isCropMode)} disabled={!newImageSrc || activeTab !== 'new'} className={`flex-1 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50 ${isCropMode ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                {isCropMode ? 'Done Panning' : 'Pan Image'}
              </button>
              <button onClick={handleSaveNew} disabled={!newImageSrc || activeTab !== 'new'} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                Upload Logo
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom - Live Preview Bar */}
      <div className="h-32 bg-slate-900 border-t border-slate-700 p-4 flex flex-col">
        <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Live Preview</h3>
        <div className="flex-1 flex gap-4">
            {/* Light Header Mockup */}
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-3 flex items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center p-1 border border-slate-200">
                        {getPreviewUrl() ? (
                            <img src={getPreviewUrl()} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <SilverCorpLogo className="w-full h-full" />
                        )}
                    </div>
                    <span className="text-base font-bold text-slate-800">SilverCorp</span>
                </div>
                <div className="ml-auto flex gap-3">
                    <div className="w-12 h-1.5 bg-slate-200 rounded"></div>
                    <div className="w-12 h-1.5 bg-slate-200 rounded"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded-full -mt-2"></div>
                </div>
            </div>

            {/* Dark Footer Mockup */}
            <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-3 flex flex-col justify-center shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center p-1 border border-slate-800">
                        {getPreviewUrl() ? (
                            <img src={getPreviewUrl()} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <SilverCorpLogo className="w-full h-full" />
                        )}
                    </div>
                    <div>
                        <span className="text-base font-bold text-white block">SilverCorp</span>
                        <span className="text-[10px] text-slate-500">Education & Immigration</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="w-20 h-1 bg-slate-800 rounded"></div>
                    <div className="w-20 h-1 bg-slate-800 rounded"></div>
                </div>
            </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Logo saved successfully!
        </div>
      )}
    </div>
  );
};
