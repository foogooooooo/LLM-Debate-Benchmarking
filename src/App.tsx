import { useState, useEffect } from 'react';
import { useDiscussion } from './contexts/DebateContext';
import { TopicInput } from './components/TopicInput';
import { RoleConfigPanel } from './components/RoleConfigPanel';
import { DebateArena } from './components/DebateArena';
import { ConversationHistory } from './components/ConversationHistory';
import { ThemeToggle } from './components/ThemeToggle';
import { SettingsModal, loadApiKeys } from './components/SettingsModal';
import type { ConversationRecord } from './utils/storage';
import { conversationToState } from './utils/storage';
import { Sparkles, Users, MessageCircle, Settings } from 'lucide-react';

// Decorative accent line component
const AccentLine = ({ className = '' }: { className?: string }) => (
  <div className={`h-px bg-gradient-to-r from-transparent via-[var(--color-accent-gold)] to-transparent ${className}`} />
);

// Decorative corner element
const CornerAccent = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const positions = {
    tl: 'top-0 left-0 border-t-2 border-l-2',
    tr: 'top-0 right-0 border-t-2 border-r-2',
    bl: 'bottom-0 left-0 border-b-2 border-l-2',
    br: 'bottom-0 right-0 border-b-2 border-r-2',
  };
  return (
    <div 
      className={`absolute w-8 h-8 border-[var(--color-accent-gold)] opacity-60 ${positions[position]}`}
      style={{ borderColor: 'var(--color-accent-gold)' }}
    />
  );
};

