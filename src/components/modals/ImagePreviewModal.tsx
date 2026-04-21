// src/components/modals/ImagePreviewModal.tsx
import React from 'react';
import { X } from 'lucide-react';

// กำหนด Type สำหรับ Props ที่คอมโพเนนต์นี้รับเข้ามา
interface ImagePreviewModalProps {
    imageUrl: string | null | undefined; 
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" 
            onClick={onClose}
        >
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
                <button 
                    onClick={onClose} 
                    className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md"
                >
                    <X className="w-6 h-6" />
                </button>
                <img 
                    src={imageUrl} 
                    alt="Full Preview" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" 
                    // ระบุ Type ของ Event ให้เป็น MouseEvent ที่เกิดกับ HTMLImageElement
                    onClick={(e: React.MouseEvent<HTMLImageElement>) => e.stopPropagation()} 
                />
            </div>
        </div>
    );
};

export default ImagePreviewModal;