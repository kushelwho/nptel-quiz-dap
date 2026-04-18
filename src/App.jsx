import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Dynamically import all assignment json files
const assignmentFiles = import.meta.glob('../data/assignments/*.json', { eager: true });
// Dynamically import all mock test json files
const mockFiles = import.meta.glob('../data/mock_tests/*.json', { eager: true });

function App() {
  const [view, setView] = useState('home'); // home, year, timer-config, quiz
  const [selectedYear, setSelectedYear] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizMode, setQuizMode] = useState('practice'); // practice, exam
  const [quizDuration, setQuizDuration] = useState(30); // in minutes
  const [quizShuffle, setQuizShuffle] = useState(false); // whether to shuffle questions
  const [timerConfig, setTimerConfig] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const years = Object.keys(assignmentFiles).map(path => {
    const match = path.match(/a_(\d+)\.json$/);
    const year = match ? match[1] : path;
    const defaultData = assignmentFiles[path].default || assignmentFiles[path];
    return { year, data: defaultData };
  }).sort((a,b) => b.year - a.year);

  const mocks = Object.keys(mockFiles).map(path => {
    const match = path.match(/([^\/]+)\.json$/);
    const name = match ? match[1] : path;
    const defaultData = mockFiles[path].default || mockFiles[path];
    return { name, data: defaultData };
  }).sort((a,b) => a.name.localeCompare(b.name));

  const openTimerConfig = (questions, mode) => {
    setTimerConfig({ questions, mode, duration: 30, shuffle: false });
    setView('timer-config');
  };

  const handleTimerAdjust = (change) => {
    setTimerConfig(prev => {
      let newDur = prev.duration + change;
      if (newDur < 30) newDur = 30;
      if (newDur > 180) newDur = 180;
      return { ...prev, duration: newDur };
    });
  };

  const startQuiz = () => {
    setQuizQuestions(timerConfig.questions || []);
    setQuizMode(timerConfig.mode);
    setQuizDuration(timerConfig.duration);
    setQuizShuffle(timerConfig.shuffle);
    setView('quiz');
  };

  const renderTimerConfig = () => (
    <div className="timer-modal-container">
      <div className="timer-modal">
        <h2>Configure Quiz Timer</h2>
        <p>Set the time limit for this {timerConfig.mode} test.</p>
        
        <div className="timer-controls">
          <button onClick={() => handleTimerAdjust(-30)} disabled={timerConfig.duration <= 30}>- 30 min</button>
          <span className="timer-display">{timerConfig.duration} Mins</span>
          <button onClick={() => handleTimerAdjust(30)} disabled={timerConfig.duration >= 180}>+ 30 min</button>
        </div>

        <div className="shuffle-control" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="shuffle-checkbox" 
            checked={timerConfig.shuffle} 
            onChange={(e) => setTimerConfig(prev => ({ ...prev, shuffle: e.target.checked }))} 
          />
          <label htmlFor="shuffle-checkbox" style={{ cursor: 'pointer' }}>Shuffle Questions</label>
        </div>

        <div className="timer-modal-actions">
          <button className="back-btn outline" onClick={() => setView('home')}>Cancel</button>
          <button className="next-btn" onClick={startQuiz}>Start Quiz</button>
        </div>
      </div>
    </div>
  );

  const [filterWeek, setFilterWeek] = useState('All Weeks');
  const [filterYear, setFilterYear] = useState('All Years');

  const renderHome = () => {
    const allAvailableYears = ['All Years', ...years.map(y => y.year)];
    const weeks = ['All Weeks', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const startFilteredQuiz = (mode) => {
      let filteredQuestions = [];
      years.forEach(y => {
        if (filterYear === 'All Years' || filterYear === y.year) {
          y.data.weeks?.forEach(w => {
            if (filterWeek === 'All Weeks' || parseInt(filterWeek) === parseInt(w.week)) {
              filteredQuestions = filteredQuestions.concat(w.questions || []);
            }
          });
        }
      });

      if (filteredQuestions.length === 0) {
        alert("No questions found for this combination!");
        return;
      }
      openTimerConfig(filteredQuestions, mode);
    };

    return (
      <div className="home-simplified" style={{ marginTop: '30px' }}>
        <h1 style={{textAlign: 'center', marginBottom: '2rem'}}>NPTEL Data Analytics with Python</h1>

        <div className="filter-section">
          <h3>Filter by Week</h3>
          <div className="chips-container">
            {weeks.map(w => (
              <button 
                key={w} 
                className={`chip ${filterWeek === w ? 'active' : ''}`}
                onClick={() => setFilterWeek(w)}
              >
                {w === 'All Weeks' ? 'All Weeks' : `Week ${w}`}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Filter by Year</h3>
          <div className="chips-container">
            {allAvailableYears.map(y => (
              <button 
                key={y} 
                className={`chip ${filterYear === y ? 'active' : ''}`}
                onClick={() => setFilterYear(y)}
              >
                {y === 'All Years' ? 'All Years' : y}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section" style={{ border: 'none', background: 'transparent', padding: '0' }}>
          <h3 style={{marginTop: '2rem', color: 'var(--text-main)'}}>Quiz Mode</h3>
          <div className="mode-cards-container">
            <div className="mode-card" onClick={() => startFilteredQuiz('practice')}>
              <div className="icon">💡</div>
              <h4>Practice</h4>
              <p>Instant feedback after each answer</p>
            </div>
            <div className="mode-card" onClick={() => startFilteredQuiz('exam')}>
              <div className="icon">📝</div>
              <h4>Test</h4>
              <p>See results only at the end</p>
            </div>
          </div>
        </div>

        {mocks && mocks.length > 0 && (
          <div className="filter-section" style={{ marginTop: '2rem' }}>
            <h3>Mock Tests</h3>
            <div className="chips-container" style={{ marginBottom: '1rem' }}>
              {mocks.map(m => (
                <div key={m.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#252525', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #444' }}>
                  <span style={{ color: '#fff', fontWeight: 500 }}>{m.name.toUpperCase()}</span>
                  <button className="chip" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={() => openTimerConfig(m.data.questions, 'practice')}>Practice</button>
                  <button className="chip" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }} onClick={() => openTimerConfig(m.data.questions, 'exam')}>Exam</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderYearView = () => null; // Kept for safety if view state goes to 'year'

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      {view === 'home' && renderHome()}
      {view === 'year' && renderYearView()}
      {view === 'timer-config' && renderTimerConfig()}
      {view === 'quiz' && (
        <Quiz 
          questions={quizQuestions} 
          mode={quizMode} 
          duration={quizDuration}
          shuffle={quizShuffle}
          onClose={() => setView('home')} 
        />
      )}
    </div>
  );
}

function shuffleArray(array) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Format seconds to HH:MM:SS
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function Quiz({ questions, mode, duration, shuffle, onClose }) {
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); 
  const [statuses, setStatuses] = useState({}); // 0:not visited, 1:not answered, 2:answered, 3:marked, 4:answered&marked
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  useEffect(() => {
    if (!questions || questions.length === 0) return;
    
    let qs = shuffle ? shuffleArray(questions) : [...questions];
    qs = qs.map(q => {
      const optionsArr = Object.entries(q.options || {}).map(([key, text]) => ({
        id: key,
        text: text
      }));
      return { ...q, shuffledOptions: shuffle ? shuffleArray(optionsArr) : optionsArr };
    });
    
    setShuffledQuestions(qs);
    setCurrentIndex(0);
    setTimeLeft(duration * 60);
    setAnswers({});
    
    const initialStatuses = {};
    qs.forEach((_, idx) => { initialStatuses[idx] = 0; }); // All not visited
    initialStatuses[0] = 1; // First is not answered by default
    setStatuses(initialStatuses);
    
    setIsFinished(false);
  }, [questions, duration]);

  if (!shuffledQuestions || shuffledQuestions.length === 0) {
    return (
      <div className="empty-quiz">
        <h2>No questions available.</h2>
        <button onClick={onClose} className="back-btn">Go Back</button>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const hasAnsweredCurrent = currentAnswer !== undefined;
  const isPractice = mode === 'practice';

  const updateStatus = (index, status) => {
    setStatuses(prev => ({ ...prev, [index]: status }));
  };

  const jumpToQuestion = (idx) => {
    if (statuses[idx] === 0) {
      updateStatus(idx, 1);
    }
    setCurrentIndex(idx);
  };

  const handleOptionSelect = (optId) => {
    if (isPractice && hasAnsweredCurrent) return; // lock in practice 
    setAnswers(prev => ({ ...prev, [currentIndex]: optId }));
  };

  const handleClear = () => {
    if (isPractice && hasAnsweredCurrent) return; // cannot clear in practice if answered
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentIndex];
      return newAnswers;
    });
    updateStatus(currentIndex, 1); // Not Answered
  };

  const handleSaveAndNext = () => {
    if (answers[currentIndex] !== undefined) {
      updateStatus(currentIndex, 2); // Answered
    } else {
      updateStatus(currentIndex, 1); // Not Answered
    }
    if (currentIndex < shuffledQuestions.length - 1) {
      jumpToQuestion(currentIndex + 1);
    }
  };

  const handleSaveAndMarkForReview = () => {
    if (answers[currentIndex] !== undefined) {
      updateStatus(currentIndex, 4); // Answered & Marked
    } else {
      updateStatus(currentIndex, 3); // Marked
    }
    if (currentIndex < shuffledQuestions.length - 1) {
      jumpToQuestion(currentIndex + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    // Usually clears or just marks. Let's just mark it.
    if (answers[currentIndex] !== undefined) {
      updateStatus(currentIndex, 4);
    } else {
      updateStatus(currentIndex, 3);
    }
    if (currentIndex < shuffledQuestions.length - 1) {
      jumpToQuestion(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    setIsFinished(true);
  };

  const cancelSubmit = () => {
    setShowSubmitModal(false);
  };

  const calculateScore = () => {
    return shuffledQuestions.reduce((score, q, idx) => {
      return (answers[idx] === q.answer) ? score + 1 : score;
    }, 0);
  };

  const renderFinished = () => (
    <div className="results-container">
      <h2>Test Completed!</h2>
      <div className="score-box">
        <h3>Final Score: {calculateScore()} / {shuffledQuestions.length}</h3>
      </div>
      
      <div className="detailed-results">
        {shuffledQuestions.map((q, idx) => {
          const userAns = answers[idx];
          const isCorrect = userAns === q.answer;
          return (
            <div key={idx} className={`result-item ${isCorrect ? 'correct-result' : 'incorrect-result'}`}>
              <p className="q-text"><strong>Q{idx+1}: {q.question}</strong></p>
              <p className="your-ans">Your Answer: {q.options[userAns] || 'Not answered'}</p>
              {!isCorrect && (
                <p className="correct-ans">Correct Answer: {q.options[q.answer]}</p>
              )}
            </div>
          );
        })}
      </div>
      <button className="cbt-submit-btn" onClick={onClose} style={{margin: '2rem auto', display:'block'}}>Back to Dashboard</button>
    </div>
  );

  if (isFinished) return renderFinished();

  // Calculate legend stats
  const stats = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0};
  Object.values(statuses).forEach(s => { stats[s] = (stats[s] || 0) + 1; });

  const getStatusClass = (status) => {
    switch(status) {
      case 0: return 'not-visited';
      case 1: return 'not-answered';
      case 2: return 'answered';
      case 3: return 'marked';
      case 4: return 'answered-marked';
      default: return 'not-visited';
    }
  };

  return (
    <div className="cbt-layout">
      {/* Header */}
      <div className="cbt-header">
        <div className="cbt-header-title">NPTEL Mock Test</div>
        <div className="cbt-header-right">
          <span className="cbt-timer">Time Left: {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="cbt-main">
        {/* Left pane: Question and options */}
        <div className="cbt-left-pane">
          <div className="cbt-question-header">
            <h4>Question {currentIndex + 1}:</h4>
            {isPractice && hasAnsweredCurrent && (
              <span className={`practice-feedback ${currentAnswer === currentQ.answer ? 'success' : 'error'}`}>
                {currentAnswer === currentQ.answer ? '✅ Correct' : '❌ Incorrect'}
              </span>
            )}
          </div>
          
          <div className="cbt-question-content">
            <p className="q-text">{currentQ.question}</p>
            <div className="cbt-options">
              {currentQ.shuffledOptions.map(opt => {
                const isSelected = answers[currentIndex] === opt.id;
                let optClass = 'cbt-option-item';
                
                if (isPractice && hasAnsweredCurrent) {
                  if (opt.id === currentQ.answer) optClass += ' correct';
                  else if (opt.id === currentAnswer) optClass += ' incorrect';
                  else optClass += ' disabled';
                } else if (isSelected) {
                  optClass += ' selected';
                }

                return (
                  <div 
                    key={opt.id} 
                    className={optClass}
                    onClick={() => handleOptionSelect(opt.id)}
                  >
                    <div className={`cbt-radio ${isSelected ? 'active' : ''}`}></div>
                    <span>{opt.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cbt-actions-bar">
            <div className="cbt-actions-left">
              <button className="cbt-btn primary" onClick={handleSaveAndNext}>SAVE & NEXT</button>
              <button className="cbt-btn outline" onClick={handleClear}>CLEAR</button>
              <button className="cbt-btn warning" onClick={handleSaveAndMarkForReview}>SAVE AND MARK FOR REVIEW</button>
              <button className="cbt-btn info" onClick={handleMarkForReviewAndNext}>MARK FOR REVIEW & NEXT</button>
            </div>
            <div className="cbt-actions-nav">
              <button 
                className="cbt-btn secondary" 
                onClick={() => currentIndex > 0 && jumpToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                &lt; BACK
              </button>
              <button 
                className="cbt-btn secondary" 
                onClick={() => currentIndex < shuffledQuestions.length - 1 && jumpToQuestion(currentIndex + 1)}
                disabled={currentIndex === shuffledQuestions.length - 1}
              >
                NEXT &gt;
              </button>
              <button className="cbt-btn submit" onClick={handleSubmit}>SUBMIT</button>
            </div>
          </div>
        </div>

        {/* Right pane: Pallet and legend */}
        <div className="cbt-right-pane">
          <div className="cbt-profile">
            <div className="profile-img">👤</div>
            <div>
              <strong>Student Details</strong>
              <div>Mode: {mode.toUpperCase()}</div>
            </div>
          </div>

          <div className="cbt-legend">
            <div className="legend-row">
              <div className="legend-item"><span className="legend-box not-visited">{stats[0]}</span> Not Visited</div>
              <div className="legend-item"><span className="legend-box not-answered">{stats[1]}</span> Not Answered</div>
            </div>
            <div className="legend-row">
              <div className="legend-item"><span className="legend-box answered">{stats[2]}</span> Answered</div>
              <div className="legend-item"><span className="legend-box marked">{stats[3]}</span> Marked for Review</div>
            </div>
            <div className="legend-row">
              <div className="legend-item full"><span className="legend-box answered-marked">{stats[4]}</span> Answered & Marked for Review</div>
            </div>
          </div>

          <div className="cbt-palette">
            <h4>Question Palette</h4>
            <div className="cbt-grid">
              {shuffledQuestions.map((_, idx) => (
                <button 
                  key={idx} 
                  className={`cbt-grid-btn ${getStatusClass(statuses[idx])}`}
                  onClick={() => jumpToQuestion(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="submit-modal-container">
          <div className="submit-modal">
            <h3>Submit Exam</h3>
            <p>Are you sure you want to submit the exam?</p>
            <div className="submit-modal-actions">
              <button className="cbt-btn outline" onClick={cancelSubmit}>Cancel</button>
              <button className="cbt-btn primary" onClick={confirmSubmit}>Yes, Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
