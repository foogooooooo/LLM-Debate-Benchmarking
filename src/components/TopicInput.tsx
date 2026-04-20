import { useState } from 'react';
import { useDiscussion } from '../contexts/DebateContext';
import { ArrowRight, Hash, Lightbulb } from 'lucide-react';

interface TopicInputProps {
  onStart: () => void;
}

const suggestedTopics = [
  'Will artificial intelligence replace creative jobs?',
  'Impact of remote work on team collaboration',
  'How to cultivate deep work capabilities?',
  'Can the metaverse become humanity\'s second home?',
  'Significance of lifelong learning in the AI era',
];

export const TopicInput: React.FC<TopicInputProps> = ({ onStart }) => {
  const { state, dispatch } = useDiscussion();
  const [localTopic, setLocalTopic] = useState(state.topic);
  const [isFocused, setIsFocused] = useState(false);

  const handleStart = () => {
    if (!localTopic.trim()) return;
    dispatch({ type: 'SET_TOPIC', payload: localTopic.trim() });
    dispatch({ type: 'SET_CONVERSATION_ID', payload: null });
    onStart();
  };

  const dsKey = state.roles.find(r => r.id === 'deepseek')?.apiKey || '';
  const glmKey = state.roles.find(r => r.id === 'glm')?.apiKey || '';
  const hasKeys = dsKey.length > 0 && glmKey.length > 0;
  const canStart = localTopic.trim().length > 0 && hasKeys;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <Hash className="w-5 h-5" style={{ color: 'var(--color-accent-gold)' }} />
        </div>
        <div>
          <h3 
            className="font-editorial text-xl font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Set Discussion Topic
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Enter an open-ended question for the two AIs to debate around
          </p>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={localTopic}
          onChange={(e) => setLocalTopic(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Example: In the era of information explosion, how to maintain independent thinking?"
          className="w-full px-4 py-4 bg-transparent resize-none transition-all duration-300 font-modern"
          style={{
            minHeight: '120px',
            color: 'var(--color-text-primary)',
            border: `1px solid ${isFocused ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
            borderLeft: `3px solid ${isFocused ? 'var(--color-accent-gold)' : 'var(--color-border)'}`,
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey && canStart) {
              handleStart();
            }
          }}
        />
        
        {/* Character count */}
          <div 
          className="absolute bottom-3 right-3 text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {localTopic.length} chars
        </div>
      </div>

      {/* API Key warning */}
      {!hasKeys && (
        <div
          className="px-4 py-2.5 text-sm"
          style={{
            backgroundColor: 'rgba(212, 165, 116, 0.08)',
            borderLeft: '3px solid var(--color-accent-gold)',
            color: 'var(--color-accent-gold)',
          }}
        >
          Please click the ⚙ icon in the top right to set API Keys first
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full py-4 flex items-center justify-center gap-3 transition-all duration-300 disabled:cursor-not-allowed group"
        style={{
          backgroundColor: canStart ? 'var(--color-accent-gold)' : 'var(--color-bg-tertiary)',
          color: canStart ? 'var(--color-bg-primary)' : 'var(--color-text-muted)',
          border: 'none',
        }}
        onMouseEnter={(e) => {
          if (canStart) {
            e.currentTarget.style.backgroundColor = 'var(--color-accent-copper)';
          }
        }}
        onMouseLeave={(e) => {
          if (canStart) {
            e.currentTarget.style.backgroundColor = 'var(--color-accent-gold)';
          }
        }}
      >
        <span className="text-sm font-medium uppercase tracking-wider">
          Start Debate
        </span>
        <ArrowRight 
          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
        />
      </button>

      {/* Suggested Topics */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-3 h-3" style={{ color: 'var(--color-accent-gold)' }} />
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Suggested Topics
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => setLocalTopic(topic)}
              className="px-3 py-1.5 text-xs transition-all duration-200 hover:opacity-100"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid transparent',
                opacity: 0.8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent-gold)';
                e.currentTarget.style.color = 'var(--color-accent-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Press <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>⌘ + Enter</kbd> to start quickly
      </p>
    </div>
  );
};

export default TopicInput;
