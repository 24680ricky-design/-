import React from 'react';

interface ImpulseOverlayProps {
  isVisible: boolean;
}

export const ImpulseOverlay: React.FC<ImpulseOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[999] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center cursor-wait">
      <div className="bg-white p-8 rounded-[3rem] shadow-2xl animate-pulse flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <h2 className="text-3xl font-bold text-slate-800">仔細看</h2>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
          <div className="bg-blue-600 h-2.5 rounded-full animate-[width_1.5s_linear_forwards]" style={{width: '0%'}}></div>
        </div>
      </div>
    </div>
  );
};
