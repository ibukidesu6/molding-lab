import { useState } from 'react';
import GameScreen from './components/GameScreen';
import TopScreen from './components/TopScreen';
import { loadProgress, type Progress } from './game';
import { I18nProvider } from './i18n';

export default function App() {
  const [screen, setScreen] = useState<'top' | 'game'>('top');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const hasProgress = progress.seen.length > 0;

  return (
    <I18nProvider>
      {screen === 'top' ? (
        <TopScreen onStart={() => setScreen('game')} hasProgress={hasProgress} />
      ) : (
        <GameScreen progress={progress} setProgress={setProgress} onHome={() => setScreen('top')} />
      )}
    </I18nProvider>
  );
}
