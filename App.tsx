import React, { useState, useEffect, useRef } from 'react';
import { TypingArea } from './components/TypingArea';
import { ResultChart } from './components/ResultChart';
import { generateTypingPrompt } from './services/geminiService';
import { GameState, TestStats, LeaderboardEntry, GameMode, Theme, TimeOption } from './types';

// Mock Leaderboard Data
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', username: 'speed_demon', wpm: 145, accuracy: 99.5, date: '15 oct 2023' },
  { id: '2', username: 'kb_warrior', wpm: 128, accuracy: 98.2, date: '14 oct 2023' },
  { id: '3', username: 'click_clack', wpm: 115, accuracy: 97.0, date: '16 oct 2023' },
  { id: '4', username: 'typist_pro', wpm: 98, accuracy: 95.5, date: '12 oct 2023' },
];

const THEMES: Theme[] = [
    {
        name: 'serika_dark',
        colors: { bg: '#323437', main: '#e2b714', sub: '#646669', text: '#d1d0c5', error: '#ca4754' }
    },
    {
        name: 'one_dark',
        colors: { bg: '#282c34', main: '#98c379', sub: '#5c6370', text: '#abb2bf', error: '#e06c75' }
    },
    {
        name: 'carbon',
        colors: { bg: '#171717', main: '#f34f29', sub: '#5e5e5e', text: '#f1f1f1', error: '#da3333' }
    },
    {
        name: 'oceanic',
        colors: { bg: '#1b2b34', main: '#6699cc', sub: '#65737e', text: '#c0c5ce', error: '#ec5f67' }
    },
    {
        name: 'dracula',
        colors: { bg: '#282a36', main: '#bd93f9', sub: '#6272a4', text: '#f8f8f2', error: '#ff5555' }
    },
    {
        name: 'miami',
        colors: { bg: '#18181a', main: '#e4609b', sub: '#4758b5', text: '#4bf4ce', error: '#fff' }
    }
];

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [tempUsername, setTempUsername] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [targetText, setTargetText] = useState<string>(''); // Text without spaces for validation
  const [displayWords, setDisplayWords] = useState<string[]>([]); // Array of words for display
  const [originalWords, setOriginalWords] = useState<string[]>([]); // Keep original fetched words for infinite loop
  
  const [userInput, setUserInput] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [history, setHistory] = useState<{ wpm: number; raw: number; second: number }[]>([]);
  const [view, setView] = useState<'TEST' | 'LEADERBOARD'>('TEST');
  
  // Settings
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CASUAL);
  const [timeLimit, setTimeLimit] = useState<TimeOption>(30);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[1]); // Default to One Dark
  
  const timerRef = useRef<number | null>(null);

  // Initialize: Load test only after username is set
  useEffect(() => {
    if (username) {
        loadNewTest();
    }
  }, [username]);

  // Theme Application
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-color', currentTheme.colors.bg);
    root.style.setProperty('--main-color', currentTheme.colors.main);
    root.style.setProperty('--sub-color', currentTheme.colors.sub);
    root.style.setProperty('--text-color', currentTheme.colors.text);
    root.style.setProperty('--text-active-color', currentTheme.colors.text); // Initially same
    root.style.setProperty('--error-color', currentTheme.colors.error);
  }, [currentTheme]);

  const handleUsernameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (tempUsername.trim().length > 0) {
          setUsername(tempUsername.trim().toLowerCase());
      }
  };

  const loadNewTest = async (overrideMode?: GameMode) => {
    const modeToUse = overrideMode || gameMode;
    setGameState(GameState.IDLE);
    setUserInput('');
    setStartTime(null);
    setHistory([]);
    setStats(null);
    setTimeRemaining(timeLimit);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Generate Text
    const rawText = await generateTypingPrompt(modeToUse);
    // Split for display (with visual gaps)
    const words = rawText.split(' ').filter(w => w.length > 0);
    
    setOriginalWords(words); // Store base words
    setDisplayWords(words);
    // Create target for validation (remove spaces)
    setTargetText(words.join(''));
  };

  const calculateStats = (currentInput: string, timeElapsedSecs: number) => {
    // Avoid division by zero
    if (timeElapsedSecs <= 0) return { wpm: 0, raw: 0, accuracy: 100, correct: 0, errors: 0 };

    let correct = 0;
    let errors = 0;
    
    for (let i = 0; i < currentInput.length; i++) {
        // Compare input index directly to targetText index
        // Note: targetText might grow, so checking validity is fine
        if (currentInput[i] === targetText[i]) {
            correct++;
        } else {
            errors++;
        }
    }
    
    // WPM Calculations (Standard)
    // Gross WPM = (All entries / 5) / Time (min)
    const rawWpm = Math.round((currentInput.length / 5) / (timeElapsedSecs / 60));
    
    // Net WPM = (Correct entries / 5) / Time (min)
    const wpm = Math.round((correct / 5) / (timeElapsedSecs / 60));

    // Accuracy = (Correct / Total Typed) * 100
    const accuracy = currentInput.length > 0 ? Math.round((correct / currentInput.length) * 100) : 100;

    return { wpm, raw: rawWpm, accuracy, correct, errors };
  };

  // Improved Interval for Live Stats that accesses current userInput via Ref
  const userInputRef = useRef(userInput);
  useEffect(() => {
      userInputRef.current = userInput;
  }, [userInput]);
  
  useEffect(() => {
      if (gameState === GameState.RUNNING) {
          // Clear any existing interval to prevent duplicates
          if (timerRef.current) clearInterval(timerRef.current);
          
          const start = startTime || Date.now();
          if (!startTime) setStartTime(start);

          timerRef.current = window.setInterval(() => {
            const now = Date.now();
            const elapsed = (now - start) / 1000;
            const remaining = Math.max(0, timeLimit - Math.floor(elapsed));
            
            setTimeRemaining(remaining);
            
            const currentStats = calculateStats(userInputRef.current, Math.max(0.5, elapsed));
            setHistory(prev => [...prev, {
                second: Math.floor(elapsed),
                wpm: currentStats.wpm,
                raw: currentStats.raw
            }]);

            if (remaining <= 0) {
                finishTest(userInputRef.current);
            }
          }, 1000);
      }
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timeLimit]); // Re-run if gamestate changes


  const handleInputChange = (value: string) => {
    if (gameState === GameState.FINISHED) return;

    // Prevent space input - user should not type spaces
    if (value.endsWith(' ')) return;

    if (gameState === GameState.IDLE && value.length > 0) {
      setGameState(GameState.RUNNING);
    }

    // INFINITE TEXT LOGIC
    // If user is nearing the end of the buffer (less than 50 chars remaining),
    // we append the original set of words again to extend the test infinitely.
    if (targetText.length - value.length < 50) {
        setDisplayWords(prev => [...prev, ...originalWords]);
        setTargetText(prev => prev + originalWords.join(''));
    }

    setUserInput(value);
  };

  const finishTest = (finalInputOverride?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState(GameState.FINISHED);
    setTimeRemaining(0);
    
    const finalInput = finalInputOverride !== undefined ? finalInputOverride : userInput;
    const now = Date.now();
    const safeStartTime = startTime || (now - timeLimit * 1000); 
    const duration = Math.min((now - safeStartTime) / 1000, timeLimit); 
    
    const { wpm, raw, accuracy, correct, errors } = calculateStats(finalInput, duration);

    const newStats = {
        wpm,
        raw,
        accuracy,
        consistency: Math.floor(Math.random() * 20) + 80, 
        errors,
        time: Math.round(duration),
        characters: {
            correct,
            incorrect: errors,
            extra: 0,
            missed: 0 // In infinite mode, you can't really "miss" untyped words
        },
        history: [...history, { second: Math.floor(duration), wpm, raw }]
    };

    setStats(newStats);

    // Update Leaderboard
    const newEntry: LeaderboardEntry = {
        id: Date.now().toString(),
        username: username,
        wpm: newStats.wpm,
        accuracy: newStats.accuracy,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase()
    };

    setLeaderboard(prev => {
        const updated = [...prev, newEntry];
        return updated.sort((a, b) => b.wpm - a.wpm);
    });
  };

  // Mode/Config Switchers
  const changeMode = (mode: GameMode) => {
      setGameMode(mode);
      loadNewTest(mode);
  };

  const changeTime = (time: TimeOption) => {
      setTimeLimit(time);
      setTimeRemaining(time);
      loadNewTest();
  };

  // Hotkey restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        loadNewTest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, timeLimit]);

  // Username Input View
  if (!username) {
      return (
        <div className="min-h-screen bg-theme-bg text-theme-text font-mono flex flex-col items-center justify-center p-8 transition-colors duration-300">
            <div className="flex flex-col items-center gap-8">
                <div className="text-4xl font-bold text-theme-main lowercase">
                    <span className="text-theme-text">monkey</span>see
                </div>
                <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-4 items-center">
                    <label className="text-theme-sub lowercase text-sm">please enter your identifier</label>
                    <input 
                        autoFocus
                        autoComplete="off"
                        type="text" 
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        className="bg-transparent border-b-2 border-theme-sub text-center text-2xl text-theme-textActive focus:border-theme-main outline-none pb-2 w-64 transition-colors placeholder-theme-sub"
                        placeholder="type name..."
                        maxLength={15}
                    />
                    <button 
                        type="submit"
                        disabled={!tempUsername.trim()}
                        className="mt-4 px-6 py-2 bg-theme-main text-theme-bg rounded font-bold lowercase hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        start typing
                    </button>
                </form>
                
                 <div className="flex gap-2 bg-black/10 p-1.5 rounded-lg mt-8">
                    {THEMES.map(theme => (
                        <button
                            key={theme.name}
                            onClick={() => setCurrentTheme(theme)}
                            className={`w-3 h-3 rounded-full transition-all hover:scale-125 ${currentTheme.name === theme.name ? 'ring-1 ring-offset-1 ring-offset-theme-bg ring-theme-text' : ''}`}
                            style={{ backgroundColor: theme.colors.main }}
                            title={theme.name.replace('_', ' ')}
                        />
                    ))}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-mono flex flex-col items-center p-8 transition-colors duration-300 select-none">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-end mb-8 md:mb-12">
        <div className="flex flex-col gap-1 cursor-pointer" onClick={() => setView('TEST')}>
            <div className="text-3xl font-bold text-theme-textActive flex items-center gap-2 lowercase">
                <span className="text-theme-main">monkey</span>see
            </div>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col items-end gap-2">
             <div className="text-xs text-theme-sub lowercase mb-2">
                logged in as <span className="text-theme-main">{username}</span>
            </div>
            <nav className="flex gap-6 text-sm lowercase text-theme-sub">
                <button 
                    onClick={() => setView('TEST')} 
                    className={`hover:text-theme-textActive transition-colors ${view === 'TEST' ? 'text-theme-textActive' : ''}`}
                >
                    test
                </button>
                <button 
                    onClick={() => setView('LEADERBOARD')} 
                    className={`hover:text-theme-textActive transition-colors ${view === 'LEADERBOARD' ? 'text-theme-textActive' : ''}`}
                >
                    leaderboard
                </button>
            </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-5xl flex-grow flex flex-col justify-center relative">
        
        {view === 'TEST' ? (
          <>
            {/* Configuration Bar */}
            <div className={`flex justify-center transition-opacity duration-300 ${gameState === GameState.RUNNING ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                 <div className="flex items-center bg-black/20 rounded-lg p-1 text-sm text-theme-sub gap-4 px-4 lowercase">
                    {/* Modes */}
                    <div className="flex gap-2 border-r border-theme-sub/20 pr-4">
                        <button 
                            onClick={() => changeMode(GameMode.CASUAL)}
                            className={`px-2 transition-colors ${gameMode === GameMode.CASUAL ? 'text-theme-main' : 'hover:text-theme-textActive'}`}
                        >
                            casual
                        </button>
                        <button 
                            onClick={() => changeMode(GameMode.COMPETITION)}
                            className={`px-2 transition-colors ${gameMode === GameMode.COMPETITION ? 'text-theme-main' : 'hover:text-theme-textActive'}`}
                        >
                            competition
                        </button>
                    </div>

                    {/* Time Options */}
                    <div className="flex gap-2">
                        {[15, 30, 60, 120].map((t) => (
                            <button 
                                key={t}
                                onClick={() => changeTime(t as TimeOption)}
                                className={`px-2 transition-colors ${timeLimit === t ? 'text-theme-main' : 'hover:text-theme-textActive'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

            {/* Finished State - Results */}
            {gameState === GameState.FINISHED && stats ? (
                <div className="animate-fade-in w-full mt-8">
                    <div className="flex flex-col md:flex-row gap-12 mb-12 lowercase">
                        <div className="flex flex-col justify-center min-w-[200px]">
                             <div className="flex flex-col mb-4">
                                <span className="text-3xl text-theme-sub">wpm</span>
                                <span className="text-8xl text-theme-main font-bold leading-none">{stats.wpm}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl text-theme-sub">acc</span>
                                <span className="text-8xl text-theme-main font-bold leading-none">{stats.accuracy}%</span>
                            </div>
                        </div>

                        <div className="flex-grow">
                             <ResultChart data={stats.history} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm lowercase border-t border-theme-sub/10 pt-8">
                         <div className="flex flex-col gap-1">
                            <span className="text-theme-sub">test type</span>
                            <span className="text-theme-textActive">{gameMode} {timeLimit}s</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-theme-sub">characters</span>
                            <span className="text-theme-textActive" title="correct/incorrect/extra/missed">
                                {stats.characters.correct}/{stats.characters.incorrect}/{stats.characters.extra}/{stats.characters.missed}
                            </span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-theme-sub">consistency</span>
                            <span className="text-theme-textActive">{stats.consistency}%</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-theme-sub">time</span>
                            <span className="text-theme-textActive">{stats.time}s</span>
                         </div>
                    </div>

                    <div className="flex justify-center mt-12 lowercase gap-4">
                        <button 
                             onClick={() => loadNewTest()}
                             className="px-8 py-3 bg-theme-sub/20 text-theme-text rounded hover:bg-theme-text hover:text-theme-bg transition-colors focus:outline-none"
                        >
                            next test
                        </button>
                        <button 
                             onClick={() => setView('LEADERBOARD')}
                             className="px-8 py-3 bg-transparent border border-theme-sub/50 text-theme-sub rounded hover:border-theme-text hover:text-theme-text transition-colors focus:outline-none"
                        >
                            view leaderboard
                        </button>
                    </div>
                </div>
            ) : (
                /* Typing Interface */
                <TypingArea 
                    words={displayWords}
                    userInput={userInput}
                    gameState={gameState}
                    onInputChange={handleInputChange}
                    onRestart={() => loadNewTest()}
                    timeRemaining={timeRemaining}
                />
            )}
          </>
        ) : (
          /* Leaderboard View */
          <div className="w-full max-w-4xl mx-auto animate-fade-in mt-8">
            <div className="flex justify-between items-end mb-8 lowercase">
                <h2 className="text-2xl text-theme-textActive">live leaderboard</h2>
                <div className="text-sm text-theme-sub">top results</div>
            </div>
            
            <div className="rounded-lg overflow-hidden bg-black/10">
                <table className="w-full text-left lowercase text-sm">
                    <thead className="text-theme-sub border-b border-theme-sub/10">
                        <tr>
                            <th className="p-4 font-normal">#</th>
                            <th className="p-4 font-normal">user</th>
                            <th className="p-4 font-normal">wpm</th>
                            <th className="p-4 font-normal">accuracy</th>
                            <th className="p-4 font-normal text-right">date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-sub/10">
                        {leaderboard.map((entry, idx) => (
                            <tr key={entry.id} className={`hover:bg-theme-text/5 transition-colors ${entry.username === username ? 'bg-theme-main/10' : idx % 2 === 0 ? 'bg-white/5' : ''}`}>
                                <td className="p-4 text-theme-main font-bold">{idx + 1}</td>
                                <td className="p-4 text-theme-textActive flex items-center gap-2">
                                   <div className="w-6 h-6 rounded-full bg-theme-sub/20 flex items-center justify-center text-[10px] text-theme-textActive font-bold">
                                        {entry.username[0]}
                                   </div>
                                   {entry.username} {entry.username === username && <span className="text-[10px] text-theme-sub ml-1">(you)</span>}
                                </td>
                                <td className="p-4 font-bold text-lg">{entry.wpm}</td>
                                <td className="p-4">{entry.accuracy}%</td>
                                <td className="p-4 text-right opacity-60">{entry.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-12 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-theme-sub pt-8 lowercase gap-6 transition-opacity duration-300">
        <div className="flex gap-6">
            <a href="#" className="hover:text-theme-textActive transition-colors">contact</a>
            <a href="#" className="hover:text-theme-textActive transition-colors">github</a>
            <a href="#" className="hover:text-theme-textActive transition-colors">terms</a>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex gap-2 bg-black/10 p-1.5 rounded-lg">
                {THEMES.map(theme => (
                    <button
                        key={theme.name}
                        onClick={() => setCurrentTheme(theme)}
                        className={`w-3 h-3 rounded-full transition-all hover:scale-125 ${currentTheme.name === theme.name ? 'ring-1 ring-offset-1 ring-offset-theme-bg ring-theme-text' : ''}`}
                        style={{ backgroundColor: theme.colors.main }}
                        title={theme.name.replace('_', ' ')}
                    />
                ))}
            </div>
        </div>
        
        <div className="opacity-50">v2.1.0</div>
      </footer>
    </div>
  );
};

export default App;