import React from 'react';
import { Item } from '../types';
import { fileToBase64 } from '../services/imageService';

interface ItemEditorProps {
  item: Item;
  onUpdate: (updatedItem: Item) => void;
  onDelete: () => void;
}

export const ItemEditor: React.FC<ItemEditorProps> = ({ item, onUpdate, onDelete }) => {

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        onUpdate({ ...item, image: base64 });
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
      <div className="flex gap-4 items-start">
        {/* Image Preview / Upload */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-300">
          {item.image ? (
            <img src={item.image} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              無照片
            </div>
          )}
          
          {/* Always visible upload trigger for better touch UX */}
          <label className="absolute inset-0 bg-black/0 hover:bg-black/10 flex flex-col justify-end transition-all cursor-pointer">
            <div className="bg-black/50 backdrop-blur-sm text-white text-[10px] text-center py-1 w-full font-bold">
              {item.image ? '更換' : '上傳'}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        {/* Text Fields */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="名字 (如: 小明)" 
              value={item.name}
              onChange={(e) => onUpdate({ ...item, name: e.target.value })}
              className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none select-text"
            />
            <button 
              onClick={onDelete}
              className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              title="刪除"
            >
              🗑️
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              placeholder="提示語 (例如：戴著藍色眼鏡)" 
              value={item.hint}
              onChange={(e) => onUpdate({ ...item, hint: e.target.value })}
              className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm select-text"
            />
          </div>
        </div>
      </div>
    </div>
  );
};