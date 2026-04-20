import { useEffect, useRef, useState, useCallback } from 'react';
import { useDiscussion } from '../contexts/DebateContext';
import { useAIAPI } from '../hooks/useAIAPI';
import { ChatBubble } from './ChatBubble';
import { SystemMessage } from './SystemMessage';
import { saveConversation } from '../utils/storage';
import { exportToMarkdown } from '../utils/export';
import { Play, ChevronRight, User, Terminal, Clock, Brain, Wifi, Hash, CheckCircle, RotateCcw, Download, Zap, Pause } from 'lucide-react';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface DebateArenaProps {
  onExit?: () => void;
}

export const DebateArena: React.FC<DebateArenaProps> = ({ onExit }) => {
  const { state, dispatch } = useDiscussion();
  const { askAI, generateConclusion } = useAIAPI();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hostMessage, setHostMessage] = useState('');
  const [apiLog, setApiLog] = useState<string[]>([]);
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [autoRoundsInput, setAutoRoundsInput] = useState(3);
  const [autoRoundsLeft, setAutoRoundsLeft] = useState(0);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const deepseek = state.roles.find(r => r.id === 'deepseek')!;
  const glm = state.roles.find(r => r.id === 'glm')!;

  // Auto-scroll to bottom
  useEffect(() => {
    if (!userScrolled && messagesEndRef.current && state.status !== 'finished') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages.length, state.currentRound, userScrolled, state.status]);

  // Auto-save conversation when messages are updated
  useEffect(() => {
    if (state.topic && state.messages.length > 0) {
      setSaveStatus('saving');
      const timer = setTimeout(() => {
        try {
          saveConversation(state, state.conversationId || undefined);
          setSaveStatus('saved');
          // 2秒后恢复 idle 状态
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
          console.error('Auto-save failed:', err);
          setSaveStatus('idle');
        }
      }, 500); // 延迟500ms保存，避免频繁写入

      return () => clearTimeout(timer);
    }
  }, [state.messages, state.topic, state.status, state.finalConclusion]);

  // Track user scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setUserScrolled(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 自动轮次：当进入 waiting_host 且还有自动轮次时，启动倒计时
  useEffect(() => {
    if (state.status === 'waiting_host' && autoRoundsLeft > 0 && !isThinking) {
      setAutoCountdown(3);
    }
  }, [state.status, autoRoundsLeft, isThinking]);

  // 倒计时逻辑
  useEffect(() => {
    if (autoCountdown === null) return;
    if (autoCountdown === 0) {
      setAutoRoundsLeft(prev => prev - 1);
      setAutoCountdown(null);
      dispatch({ type: 'NEXT_ROUND' });
      setUserScrolled(false);
      return;
    }
    const timer = setTimeout(() => setAutoCountdown(prev => prev !== null ? prev - 1 : null), 1000);
    return () => clearTimeout(timer);
  }, [autoCountdown, dispatch]);

  const addLog = (msg: string) => {
    setApiLog(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const callDeepSeek = useCallback(async () => {
    setIsThinking(true);
    setError(null);
    addLog('► DeepSeek 开始思考');

    const messageId = generateId();
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { id: messageId, roleId: 'deepseek', content: '', round: state.currentRound },
    });

    await askAI(
      deepseek,
      state.topic,
      state.messages,
      glm,
      true, // isFirstSpeaker
      {
        onContent: (content, reasoningContent) => {
          dispatch({ 
            type: 'UPDATE_MESSAGE', 
            payload: { 
              id: messageId, 
              content, 
              reasoningContent,
              isComplete: false 
            } 
          });
        },
        onComplete: () => {
          addLog('✓ DeepSeek 完成');
          setIsThinking(false);
          dispatch({ type: 'SET_STATUS', payload: 'waiting_glm' });
        },
        onError: (err) => {
          addLog(`✗ 错误: ${err.message}`);
          setError(err.message);
          setIsThinking(false);
        },
      }
    );
  }, [state, dispatch, askAI, deepseek, glm]);

  const callGLM = useCallback(async () => {
    setIsThinking(true);
    setError(null);
    addLog('► GLM-4 开始思考');

    const messageId = generateId();
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { id: messageId, roleId: 'glm', content: '', round: state.currentRound },
    });

    await askAI(
      glm,
      state.topic,
      state.messages,
      deepseek,
      false,
      {
        onContent: (content) => {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              id: messageId,
              content,
              isComplete: false
            }
          });
        },
        onComplete: (searchResults) => {
          addLog('✓ GLM-4 完成');
          if (searchResults && searchResults.length > 0) {
            addLog(`📚 联网搜索到 ${searchResults.length} 条结果`);
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: {
                id: messageId,
                content: state.messages.find(m => m.id === messageId)?.content || '',
                searchResults,
                isComplete: true
              }
            });
          }
          setIsThinking(false);
          dispatch({ type: 'SET_STATUS', payload: 'waiting_host' });
        },
        onError: (err) => {
          addLog(`✗ 错误: ${err.message}`);
          setError(err.message);
          setIsThinking(false);
        },
      }
    );
  }, [state, dispatch, askAI, deepseek, glm]);

  const generateFinalConclusion = useCallback(async () => {
    setIsThinking(true);
    addLog('► 生成综合结论');

    await generateConclusion(
      deepseek,
      state.topic,
      state.messages,
      {
        onContent: (content) => {
          dispatch({ type: 'SET_CONCLUSION', payload: content });
        },
        onComplete: () => {
          addLog('✓ 结论生成完成');
          setIsThinking(false);
        },
        onError: (err) => {
          setError(err.message);
          setIsThinking(false);
        },
      }
    );
  }, [state, dispatch, generateConclusion, deepseek]);

  const handleHostSend = () => {
    setAutoRoundsLeft(0);
    setAutoCountdown(null);
    if (hostMessage.trim()) {
      const messageId = generateId();
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { id: messageId, roleId: 'host', content: hostMessage.trim(), round: state.currentRound },
      });
      setHostMessage('');
    }
    dispatch({ type: 'NEXT_ROUND' });
    setUserScrolled(false);
  };

  const handleAutoStart = () => {
    setAutoRoundsLeft(autoRoundsInput);
  };

  const handleAutoPause = () => {
    setAutoRoundsLeft(0);
    setAutoCountdown(null);
  };

  const handleStart = () => {
    setApiLog([]);
    setUserScrolled(false);
    dispatch({ type: 'SET_STATUS', payload: 'waiting_deepseek' });
  };

  const handleReset = () => {
    if (confirm('确定要重新开始吗？')) {
      dispatch({ type: 'RESET' });
      setError(null);
      setHostMessage('');
      setApiLog([]);
      setUserScrolled(false);
      onExit?.();
    }
  };

  useEffect(() => {
    if (!isThinking && !error) {
      if (state.status === 'waiting_deepseek') {
        callDeepSeek();
      } else if (state.status === 'waiting_glm') {
        callGLM();
      }
    }
  }, [state.status, isThinking, error, callDeepSeek, callGLM]);

  const messagesByRound = state.messages.reduce((acc, msg) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {} as Record<number, typeof state.messages>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting_deepseek': return 'var(--color-deepseek)';
      case 'waiting_glm': return 'var(--color-glm)';
      case 'waiting_host': return 'var(--color-host)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting_deepseek': return 'DeepSeek 思考中';
      case 'waiting_glm': return 'GLM-4 思考中';
      case 'waiting_host': return '等待主持人';
      default: return '准备就绪';
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Top Status Bar */}
      <div 
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div className="flex items-center gap-6">
          {/* Round Badge */}
          <div 
            className="flex items-center gap-2 px-4 py-2"
            style={{ 
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)'
            }}
          >
            <Hash className="w-4 h-4" style={{ color: 'var(--color-accent-gold)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              第 {state.currentRound} 轮
            </span>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: getStatusColor(state.status) }}
            />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {getStatusLabel(state.status)}
            </span>
            {isThinking && (
              <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                <Clock className="w-3 h-3 inline animate-spin mr-1" />
                处理中...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state.status === 'idle' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--color-deepseek)',
                color: 'var(--color-text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Play className="w-4 h-4" />
              开始讨论
            </button>
          )}
          
          {/* Save Status Indicator */}
          {saveStatus !== 'idle' && (
            <span
              className="text-xs px-2 py-1"
              style={{
                color: saveStatus === 'saved' ? 'var(--color-deepseek)' : 'var(--color-text-muted)',
                opacity: 0.8,
              }}
            >
              {saveStatus === 'saving' && '保存中...'}
              {saveStatus === 'saved' && '✓ 已保存'}
            </span>
          )}

          {state.messages.length > 0 && (
            <button
              onClick={() => exportToMarkdown(state)}
              className="flex items-center gap-2 px-3 py-2 text-sm transition-all duration-200"
              style={{
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent-gold)';
                e.currentTarget.style.color = 'var(--color-accent-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
              title="导出为 Markdown"
            >
              <Download className="w-4 h-4" />
              导出 MD
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm transition-all duration-200"
            style={{ 
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent-gold)';
              e.currentTarget.style.color = 'var(--color-accent-gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      {/* AI Status Indicators */}
      <div 
        className="px-6 py-3 flex items-center gap-6 border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        {/* DeepSeek Status */}
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" style={{ color: 'var(--color-deepseek)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>DeepSeek</span>
          {deepseek.features?.deepThinking && (
            <span 
              className="text-[10px] px-1.5 py-0.5"
              style={{ 
                backgroundColor: 'var(--color-deepseek)',
                color: 'var(--color-bg-primary)'
              }}
            >
              深度
            </span>
          )}
          {state.status === 'waiting_deepseek' && isThinking && (
            <span className="text-xs animate-pulse" style={{ color: 'var(--color-deepseek)' }}>
              思考中...
            </span>
          )}
        </div>

        <span style={{ color: 'var(--color-border)' }}>→</span>

        {/* GLM Status */}
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4" style={{ color: 'var(--color-glm)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>GLM-4</span>
          {glm.features?.webSearch && (
            <span 
              className="text-[10px] px-1.5 py-0.5"
              style={{ 
                backgroundColor: 'var(--color-glm)',
                color: 'var(--color-bg-primary)'
              }}
            >
              联网
            </span>
          )}
          {state.status === 'waiting_glm' && isThinking && (
            <span className="text-xs animate-pulse" style={{ color: 'var(--color-glm)' }}>
              思考中...
            </span>
          )}
        </div>

        <span style={{ color: 'var(--color-border)' }}>→</span>

        {/* Host Status */}
        <div 
          className="flex items-center gap-2 px-3 py-1"
          style={{ 
            backgroundColor: state.status === 'waiting_host' ? 'rgba(212, 165, 116, 0.1)' : 'transparent',
            border: state.status === 'waiting_host' ? '1px solid var(--color-host)' : '1px solid transparent'
          }}
        >
          <User className="w-4 h-4" style={{ color: 'var(--color-host)' }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>主持人</span>
          {state.status === 'waiting_host' && (
            <span className="text-xs animate-pulse" style={{ color: 'var(--color-host)' }}>
              请引导 →
            </span>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        {state.messages.length === 0 ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ 
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '2px solid var(--color-border)'
              }}
            >
              <span className="text-4xl">💭</span>
            </div>
            <h3 
              className="font-editorial text-2xl mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              思辨即将开始
            </h3>
            <p className="text-center max-w-md" style={{ color: 'var(--color-text-muted)' }}>
              DeepSeek 与 GLM-4 将围绕「{state.topic}」展开深度对话
            </p>
            {state.status === 'idle' && (
              <button
                onClick={handleStart}
                className="mt-8 px-6 py-3 text-sm uppercase tracking-wider transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--color-accent-gold)',
                  color: 'var(--color-bg-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-copper)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-gold)'}
              >
                开始第一轮讨论
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {Object.entries(messagesByRound).map(([round, msgs], roundIndex) => (
              <div 
                key={round} 
                className="relative"
                style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: `${roundIndex * 0.1}s` }}
              >
                {/* Round Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="px-3 py-1 text-xs uppercase tracking-wider"
                    style={{ 
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-accent-gold)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    第 {round} 轮
                  </div>
                  <div 
                    className="flex-1 h-px"
                    style={{ backgroundColor: 'var(--color-border)' }}
                  />
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  {msgs.map((msg) => {
                    if (msg.roleId === 'host') {
                      return (
                        <div key={msg.id} className="flex justify-center my-6">
                          <div 
                            className="px-6 py-3 max-w-lg"
                            style={{ 
                              backgroundColor: 'rgba(212, 165, 116, 0.1)',
                              borderLeft: '3px solid var(--color-host)'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4" style={{ color: 'var(--color-host)' }} />
                              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-host)' }}>
                                主持人引导
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    if (msg.roleId === 'system') {
                      return <SystemMessage key={msg.id} content={msg.content} timestamp={msg.timestamp} />;
                    }
                    const role = state.roles.find((r) => r.id === msg.roleId);
                    if (!role) return null;
                    return <ChatBubble key={msg.id} message={msg} role={role} />;
                  })}
                </div>
              </div>
            ))}

            {/* Final Conclusion */}
            {state.finalConclusion && (
              <div 
                className="mt-8 p-6"
                style={{ 
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '2px solid var(--color-accent-gold)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-accent-gold)' }} />
                  <h3 
                    className="font-editorial text-xl"
                    style={{ color: 'var(--color-accent-gold)' }}
                  >
                    综合结论
                  </h3>
                </div>
                <p 
                  className="leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {state.finalConclusion}
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div 
            className="mt-4 p-4 max-w-4xl mx-auto"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderLeft: '3px solid #ef4444'
            }}
          >
            <p className="text-sm" style={{ color: '#ef4444' }}>
              <strong>错误：</strong>{error}
            </p>
          </div>
        )}
      </div>

      {/* Host Input Area */}
      {state.status === 'waiting_host' && !state.finalConclusion && (
        <div
          className="px-6 py-4 border-t"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Auto-rounds row */}
            <div className="flex items-center gap-3">
              {autoCountdown !== null ? (
                // Countdown active
                <div
                  className="flex items-center gap-3 px-4 py-2 flex-1"
                  style={{
                    backgroundColor: 'rgba(212, 165, 116, 0.08)',
                    border: '1px solid var(--color-accent-gold)',
                  }}
                >
                  <Zap className="w-4 h-4 animate-pulse" style={{ color: 'var(--color-accent-gold)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-accent-gold)' }}>
                    {autoCountdown} 秒后自动继续，还剩 {autoRoundsLeft} 轮…
                  </span>
                  <button
                    onClick={handleAutoPause}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs transition-opacity hover:opacity-80"
                    style={{
                      color: 'var(--color-accent-gold)',
                      border: '1px solid var(--color-accent-gold)',
                    }}
                  >
                    <Pause className="w-3 h-3" />
                    暂停
                  </button>
                </div>
              ) : autoRoundsLeft > 0 ? null : (
                // Auto-rounds setup
                <div className="flex items-center gap-2 ml-auto">
                  <Zap className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>自动继续</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={autoRoundsInput}
                    onChange={(e) => setAutoRoundsInput(Math.max(1, Math.min(20, Number(e.target.value))))}
                    className="w-14 px-2 py-1 text-xs bg-transparent text-center"
                    style={{
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>轮</span>
                  <button
                    onClick={handleAutoStart}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all duration-200"
                    style={{
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent-gold)';
                      e.currentTarget.style.color = 'var(--color-accent-gold)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    自动运行
                  </button>
                </div>
              )}
            </div>

            {/* Manual input row — hidden during countdown */}
            {autoCountdown === null && (
              <>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" style={{ color: 'var(--color-host)' }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-host)' }}>
                    主持人发言（可选）
                  </span>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={hostMessage}
                    onChange={(e) => setHostMessage(e.target.value)}
                    placeholder="输入引导语，或直接点击继续下一轮..."
                    className="flex-1 px-4 py-3 bg-transparent transition-all duration-200"
                    style={{
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-host)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    onKeyDown={(e) => e.key === 'Enter' && handleHostSend()}
                  />
                  <button
                    onClick={handleHostSend}
                    className="px-6 py-3 flex items-center gap-2 transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--color-host)',
                      color: 'var(--color-bg-primary)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    继续
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={generateFinalConclusion}
                    className="px-6 py-3 flex items-center gap-2 transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-accent-gold)',
                      border: '1px solid var(--color-accent-gold)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent-gold)';
                      e.currentTarget.style.color = 'var(--color-bg-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                      e.currentTarget.style.color = 'var(--color-accent-gold)';
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    生成结论
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* API Log Panel */}
      <div 
        className="border-t"
        style={{ 
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >
        <button
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          className="w-full px-6 py-2 flex items-center justify-between transition-colors duration-200 hover:opacity-80"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              系统日志
            </span>
            {isThinking && (
              <span className="text-xs animate-pulse" style={{ color: 'var(--color-accent-gold)' }}>
                处理中...
              </span>
            )}
          </div>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {isLogExpanded ? '−' : '+'}
          </span>
        </button>

        {isLogExpanded && (
          <div 
            className="px-6 py-3 overflow-y-auto font-mono text-xs max-h-32"
            style={{ 
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-secondary)',
              borderTop: '1px solid var(--color-border)'
            }}
          >
            {apiLog.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>等待 API 调用...</p>
            ) : (
              apiLog.map((log, idx) => (
                <p key={idx} className="mb-1 break-words opacity-80">{log}</p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebateArena;
