import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { GameState } from '../types';

interface TypingAreaProps {
  words: string[];
  userInput: string;
  gameState: GameState;
  onInputChange: (value: string) => void;
  onRestart: () => void;
  timeRemaining: number | null;
}

export const TypingArea: React.FC<TypingAreaProps> = ({
  words,
  userInput,
  gameState,
  onInputChange,
  onRestart,
  timeRemaining
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const [caretPosition, setCaretPosition] = useState({ top: 0, left: 0 });
  const [marginTop, setMarginTop] = useState(0);

  // Keep focus on input
  useEffect(() => {
    if (gameState !== GameState.FINISHED) {
      inputRef.current?.focus();
    }
  }, [gameState, userInput]);

  // Handle focus loss
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Auto-scroll logic: Keep 3 lines visible (History, Active, Future)
  useLayoutEffect(() => {
    if (activeWordRef.current && containerRef.current) {
        const activeWord = activeWordRef.current;
        const offsetTop = activeWord.offsetTop; 
        
        // Calculate visual position relative to the visible window top
        const visualTop = offsetTop + marginTop;
        
        // Line height is approx 52px (text-3xl + margins)
        // We trigger scroll when entering the 3rd line (approx index 2, > 100px)
        // This keeps Line 1 (History) and Line 2 (Active) visible initially.
        // When moving to Line 3, we scroll up 1 line.
        if (visualTop > 100) {
             setMarginTop(prev => prev - 52); 
        }
    }
    
    // Reset scroll on restart
    if (userInput.length === 0) {
        setMarginTop(0);
    }
  }, [userInput, words]);


  // Logic to render characters with correct coloring
  const renderText = () => {
    let globalCharIndex = 0;

    return (
      <div 
        className="flex flex-wrap content-start select-none relative outline-none max-w-5xl transition-transform duration-300 ease-out" 
        ref={containerRef} 
        onClick={handleContainerClick}
        style={{ transform: `translateY(${marginTop}px)` }}
      >
        {/* Caret Element */}
        {gameState !== GameState.FINISHED && (
          <div 
            className={`absolute w-[2px] h-6 md:h-8 bg-theme-main transition-all duration-75 ${gameState === GameState.IDLE ? 'animate-pulse' : 'animate-caret'}`}
            style={{ 
              top: caretPosition.top, 
              left: caretPosition.left,
            }} 
          />
        )}

        {words.map((word, wordIndex) => {
          // Identify if this word contains the current input cursor
          const wordStartIndex = globalCharIndex;
          const wordEndIndex = wordStartIndex + word.length;
          const isCurrentWord = userInput.length >= wordStartIndex && userInput.length <= wordEndIndex;
          
          return (
          <div 
            key={wordIndex} 
            className="flex mr-4 mb-2 md:mb-4"
            ref={isCurrentWord ? (activeWordRef as any) : null}
          >
            {word.split('').map((char, charIndex) => {
              const currentIndex = globalCharIndex;
              globalCharIndex++; // Increment for next character

              let statusClass = "text-theme-sub opacity-50"; // Default pending
              const userChar = userInput[currentIndex];
              const isCurrent = currentIndex === userInput.length;

              if (userChar !== undefined) {
                 if (userChar === char) {
                   statusClass = "text-theme-textActive opacity-100";
                 } else {
                   statusClass = "text-theme-error opacity-100";
                 }
              }

              return (
                <span 
                  key={`${wordIndex}-${charIndex}`} 
                  className={`${statusClass} text-2xl md:text-3xl relative transition-colors duration-100`}
                  ref={(el) => {
                    // Update caret position when we render the active character
                    if (isCurrent && el) {
                       requestAnimationFrame(() => {
                           setCaretPosition({
                             top: el.offsetTop, 
                             left: el.offsetLeft - 2 
                           });
                       });
                    }
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        )})}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-24 md:mt-32 px-4">
        {/* Timer Display */}
        {timeRemaining !== null && gameState === GameState.RUNNING && (
          <div className="absolute -top-16 left-4 md:left-0 text-3xl font-bold text-theme-main font-mono">
            {timeRemaining}
          </div>
        )}

        {/* Hidden Input for Logic */}
        <input
          ref={inputRef}
          type="text"
          className="absolute opacity-0 cursor-default -z-10"
          value={userInput}
          onChange={(e) => onInputChange(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Visual Display with increased height for 3 lines */}
        <div className="font-mono mb-8 h-40 overflow-hidden relative w-full">
            {renderText()}
        </div>

        {/* Restart Hint */}
        <div className="flex justify-center mt-8 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <button 
                onClick={onRestart}
                className="text-theme-sub hover:text-theme-textActive transition-colors p-3 rounded-lg hover:bg-white/5 focus:outline-none"
                aria-label="Restart Test"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </button>
        </div>
        
        <div className="text-center mt-4 text-xs text-theme-sub lowercase opacity-50 font-mono">
            <span className="bg-theme-text/10 px-1.5 py-0.5 rounded mx-1">tab</span> 
            + 
            <span className="bg-theme-text/10 px-1.5 py-0.5 rounded mx-1">enter</span>
            to restart
        </div>
    </div>
  );
};