function AppContent() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { state, dispatch, loadConversation } = useDiscussion();

  useEffect(() => {
    setIsLoaded(true);
    // Load saved API Keys from localStorage on startup
    const stored = loadApiKeys();
    if (stored.deepseek || stored.glm) {
      const dsRole = state.roles.find(r => r.id === 'deepseek');
      const glmRole = state.roles.find(r => r.id === 'glm');
      if (dsRole && stored.deepseek) {
        dispatch({ type: 'UPDATE_ROLE', payload: { ...dsRole, apiKey: stored.deepseek } });
      }
      if (glmRole && stored.glm) {
        dispatch({ type: 'UPDATE_ROLE', payload: { ...glmRole, apiKey: stored.glm } });
      }
    }
  }, []);

  const handleStart = () => {
    setHasStarted(true);
  };

  // 处理加载历史会话
  // Handle loading historical conversation
  const handleLoadConversation = (conversation: ConversationRecord) => {
    loadConversation({
      ...conversationToState(conversation),
      conversationId: conversation.id,
    });
    setHasStarted(true);
  };

  // Return to home page
  const handleReturnHome = () => {
    setHasStarted(false);
    dispatch({ type: 'RESET' });
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: 'var(--color-bg-primary)',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.8s ease'
      }}
    >
      {/* Header - Editorial Style */}
      <header 
        className="relative border-b"
        style={{ 
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between py-5">
            {/* Logo / Title */}
            <div className="flex items-baseline gap-4">
                <h1 
                  className="font-editorial text-2xl lg:text-3xl font-semibold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Symphony of Minds
                </h1>
                <span 
                  className="hidden sm:inline-block text-xs uppercase tracking-[0.3em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  AI Debate Arena
                </span>
            </div>

            {/* Status Indicators & History */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-deepseek)' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  DeepSeek
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: 'var(--color-glm)', animationDelay: '0.5s' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  GLM-4
                </span>
              </div>
              <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
              <ConversationHistory 
                onLoadConversation={handleLoadConversation}
                currentConversationId={state.conversationId}
              />
              <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all duration-200"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-accent-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                title="API Key Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="h-4 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
              <ThemeToggle size="sm" />
            </div>
          </div>
        </div>
        
        {/* Decorative bottom accent */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ 
            background: 'linear-gradient(90deg, transparent 0%, var(--color-accent-gold) 20%, var(--color-accent-gold) 80%, transparent 100%)'
          }}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {!hasStarted ? (
          // Pre-start Interface - Hero Section
          <div className="flex-1 flex flex-col">
            {/* Hero Section */}
            <section 
              className="relative py-16 lg:py-24 px-6 lg:px-12 overflow-hidden"
              style={{
                animation: isLoaded ? 'fadeInUp 0.8s ease forwards' : 'none',
                opacity: 0
              }}
            >
              {/* Background decorative elements */}
              <div 
                className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-10 blur-3xl"
                style={{ backgroundColor: 'var(--color-accent-gold)' }}
              />
              <div 
                className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-10 blur-3xl"
                style={{ backgroundColor: 'var(--color-deepseek)' }}
              />

              <div className="max-w-4xl mx-auto text-center relative z-10">
                {/* Overline */}
                <div 
                  className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-xs uppercase tracking-widest"
                  style={{ 
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-accent-gold)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  AI Debate Arena
                </div>

                {/* Main Title */}
                <h2 
                  className="font-editorial text-5xl lg:text-7xl font-medium mb-6 leading-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  You <span style={{ color: 'var(--color-accent-gold)' }}>Moderate</span>
                </h2>

                {/* Subtitle */}
                <p 
                  className="text-lg lg:text-xl max-w-2xl mx-auto mb-4"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Guide DeepSeek and GLM-4 in deep conversations
                </p>
                <p 
                  className="text-sm max-w-xl mx-auto"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  As the moderator, you control the discussion pace. Each round, both AIs will think and respond based on the complete conversation history.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-4 mt-10">
                  {[
                    { icon: Users, label: 'Triangular Dialogue' },
                    { icon: MessageCircle, label: 'Full Context' },
                    { icon: Sparkles, label: 'Deep Debate' },
                  ].map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-2 px-4 py-2 text-sm"
                      style={{ 
                        color: 'var(--color-text-secondary)',
                        borderBottom: '1px solid var(--color-border)'
                      }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: 'var(--color-accent-gold)' }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <AccentLine className="max-w-xs mx-auto opacity-50" />

            {/* Input Section */}
            <section 
              className="flex-1 py-12 px-6 lg:px-12"
              style={{
                animation: isLoaded ? 'fadeInUp 0.8s ease 0.2s forwards' : 'none',
                opacity: 0
              }}
            >
              <div className="max-w-2xl mx-auto">
                {/* Topic Input Container with decorative corners */}
                <div className="relative">
                  <CornerAccent position="tl" />
                  <CornerAccent position="tr" />
                  <CornerAccent position="bl" />
                  <CornerAccent position="br" />
                  
                  <div 
                    className="p-8 lg:p-10"
                    style={{ 
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <TopicInput onStart={handleStart} />
                  </div>
                </div>

                {/* Role Config Panel */}
                <div className="mt-6">
                  <RoleConfigPanel />
                </div>
              </div>
            </section>
          </div>
        ) : (
          // Debate Interface
          <div 
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden"
            style={{ height: 'calc(100vh - 80px)' }}
          >
            {/* Left Sidebar - Topic & Config */}
            <aside 
              className="hidden lg:block lg:col-span-3 border-r overflow-y-auto"
              style={{ 
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)'
              }}
            >
              <div className="p-6 space-y-6">
                {/* Current Topic Card */}
                <div>
                  <h3 
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Current Topic
                  </h3>
                  <div 
                    className="p-4 border-l-2"
                    style={{ 
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-accent-gold)'
                    }}
                  >
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {state.topic}
                    </p>
                  </div>
                </div>

                <AccentLine />

                {/* Role Config */}
                <RoleConfigPanel />

                {/* Save Button */}
                <button
                  onClick={() => dispatch({ type: 'SAVE_CONVERSATION' })}
                  className="w-full py-3 text-sm uppercase tracking-wider transition-all duration-300 hover:opacity-80"
                  style={{ 
                    color: 'var(--color-accent-gold)',
                    border: '1px solid var(--color-accent-gold)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-gold)';
                    e.currentTarget.style.color = 'var(--color-bg-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-accent-gold)';
                  }}
                >
                  💾 Save Conversation
                </button>

                {/* Back Button */}
                <button
                  onClick={handleReturnHome}
                  className="w-full py-3 text-sm uppercase tracking-wider transition-all duration-300 hover:opacity-80"
                  style={{ 
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent'
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
                  ← Back to Start
                </button>
              </div>
            </aside>

            {/* Main Debate Arena */}
            <div className="col-span-1 lg:col-span-9 h-full">
              <DebateArena onExit={handleReturnHome} />
            </div>
          </div>
        )}
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Footer - Minimal */}
      {!hasStarted && (
        <footer 
          className="py-6 text-center border-t"
          style={{ 
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)'
          }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Symphony of Minds · AI Debate Arena
          </p>
        </footer>
      )}
    </div>
  );
}

export default AppContent;
