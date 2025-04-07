import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './fast.css';

const Fastest = () => {
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [actionHistory, setActionHistory] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winner, setWinner] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const savedPlayers = localStorage.getItem('fastestTo100Players');
    const savedHistory = localStorage.getItem('fastestTo100History');
    
    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    if (savedHistory) setActionHistory(JSON.parse(savedHistory));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('fastestTo100Players', JSON.stringify(players));
    localStorage.setItem('fastestTo100History', JSON.stringify(actionHistory));
  }, [players, actionHistory]);

  // Check for winner
  useEffect(() => {
    const activePlayers = players.filter(p => !p.eliminated);
    if (activePlayers.length === 1 && players.length > 1) {
      setWinner(activePlayers[0]);
      setShowConfetti(true);
      
      const action = {
        type: 'winner',
        playerId: activePlayers[0].id,
        playerName: activePlayers[0].name,
        timestamp: new Date()
      };
      
      setActionHistory(prev => [action, ...prev]);
    } else {
      setWinner(null);
      setShowConfetti(false);
    }
  }, [players]);

  const addPlayer = () => {
    if (playerName.trim()) {
      const newPlayer = {
        id: Date.now(),
        name: playerName.trim(),
        score: 0,
        eliminated: false,
        history: []
      };
      
      setPlayers(prev => [...prev, newPlayer]);
      
      const action = {
        type: 'add_player',
        playerId: newPlayer.id,
        playerName: newPlayer.name,
        timestamp: new Date()
      };
      
      setActionHistory(prev => [action, ...prev]);
      setPlayerName('');
    }
  };

  const addScore = (playerId, scoreValue) => {
    const scoreNum = parseInt(scoreValue);
    if (!isNaN(scoreNum) && scoreNum > 0) {
      setPlayers(prev => prev.map(player => {
        if (player.id === playerId && !player.eliminated) {
          const newScore = player.score + scoreNum;
          const isEliminated = newScore >= 100;
          
          const scoreHistory = {
            points: scoreNum,
            previousScore: player.score,
            newScore: Math.min(newScore, 100),
            timestamp: new Date(),
            eliminated: isEliminated
          };
          
          const action = {
            type: 'add_score',
            playerId: player.id,
            playerName: player.name,
            previousScore: player.score,
            scoreAdded: scoreNum,
            newScore: Math.min(newScore, 100),
            wasEliminated: isEliminated,
            timestamp: new Date()
          };
          
          setActionHistory(prev => [action, ...prev]);
          
          return {
            ...player,
            score: Math.min(newScore, 100),
            eliminated: isEliminated,
            history: [...player.history, scoreHistory]
          };
        }
        return player;
      }));
    }
  };

  const quickAddScore = (playerId, points) => {
    addScore(playerId, points);
  };

  const undoLastAction = () => {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory[0];
    
    switch (lastAction.type) {
      case 'add_player':
        setPlayers(prev => prev.filter(p => p.id !== lastAction.playerId));
        break;
        
      case 'add_score':
        setPlayers(prev => prev.map(player => {
          if (player.id === lastAction.playerId) {
            return {
              ...player,
              score: lastAction.previousScore,
              eliminated: lastAction.wasEliminated ? false : player.eliminated,
              history: player.history.slice(0, -1)
            };
          }
          return player;
        }));
        break;
        
      case 'winner':
        break;

      case 'remove_player':
        setPlayers(prev => [...prev, {
          id: lastAction.playerId,
          name: lastAction.playerName,
          score: 0,
          eliminated: false,
          history: []
        }]);
        break; 
        
      default:
        break;
    }
    
    setActionHistory(prev => prev.slice(1));
  };

  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset the game? All progress will be lost.')) {
      setPlayers([]);
      setActionHistory([]);
      setWinner(null);
    }
  };

  const removePlayer = (playerId) => {
    if (window.confirm('Remove this player?')) {
      const player = players.find(p => p.id === playerId);
      
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      
      const action = {
        type: 'remove_player',
        playerId: player.id,
        playerName: player.name,
        timestamp: new Date()
      };
      
      setActionHistory(prev => [action, ...prev]);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activePlayersCount = players.filter(p => !p.eliminated).length;
  const eliminatedPlayersCount = players.filter(p => p.eliminated).length;

  return (
    <div className="container">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
      
      <header>
        <h1>Fastest to 100</h1>
        <p>Race to 100 points! First to reach 100 is eliminated. Last player standing wins!</p>
      </header>
      
      <div className="game-description">
        <p><span className="highlight">How to play:</span> Add players, then add points as they score.</p>
        <p>The first player to reach 100 points is eliminated. The last remaining player wins!</p>
      </div>
      
      <div className="game-controls">
        <button className="danger" onClick={resetGame} disabled={players.length === 0}>
          <span className="emoji">🔄</span> Reset Game
        </button>
      </div>
      
      <div className="stats">
        <div className="stat-card">
          <h4>Total Players</h4>
          <p>{players.length}</p>
        </div>
        <div className="stat-card">
          <h4>Active</h4>
          <p>{activePlayersCount}</p>
        </div>
        <div className="stat-card">
          <h4>Eliminated</h4>
          <p>{eliminatedPlayersCount}</p>
        </div>
      </div>
      
      <div className="add-player">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter player name"
          onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
        />
        <button onClick={addPlayer}>
          <span className="emoji">➕</span> Add Player
        </button>
      </div>
      
      <div className="players-list">
        {players.length === 0 ? (
          <div className="no-players">
            <p>No players yet. Add players to start the game!</p>
            <p><span className="emoji">👆</span> Use the field above</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className={`player-card ${player.eliminated ? 'eliminated' : ''} ${winner?.id === player.id ? 'winner' : ''}`}
            >
              <div className="player-info">
                <div className="player-name">
                  {winner?.id === player.id && <span className="crown">👑</span>}
                  {player.name}
                </div>
                <div className="player-score">
                  <span className="emoji">🎯</span> Score: {player.score}/100
                </div>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${(player.score / 100) * 100}%` }}></div>
                </div>
                <div className="quick-add-buttons">
                  <button onClick={() => quickAddScore(player.id, 1)} disabled={player.eliminated}>+1</button>
                  <button onClick={() => quickAddScore(player.id, 5)} disabled={player.eliminated}>+5</button>
                  <button onClick={() => quickAddScore(player.id, 10)} disabled={player.eliminated}>+10</button>
                  <button onClick={() => quickAddScore(player.id, 25)} disabled={player.eliminated}>+25</button>
                </div>
              </div>
              <div className="score-actions">
                <input
                  type="number"
                  className="score-input"
                  placeholder="Points"
                  min="1"
                  disabled={player.eliminated}
                  onKeyPress={(e) => e.key === 'Enter' && addScore(player.id, e.target.value)}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.closest('.score-actions').querySelector('.score-input');
                    addScore(player.id, input.value);
                    input.value = '';
                  }}
                  disabled={player.eliminated}
                >
                  <span className="emoji">➕</span> Add
                </button>
                <button
                  className="danger"
                  onClick={() => removePlayer(player.id)}
                >
                  <span className="emoji">❌</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="action-history">
        <h3>
          <span><span className="emoji">📜</span> Game History</span>
          <button
            className={`secondary ${actionHistory.length === 0 ? 'disabled' : ''}`}
            onClick={undoLastAction}
            disabled={actionHistory.length === 0}
          >
            <span className="emoji">↩️</span> Undo
          </button>
        </h3>
        <div className="history-list">
          {actionHistory.length === 0 ? (
            <div className="history-item">No actions yet. Start playing to see history.</div>
          ) : (
            actionHistory.slice(0, 10).map((action, index) => (
              <div
                key={index}
                className={`history-item ${action.type === 'add_player' ? 'add' : ''} ${action.type === 'add_score' ? 'score' : ''} ${action.wasEliminated ? 'eliminated' : ''} ${action.type === 'winner' ? 'winner' : ''}`}
              >
                <span>
                  {action.type === 'add_player' && `Added player "${action.playerName}"`}
                  {action.type === 'add_score' && `${action.playerName}: ${action.previousScore} → ${action.newScore} (+${action.scoreAdded})${action.wasEliminated ? ' (Eliminated!)' : ''}`}
                  {action.type === 'remove_player' && `Removed player "${action.playerName}"`}
                  {action.type === 'winner' && `🏆 ${action.playerName} is the WINNER! 🏆`}
                </span>
                <span>{formatTime(action.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Fastest;