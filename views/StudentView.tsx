import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Collection, Settings, GameChar, ScaffoldingLevel } from '../types';
import { DraggableChar } from '../components/DraggableChar';
import { DropZone } from '../components/DropZone';
import { ImpulseOverlay } from '../components/ImpulseOverlay';
import { speak } from '../services/speechService';

interface StudentViewProps {
  collection: Collection;
  settings: Settings;
  onExit: () => void;
}

// Visual Feedback State Type
type FeedbackState = {
  type: 'success' | 'error';
  message: string;
} | null;

export const StudentView: React.FC<StudentViewProps> = ({ collection, settings, onExit }) => {
  // State
  const [isImpulseLocked, setIsImpulseLocked] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0); 
  
  const [filledZones, setFilledZones] = useState<Record<string, (string | null)[]>>({});
  const [scaffoldingLevel, setScaffoldingLevel] = useState<ScaffoldingLevel>(ScaffoldingLevel.NONE);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  
  // New State for Feedback and Game Over
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);

  // Refs
  const scaffoldTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusItemRef = useRef<string | undefined>(undefined);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived Data
  const isMultiMode = settings.displayMode === 'multi';
  
  const visualItems = useMemo(() => {
    if (isMultiMode) return collection.items;
    return [collection.items[currentItemIndex]];
  }, [collection, currentItemIndex, isMultiMode]);

  const focusItem = useMemo(() => {
    if (!isMultiMode) return collection.items[currentItemIndex];
    return collection.items.find(item => !completedItems.has(item.id)) || null;
  }, [isMultiMode, collection.items, currentItemIndex, completedItems]);

  // Initialization & Reset
  useEffect(() => {
    initGame();
  }, [collection]);

  const initGame = () => {
    const initialZones: Record<string, (string | null)[]> = {};
    collection.items.forEach(item => {
      initialZones[item.id] = new Array(item.name.length).fill(null);
    });
    setFilledZones(initialZones);
    setCompletedItems(new Set());
    setCurrentItemIndex(0);
    setIsGameComplete(false);
    setFeedback(null);
  };

  const handleRestart = () => {
    speak("重新開始");
    initGame();
    // Force reset turn logic implies impulse lock will trigger via effect below
    setIsImpulseLocked(true);
  };

  // Generate Character Bank
  const charBank = useMemo(() => {
    let chars: GameChar[] = [];
    visualItems.forEach(item => {
      const isItemCompleted = completedItems.has(item.id);
      if (!isItemCompleted) {
        const itemFilledState = filledZones[item.id] || new Array(item.name.length).fill(null);
        item.name.split('').forEach((char, index) => {
          if (itemFilledState[index] === null) {
            chars.push({
              id: `${item.id}-char-${index}`,
              char: char,
              belongsToItemId: item.id,
              targetIndex: index,
              isDistractor: false
            });
          }
        });
      }
    });

    if (settings.showDistractors) {
       const otherNames = ['大', '小', '美', '阿', '華', '莉', '老', '師', '爸', '媽'];
       const count = isMultiMode ? 4 : 2;
       for(let i=0; i<count; i++) {
         const randomChar = otherNames[Math.floor(Math.random() * otherNames.length)];
         chars.push({
            id: `distractor-${i}-${Date.now()}`,
            char: randomChar,
            belongsToItemId: 'none',
            targetIndex: -1,
            isDistractor: true
         });
       }
    }
    return chars.sort(() => Math.random() - 0.5);
  }, [visualItems, settings.showDistractors, completedItems, filledZones]);


  // Game Lifecycle: Reset turn when focus item changes
  useEffect(() => {
    if (!isGameComplete) {
      resetTurn();
    }
  }, [focusItem?.id, isMultiMode, isGameComplete]); 

  const resetTurn = () => {
    setIsImpulseLocked(true);
    setScaffoldingLevel(ScaffoldingLevel.NONE);
    if (scaffoldTimerRef.current) clearInterval(scaffoldTimerRef.current);

    const impulseTimer = setTimeout(() => {
      setIsImpulseLocked(false);
      startScaffoldingTimers();
    }, settings.impulseTime * 1000);

    return () => clearTimeout(impulseTimer);
  };

  const startScaffoldingTimers = () => {
    let secondsPassed = 0;
    if (scaffoldTimerRef.current) clearInterval(scaffoldTimerRef.current);

    scaffoldTimerRef.current = setInterval(() => {
      secondsPassed += 1;
      
      if (secondsPassed === settings.delayFlash) {
        setScaffoldingLevel(ScaffoldingLevel.VISUAL);
      }
      
      if (secondsPassed === settings.delayHint) {
        setScaffoldingLevel(ScaffoldingLevel.AUDIO);
        if (focusItemRef.current) {
             const currentTarget = collection.items.find(i => i.id === focusItemRef.current);
             if (currentTarget) speak(currentTarget.hint);
        }
      }

      if (secondsPassed === settings.delayGuide) {
        setScaffoldingLevel(ScaffoldingLevel.GUIDE);
      }
    }, 1000);
  };
  
  useEffect(() => {
      focusItemRef.current = focusItem?.id;
  }, [focusItem]);

  useEffect(() => {
    return () => {
      if (scaffoldTimerRef.current) clearInterval(scaffoldTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // --- Interaction Handlers ---

  const triggerFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 1500);
  };

  const handleDrop = (charId: string, x: number, y: number) => {
    const elements = document.elementsFromPoint(x, y);
    const dropZone = elements.find(el => el.hasAttribute('data-item-id'));

    if (dropZone) {
      const targetId = dropZone.getAttribute('data-item-id');
      const draggedChar = charBank.find(c => c.id === charId);

      if (targetId && draggedChar) {
        if (draggedChar.belongsToItemId === targetId) {
          handleSuccess(targetId, draggedChar);
        } else {
          handleFailure();
        }
      }
    }
  };

  const handleSuccess = (itemId: string, charObj: GameChar) => {
    // 1. Audio Feedback
    speak(`答對了，這是${charObj.char}`); 
    
    // 2. Visual Feedback
    triggerFeedback('success', '⭕ 答對了！');

    // 3. Logic Update
    setFilledZones(prev => {
      const currentItemState = [...(prev[itemId] || [])];
      if (charObj.targetIndex >= 0 && charObj.targetIndex < currentItemState.length) {
        currentItemState[charObj.targetIndex] = charObj.char;
      }
      return { ...prev, [itemId]: currentItemState };
    });

    const targetItem = collection.items.find(i => i.id === itemId);
    if (targetItem) {
      // Check for item completion shortly after state update
      setTimeout(() => {
        setFilledZones(currentZones => {
          const itemState = currentZones[itemId];
          if (itemState && itemState.every(c => c !== null)) {
             setCompletedItems(prev => {
               if (!prev.has(itemId)) {
                 handleItemComplete(itemId, targetItem.name);
                 return new Set(prev).add(itemId);
               }
               return prev;
             });
          }
          return currentZones;
        });
      }, 0);
    }
  };
  
  const handleFailure = () => {
    speak("不對喔，再試試看");
    triggerFeedback('error', '❌ 再試試看');
  };

  const handleItemComplete = (itemId: string, itemName: string) => {
      // Small delay to let the char sound finish
      setTimeout(() => speak(`${itemName}，完成！`), 800);
      
      if (isMultiMode) {
        const allDone = collection.items.every(item => completedItems.has(item.id) || item.id === itemId);
        if (allDone) {
           setTimeout(finishGame, 1500);
        }
      } else {
        setTimeout(() => {
          if (currentItemIndex < collection.items.length - 1) {
            setCurrentItemIndex(prev => prev + 1);
          } else {
            finishGame();
          }
        }, 2000);
      }
  };

  const finishGame = () => {
     setIsGameComplete(true);
     speak("太棒了，全部完成了！");
  };

  const shouldGuideChar = (char: GameChar): boolean => {
    if (scaffoldingLevel < ScaffoldingLevel.GUIDE) return false;
    if (char.isDistractor) return false;
    if (focusItem && char.belongsToItemId !== focusItem.id) return false;
    const filledState = filledZones[char.belongsToItemId];
    if (!filledState) return false;
    const firstEmptyIndex = filledState.findIndex(c => c === null);
    return char.targetIndex === firstEmptyIndex;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      <ImpulseOverlay isVisible={isImpulseLocked} />

      {/* Visual Feedback Overlay */}
      {feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`
            px-8 py-6 rounded-3xl shadow-2xl transform transition-all duration-300 scale-110 animate-bounce
            ${feedback.type === 'success' ? 'bg-green-100 border-4 border-green-500 text-green-700' : 'bg-red-100 border-4 border-red-400 text-red-600'}
          `}>
            <span className="text-4xl md:text-6xl font-bold tracking-wider">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Game Complete Modal */}
      {isGameComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col items-center gap-8 max-w-lg w-full animate-in zoom-in-95">
            <div className="text-8xl animate-bounce">🏆</div>
            <h2 className="text-4xl font-bold text-slate-800">全部完成！</h2>
            <div className="flex flex-col w-full gap-4">
              <button 
                onClick={handleRestart}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-2xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                再來一次
              </button>
              <button 
                onClick={onExit}
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xl font-bold transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                退出練習
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="p-4 flex justify-between items-center bg-white shadow-sm z-10">
        <div className="flex gap-3">
          <button onClick={onExit} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            離開
          </button>
          <button onClick={handleRestart} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            再來一次
          </button>
        </div>
        
        <div className="text-xl font-bold text-slate-600">
            {isMultiMode ? '配對挑戰' : `第 ${currentItemIndex + 1} / ${collection.items.length} 題`}
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Drop Zones Container */}
        <div className={`flex-1 grid gap-8 ${isMultiMode ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 flex items-center justify-center'}`}>
          {visualItems.map((item) => {
            const isCompleted = completedItems.has(item.id);
            const currentFilled = filledZones[item.id] || new Array(item.name.length).fill(null);
            const isFocusItem = focusItem?.id === item.id;

            return (
              <div key={item.id} className={`bg-white p-4 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 border-4 ${isCompleted ? 'border-green-400' : (isFocusItem ? 'border-blue-400 ring-4 ring-blue-100' : 'border-blue-100')}`}>
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className={`w-40 h-40 lg:w-48 lg:h-48 object-cover rounded-3xl shadow-sm pointer-events-none select-none ${isImpulseLocked ? 'blur-md' : ''} transition-all duration-500`}
                />
                
                <DropZone 
                    itemId={item.id}
                    expectedName={item.name}
                    filledChars={currentFilled}
                    isFlashing={isFocusItem && scaffoldingLevel >= ScaffoldingLevel.VISUAL && !isCompleted}
                />
              </div>
            );
          })}
        </div>

        {/* Character Bank (Draggables) */}
        <div className="lg:w-1/4 min-h-[160px] bg-slate-200 rounded-[2rem] p-6 shadow-inner flex flex-wrap content-start gap-4 justify-center z-20">
            {!isImpulseLocked && charBank.map((char) => (
                <DraggableChar 
                    key={char.id}
                    char={char}
                    onDrop={handleDrop}
                    isMatched={false} 
                    isGuideActive={shouldGuideChar(char)}
                />
            ))}
            {charBank.length === 0 && !isGameComplete && (
                <div className="text-slate-500 font-bold text-xl mt-10">完成！</div>
            )}
        </div>

      </main>
    </div>
  );
};