import { useState } from 'react';
import type { AIRole } from '../types';
import { useDiscussion } from '../contexts/DebateContext';
import { Settings2, ChevronDown, ChevronUp, Brain, Lightbulb, Wifi, X, Save } from 'lucide-react';

const FeatureToggle = ({
  enabled,
  onToggle,
  color,
}: {
  enabled: boolean;
  onToggle: () => void;
  color: string;
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className="relative w-9 h-5 transition-colors duration-200 flex-shrink-0"
    style={{ backgroundColor: enabled ? color : 'var(--color-border)' }}
  >
    <span
      className="absolute top-0.5 w-4 h-4 bg-white transition-transform duration-200"
      style={{
        left: '2px',
        transform: enabled ? 'translateX(16px)' : 'translateX(0)',
      }}
    />
  </button>
);

export const RoleConfigPanel: React.FC = () => {
  const { state, dispatch } = useDiscussion();
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingRole, setEditingRole] = useState<AIRole | null>(null);

  const handleSaveRole = () => {
    if (editingRole) {
      dispatch({ type: 'UPDATE_ROLE', payload: editingRole });
      setEditingRole(null);
    }
  };

  const toggleFeature = (feature: 'deepThinking' | 'webSearch') => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      features: {
        ...editingRole.features,
        [feature]: !editingRole.features?.[feature],
      },
    });
  };

  const toggleRoleFeature = (role: AIRole, feature: 'deepThinking' | 'webSearch') => {
    dispatch({
      type: 'UPDATE_ROLE',
      payload: {
        ...role,
        features: {
          ...role.features,
          [feature]: !role.features?.[feature],
        },
      },
    });
  };

  return (
    <div 
      className="overflow-hidden"
      style={{ 
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)'
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between transition-colors duration-200"
        style={{ 
          backgroundColor: isExpanded ? 'var(--color-bg-tertiary)' : 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" style={{ color: 'var(--color-accent-gold)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Collaborator Configuration
          </span>
        </div>
        <span style={{ color: 'var(--color-text-muted)' }}>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {editingRole ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 
                  className="font-editorial text-lg"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Edit Role
                </h4>
                <button
                  onClick={() => setEditingRole(null)}
                  className="p-1 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role Header */}
              <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <img 
                  src={editingRole.avatar} 
                  alt={editingRole.name}
                  className="w-12 h-12 object-cover"
                  style={{ border: `2px solid ${editingRole.id === 'deepseek' ? 'var(--color-deepseek)' : 'var(--color-glm)'}` }}
                />
                <div>
                  <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {editingRole.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {editingRole.id === 'deepseek' ? 'DeepSeek API' : 'GLM-4 API'}
                  </p>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Role Name
                </label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full px-3 py-2 bg-transparent transition-colors duration-200"
                  style={{
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-gold)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </div>

              {/* Personality */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    Personality Description
                  </span>
                </label>
                <textarea
                  value={editingRole.personality}
                  onChange={(e) => setEditingRole({ ...editingRole, personality: e.target.value })}
                  className="w-full px-3 py-2 bg-transparent resize-none transition-colors duration-200"
                  style={{
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                    minHeight: '80px',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-gold)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </div>

              {/* Expertise */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Expertise Area
                </label>
                <input
                  type="text"
                  value={editingRole.expertise}
                  onChange={(e) => setEditingRole({ ...editingRole, expertise: e.target.value })}
                  className="w-full px-3 py-2 bg-transparent transition-colors duration-200"
                  style={{
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-gold)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </div>

              {/* Feature Toggles */}
              <div className="space-y-3 pt-2">
                <p 
                  className="text-xs uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Feature Toggles
                </p>

                {/* Deep Thinking */}
                <label 
                  className="flex items-center justify-between p-3 cursor-pointer transition-colors duration-200"
                  style={{ backgroundColor: 'var(--color-bg-primary)' }}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" style={{ color: 'var(--color-deepseek)' }} />
                    <div>
                      <span className="text-sm block" style={{ color: 'var(--color-text-primary)' }}>
                        Deep Thinking
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Deeper reasoning analysis
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeature('deepThinking')}
                    className="relative w-11 h-6 transition-colors duration-200"
                    style={{
                      backgroundColor: editingRole.features?.deepThinking ? 'var(--color-deepseek)' : 'var(--color-border)',
                    }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 bg-white transition-transform duration-200"
                      style={{
                        left: '4px',
                        transform: editingRole.features?.deepThinking ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </label>

                {/* Web Search */}
                <label 
                  className="flex items-center justify-between p-3 cursor-pointer transition-colors duration-200"
                  style={{ backgroundColor: 'var(--color-bg-primary)' }}
                >
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4" style={{ color: 'var(--color-glm)' }} />
                    <div>
                      <span className="text-sm block" style={{ color: 'var(--color-text-primary)' }}>
                        Web Search
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Get latest information
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeature('webSearch')}
                    className="relative w-11 h-6 transition-colors duration-200"
                    style={{
                      backgroundColor: editingRole.features?.webSearch ? 'var(--color-glm)' : 'var(--color-border)',
                    }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 bg-white transition-transform duration-200"
                      style={{
                        left: '4px',
                        transform: editingRole.features?.webSearch ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </button>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveRole}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200"
                  style={{ 
                    backgroundColor: 'var(--color-accent-gold)',
                    color: 'var(--color-bg-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-copper)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-gold)'}
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setEditingRole(null)}
                  className="flex-1 py-2.5 text-sm transition-all duration-200"
                  style={{ 
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-text-secondary)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode - Role List
            <div className="space-y-3">
              {state.roles.map((role) => (
                <div
                  key={role.id}
                  className="p-3"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {/* Role header row */}
                  <div className="flex items-center gap-3">
                    <img
                      src={role.avatar}
                      alt={role.name}
                      className="w-9 h-9 object-cover flex-shrink-0"
                      style={{
                        border: `2px solid ${role.id === 'deepseek' ? 'var(--color-deepseek)' : 'var(--color-glm)'}`
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {role.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {role.expertise}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingRole({ ...role })}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                      title="Edit role"
                    >
                      <Settings2 className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  </div>

                  {/* Feature toggles inline */}
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3" style={{ color: 'var(--color-deepseek)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Deep Thinking</span>
                      </div>
                      <FeatureToggle
                        enabled={!!role.features?.deepThinking}
                        onToggle={() => toggleRoleFeature(role, 'deepThinking')}
                        color="var(--color-deepseek)"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Wifi className="w-3 h-3" style={{ color: 'var(--color-glm)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Web Search</span>
                      </div>
                      <FeatureToggle
                        enabled={!!role.features?.webSearch}
                        onToggle={() => toggleRoleFeature(role, 'webSearch')}
                        color="var(--color-glm)"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Info Note */}
              <div 
                className="p-3 text-xs"
                style={{ 
                  backgroundColor: 'var(--color-bg-primary)',
                  borderLeft: '2px solid var(--color-accent-gold)',
                  color: 'var(--color-text-muted)'
                }}
              >
                Click on role cards to edit configuration. Both AIs will take turns speaking, each can see the complete conversation history.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleConfigPanel;
