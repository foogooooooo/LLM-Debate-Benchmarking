import { useState } from 'react';
import type { Message, AIRole } from '../types';
import { Brain, Wifi, Sparkles, ChevronDown, ChevronUp, ExternalLink, Copy, Check } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  role: AIRole;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, role }) => {
  const isDeepSeek = role.apiType === 'deepseek';
  const isEmpty = message.content === '';
  const hasDeepThinking = role.features?.deepThinking;
  const hasWebSearch = role.features?.webSearch;
  const [showReasoning, setShowReasoning] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex w-full ${isDeepSeek ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`flex max-w-[90%] lg:max-w-[85%] ${isDeepSeek ? 'flex-row' : 'flex-row-reverse'} items-start gap-4`}
        style={{ animation: 'fadeInUp 0.4s ease forwards' }}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div 
            className="relative w-12 h-12 overflow-hidden"
            style={{
              border: `2px solid ${isDeepSeek ? 'var(--color-deepseek)' : 'var(--color-glm)'}`,
            }}
          >
            <img
              src={role.avatar}
              alt={role.name}
              className="w-full h-full object-cover"
            />
            
            {/* Thinking overlay */}
            {isEmpty && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(10, 15, 13, 0.8)' }}
              >
                <div className="flex space-x-1">
                  {[0, 150, 300].map((delay, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ 
                        backgroundColor: isDeepSeek ? 'var(--color-deepseek)' : 'var(--color-glm)',
                        animationDelay: `${delay}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col min-w-0 flex-1">
          {/* Header */}
          <div 
            className={`flex items-center gap-3 mb-2 ${isDeepSeek ? '' : 'flex-row-reverse'}`}
          >
            <span 
              className="text-sm font-medium"
              style={{ 
                color: isDeepSeek ? 'var(--color-deepseek)' : 'var(--color-glm)',
                fontFamily: 'var(--font-editorial)'
              }}
            >
              {role.name}
            </span>
            
            {/* Feature badges */}
            <div className="flex items-center gap-1">
              {isDeepSeek && hasDeepThinking && (
                <span 
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider"
                  style={{ 
                    backgroundColor: 'rgba(91, 138, 114, 0.2)',
                    color: 'var(--color-deepseek)'
                  }}
                >
                  <Brain className="w-3 h-3" />
                  深度
                </span>
              )}
              {!isDeepSeek && hasWebSearch && (
                <span 
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider"
                  style={{ 
                    backgroundColor: 'rgba(124, 156, 180, 0.2)',
                    color: 'var(--color-glm)'
                  }}
                >
                  <Wifi className="w-3 h-3" />
                  联网
                </span>
              )}
            </div>
          </div>

          {/* Message Bubble */}
          <div
            className="relative"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderLeft: isDeepSeek ? '3px solid var(--color-deepseek)' : 'none',
              borderRight: !isDeepSeek ? '3px solid var(--color-glm)' : 'none',
              padding: '1rem 1.25rem',
            }}
          >
            {isEmpty ? (
              <div className="flex items-center gap-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
                <div 
                  className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: isDeepSeek ? 'var(--color-deepseek)' : 'var(--color-glm)', borderTopColor: 'transparent' }}
                />
                <span className="text-sm">
                  {isDeepSeek 
                    ? (hasDeepThinking ? '深度思考中...' : '思考中...')
                    : (hasWebSearch ? '联网搜索中...' : '思考中...')
                  }
                </span>
              </div>
            ) : (
              <>
                {/* DeepSeek Reasoning Content */}
                {message.reasoningContent && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="flex items-center gap-2 w-full py-2 px-3 text-left transition-colors"
                      style={{ 
                        backgroundColor: 'rgba(91, 138, 114, 0.1)',
                        border: '1px solid rgba(91, 138, 114, 0.3)'
                      }}
                    >
                      <Brain className="w-4 h-4" style={{ color: 'var(--color-deepseek)' }} />
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-deepseek)' }}>
                        思考过程
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                        ({message.reasoningContent.length} 字)
                      </span>
                      <span className="ml-auto" style={{ color: 'var(--color-text-muted)' }}>
                        {showReasoning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>
                    {showReasoning && (
                      <div 
                        className="p-3 text-sm mt-1"
                        style={{ 
                          backgroundColor: 'rgba(91, 138, 114, 0.05)',
                          color: 'var(--color-text-secondary)',
                          borderLeft: '2px solid var(--color-deepseek)',
                          fontStyle: 'italic'
                        }}
                      >
                        {message.reasoningContent}
                      </div>
                    )}
                  </div>
                )}

                {/* GLM Search Results */}
                {message.searchResults && message.searchResults.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowSearchResults(!showSearchResults)}
                      className="flex items-center gap-2 w-full py-2 px-3 text-left transition-colors"
                      style={{ 
                        backgroundColor: 'rgba(124, 156, 180, 0.1)',
                        border: '1px solid rgba(124, 156, 180, 0.3)'
                      }}
                    >
                      <Wifi className="w-4 h-4" style={{ color: 'var(--color-glm)' }} />
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-glm)' }}>
                        联网搜索结果
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                        ({message.searchResults.length} 条)
                      </span>
                      <span className="ml-auto" style={{ color: 'var(--color-text-muted)' }}>
                        {showSearchResults ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>
                    {showSearchResults && (
                      <div className="mt-2 space-y-2">
                        {message.searchResults.map((result, idx) => (
                          <div 
                            key={idx}
                            className="p-3 text-sm"
                            style={{ 
                              backgroundColor: 'var(--color-bg-tertiary)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <a 
                              href={result.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 font-medium mb-1 hover:underline"
                              style={{ color: 'var(--color-glm)' }}
                            >
                              {result.title || '搜索结果'}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                              {result.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message text */}
                <div 
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ 
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-modern)'
                  }}
                >
                  {message.content}
                  {!message.isComplete && (
                    <span 
                      className="inline-block w-0.5 h-4 ml-1 animate-pulse"
                      style={{ backgroundColor: isDeepSeek ? 'var(--color-deepseek)' : 'var(--color-glm)' }}
                    />
                  )}
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between mt-4 pt-3"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center gap-2">
                    {!message.isComplete && (
                      <Sparkles
                        className="w-3 h-3 animate-spin"
                        style={{ color: 'var(--color-accent-gold)' }}
                      />
                    )}
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {message.content.length} 字
                    </span>
                    {message.isComplete && (
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
                        style={{
                          color: copied
                            ? isDeepSeek ? 'var(--color-deepseek)' : 'var(--color-glm)'
                            : 'var(--color-text-muted)',
                        }}
                        title="复制消息"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? '已复制' : '复制'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
