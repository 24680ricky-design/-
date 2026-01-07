import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { TeacherView } from './views/TeacherView';
import { StudentView } from './views/StudentView';
import { Collection, Settings } from './types';
import { getCollections, getSettings, getActiveCollectionId } from './services/storageService';

const App = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'teacher' | 'student'>('landing');
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [gameSettings, setGameSettings] = useState<Settings | null>(null);
  
  // Teacher Login State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Load initial state
  useEffect(() => {
    const collections = getCollections();
    const activeId = getActiveCollectionId();
    const settings = getSettings();
    
    const initialCollection = collections.find(c => c.id === activeId) || collections[0];
    
    if (initialCollection) {
      setActiveCollection(initialCollection);
    }
    setGameSettings(settings);
  }, []);

  const handleStartGame = (collection: Collection, settings: Settings) => {
    setActiveCollection(collection);
    setGameSettings(settings);
    setCurrentView('student');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "0000") {
      setCurrentView('teacher');
      setShowLoginModal(false);
      setPasswordInput('');
    } else {
      alert("密碼錯誤");
      setPasswordInput('');
    }
  };

  const handleEnterStudentMode = () => {
    // Reload settings just in case
    const collections = getCollections();
    const activeId = getActiveCollectionId();
    const settings = getSettings();
    const initialCollection = collections.find(c => c.id === activeId) || collections[0];

    if (initialCollection) {
      handleStartGame(initialCollection, settings);
    } else {
      alert("尚未設定教材，請先請老師設定。");
    }
  };

  const handleExitGame = () => {
    setCurrentView('landing');
  };

  if (currentView === 'student' && activeCollection && gameSettings) {
    return (
      <StudentView 
        collection={activeCollection} 
        settings={gameSettings} 
        onExit={handleExitGame} 
      />
    );
  }

  if (currentView === 'teacher') {
    return (
      <TeacherView onStartGame={handleStartGame} />
    );
  }

  // Landing View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="z-10 text-center space-y-12 px-4 relative">
        <h1 className="text-6xl md:text-7xl font-bold text-slate-800 tracking-tight drop-shadow-sm">
          配對王
          <span className="block text-2xl md:text-3xl text-slate-500 mt-4 font-normal">快樂學習，聰明配對</span>
        </h1>

        <button 
          onClick={handleEnterStudentMode}
          className="group relative inline-flex items-center justify-center px-12 py-6 text-2xl md:text-4xl font-bold text-white transition-all duration-200 bg-blue-500 font-pj rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-600 hover:scale-105 shadow-2xl"
        >
          <span className="mr-4">🚀</span> 開始學習
          <div className="absolute -inset-3 rounded-full bg-blue-400 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-200" />
        </button>
      </div>

      {/* Teacher Access Button (Bottom Right) */}
      <button 
        type="button"
        onClick={() => setShowLoginModal(true)}
        className="fixed bottom-6 right-6 z-[100] p-4 bg-white/90 hover:bg-white backdrop-blur-sm text-slate-500 hover:text-blue-600 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
        title="教師後台"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">教師登入</h2>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <input 
                type="password" 
                autoFocus
                placeholder="請輸入密碼" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg tracking-widest"
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => { setShowLoginModal(false); setPasswordInput(''); }}
                  className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-xl font-bold transition"
                >
                  確認
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);