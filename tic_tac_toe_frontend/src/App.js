import React, { useState, useEffect } from 'react';
import './App.css';

/*
  Color Palette from spec:
    --accent: #ffeb3b (yellow)
    --primary: #1976d2 (blue)
    --secondary: #424242 (dark gray)
  Theme: Light, modern, minimal.
*/

/* --- Square Component --- */
function Square({ value, onClick, isHighlight }) {
  return (
    <button
      className={`ttt-square${isHighlight ? ' highlight' : ''}`}
      onClick={onClick}
      aria-label={`Square ${value || 'empty'}`}
    >
      {value}
    </button>
  );
}

/* --- Board Component --- */
function Board({ squares, onClick, winLine }) {
  function renderSquare(i) {
    const highlight = winLine && winLine.includes(i);
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onClick(i)}
        isHighlight={highlight}
      />
    );
  }

  // Responsive CSS grid 3x3
  return (
    <div className="ttt-board">
      {[0, 1, 2].map(row =>
        <div key={row} className="ttt-row">
          {[0, 1, 2].map(col => renderSquare(3 * row + col))}
        </div>
      )}
    </div>
  );
}

// --- Helper for winner determination ---
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6] // diagonals
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line };
    }
  }
  return null;
}

// --- Simple AI (random-move, improveable) ---
function getAIMove(squares) {
  // Look for immediate win/loss block, otherwise play random
  const emptyIndices = squares.map((v, i) => v ? null : i).filter(v => v !== null);

  for (let symbol of ['O', 'X']) {
    // Try each empty spot, see if symbol can win/block
    for (let idx of emptyIndices) {
      const test = squares.slice();
      test[idx] = symbol;
      if (calculateWinner(test)) return idx;
    }
  }
  // Take center if open
  if (squares[4] === null) return 4;
  // Take random
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// --- Main Game Component ---
function TicTacToeGame({ mode, onScoreUpdate }) {
  // mode: 'single' or 'two'
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [step, setStep] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);
  const [status, setStatus] = useState('');
  const [winLine, setWinLine] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // For score:
  const [score, setScore] = useState({ X: 0, O: 0, Draw: 0 });

  useEffect(() => {
    // Reset state on mode change
    setHistory([Array(9).fill(null)]);
    setStep(0);
    setXIsNext(true);
    setStatus('');
    setWinLine(null);
    setIsAnimating(false);
  }, [mode]);

  useEffect(() => {
    // AI move if needed
    const squares = history[step];
    const winnerResult = calculateWinner(squares);
    if (winnerResult) {
      setStatus(`${winnerResult.winner} wins!`);
      setWinLine(winnerResult.line);
      setIsAnimating(true);
      if (score[winnerResult.winner] !== undefined) {
        setScore(prev => {
          const updated = { ...prev, [winnerResult.winner]: prev[winnerResult.winner] + 1 };
          onScoreUpdate && onScoreUpdate(updated);
          return updated;
        });
      }
      return;
    }
    if (squares.every(Boolean)) {
      setStatus("It's a draw!");
      setWinLine(null);
      setIsAnimating(true);
      setScore(prev => {
        const updated = { ...prev, Draw: prev.Draw + 1 };
        onScoreUpdate && onScoreUpdate(updated);
        return updated;
      });
      return;
    }
    setIsAnimating(false);

    if (
      mode === 'single' &&
      !xIsNext &&
      !winnerResult
    ) {
      // Schedule AI move
      const aiMoveTimeout = setTimeout(() => {
        const aiIdx = getAIMove(squares);
        handleClick(aiIdx);
      }, 400);
      return () => clearTimeout(aiMoveTimeout);
    }
    // eslint-disable-next-line
  }, [history, step, mode, xIsNext]);

  function handleClick(i) {
    const squares = history[step];
    if (calculateWinner(squares) || squares[i] || isAnimating) return;
    if (mode === 'single' && !xIsNext) return; // Prevent clicking during AI's turn

    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    setHistory(hist => [...hist.slice(0, step + 1), nextSquares]);
    setStep(s => s + 1);
    setXIsNext(x => !x);
  }

  function handleRestart() {
    setHistory([Array(9).fill(null)]);
    setStep(0);
    setXIsNext(true);
    setStatus('');
    setWinLine(null);
    setIsAnimating(false);
  }

  // UI status message
  const currentSquares = history[step];
  let turnMsg = '';
  if (status) {
    turnMsg = status;
  } else {
    if (mode === 'single') {
      turnMsg = xIsNext ? "Your turn (X)" : "AI's turn (O)";
    } else {
      turnMsg = xIsNext ? "Player 1 (X) turn" : "Player 2 (O) turn";
    }
  }

  return (
    <div className="ttt-game-area">
      <div className="ttt-info">
        <div className="ttt-score-row">
          <span className="ttt-score ttt-x">X: {score.X}</span>
          <span className="ttt-score ttt-o">O: {score.O}</span>
          <span className="ttt-score ttt-draw">Draw: {score.Draw}</span>
        </div>
        <div className="ttt-status">{turnMsg}</div>
      </div>
      <Board squares={currentSquares} onClick={handleClick} winLine={winLine} />
      <div className="ttt-game-actions">
        <button className="ttt-btn" onClick={handleRestart} disabled={isAnimating}>
          Restart Game
        </button>
      </div>
    </div>
  );
}

// --- Mode Selection Modal ---
function ModeSelector({ mode, setMode }) {
  return (
    <div className="ttt-modal-overlay">
      <div className="ttt-modal">
        <h2>Tic-Tac-Toe</h2>
        <div className="ttt-modal-actions">
          <button className={`ttt-btn${mode === 'single' ? ' selected' : ''}`}
            onClick={() => setMode('single')}
          >
            Single Player (AI)
          </button>
          <button className={`ttt-btn${mode === 'two' ? ' selected' : ''}`}
            onClick={() => setMode('two')}
          >
            Two Player
          </button>
        </div>
        <div style={{ fontSize: 14, marginTop: 24, color: 'var(--secondary, #424242)', opacity: 0.7 }}>
          <span role="img" aria-label="light bulb">💡</span> X goes first. Refresh to switch mode later.
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState(null); // 'single' or 'two'
  const [globalScore, setGlobalScore] = useState({ X: 0, O: 0, Draw: 0 });

  // Theme sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Score updater callback
  function updateScore(updated) {
    setGlobalScore(updated);
  }

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App" style={{ minHeight: '100vh' }}>
      <header className="ttt-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main>
        {mode === null ? (
          <ModeSelector mode={"none"} setMode={setMode} />
        ) : (
          <div className="ttt-center-container">
            {/* Responsive Centered */}
            <h1 className="ttt-title" style={{ marginBottom: 12, color: 'var(--primary, #1976d2)' }}>
              Tic-Tac-Toe
            </h1>
            <TicTacToeGame mode={mode} onScoreUpdate={updateScore} />
            <div className="ttt-mode-chip">
              Mode: <strong>{mode === 'single' ? 'Single Player (AI)' : 'Two Player'}</strong>
            </div>
          </div>
        )}
      </main>
      <footer className="ttt-footer">
        <span>
          <span style={{ fontWeight: 600, color: "#1976d2" }}>Tic-Tac-Toe Arena</span> &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

export default App;
