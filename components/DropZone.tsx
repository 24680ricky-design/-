import React, { forwardRef } from 'react';

interface DropZoneProps {
  itemId: string;
  expectedName: string; // Full name string
  filledChars: (string | null)[]; // Array matching expectedName length
  isFlashing: boolean; // Scaffolding Level 1
}

export const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(({ itemId, expectedName, filledChars, isFlashing }, ref) => {
  const chars = expectedName.split('');

  return (
    <div 
      ref={ref}
      data-item-id={itemId}
      className="flex flex-wrap gap-2 justify-center items-center min-h-[6rem] lg:min-h-[8rem] p-2 rounded-2xl bg-slate-50/50"
    >
      {chars.map((char, index) => {
        const isFilled = filledChars[index] !== null;
        
        // Determine if this specific slot should flash (it's the first empty one)
        const firstEmptyIndex = filledChars.findIndex(c => c === null);
        const shouldFlash = isFlashing && !isFilled && index === firstEmptyIndex;

        return (
          <div 
            key={index}
            className={`
              w-16 h-16 lg:w-20 lg:h-20
              flex items-center justify-center
              rounded-xl border-4 border-dashed
              transition-all duration-300
              ${isFilled 
                ? 'bg-green-100 border-green-500 shadow-none' 
                : 'bg-white border-slate-300 shadow-inner'}
              ${shouldFlash ? 'animate-pulse ring-4 ring-yellow-400 ring-opacity-70 bg-yellow-50 scale-110' : ''}
            `}
          >
            {isFilled ? (
              <span className="text-3xl lg:text-4xl font-bold text-green-700 animate-in zoom-in spin-in-6 duration-300">
                {filledChars[index]}
              </span>
            ) : (
              <span className="text-slate-200 text-xl font-light opacity-50">
                {index + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});

DropZone.displayName = 'DropZone';