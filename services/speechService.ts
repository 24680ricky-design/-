export const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.0;

  // Try to find a Chinese voice
  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-CN'));
  if (chineseVoice) {
    utterance.voice = chineseVoice;
  }

  window.speechSynthesis.speak(utterance);
};
