import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Key, Save, CheckCircle } from 'lucide-react';
import { useDiscussion } from '../contexts/DebateContext';

const API_KEYS_STORAGE_KEY = 'three-ai-debate-api-keys';

export interface StoredApiKeys {
  deepseek: string;
  glm: string;
}

export const loadApiKeys = (): StoredApiKeys => {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { deepseek: '', glm: '' };
};

const saveApiKeysToStorage = (keys: StoredApiKeys) => {
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useDiscussion();
  const [deepseekKey, setDeepseekKey] = useState('');
  const [glmKey, setGlmKey] = useState('');
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [showGlm, setShowGlm] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = loadApiKeys();
      const dsRole = state.roles.find(r => r.id === 'deepseek');
      const glmRole = state.roles.find(r => r.id === 'glm');
      setDeepseekKey(stored.deepseek || dsRole?.apiKey || '');
      setGlmKey(stored.glm || glmRole?.apiKey || '');
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const keys: StoredApiKeys = {
      deepseek: deepseekKey.trim(),
      glm: glmKey.trim(),
    };
    saveApiKeysToStorage(keys);

    const dsRole = state.roles.find(r => r.id === 'deepseek');
    const glmRole = state.roles.find(r => r.id === 'glm');
    if (dsRole) dispatch({ type: 'UPDATE_ROLE', payload: { ...dsRole, apiKey: keys.deepseek } });
    if (glmRole) dispatch({ type: 'UPDATE_ROLE', payload: { ...glmRole, apiKey: keys.glm } });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  const canSave = deepseekKey.trim().length > 0 && glmKey.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <Key className="w-4 h-4" style={{ color: 'var(--color-accent-gold)' }} />
            <h2
              className="font-editorial text-lg"
              style={{ color: 'var(--color-text-primary)' }}
            >
              API Key 设置
            </h2>
          </div>
          <button
            onClick={onClose}
            className="transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Key 仅保存在本地浏览器，不会上传到任何服务器。
          </p>

          {/* DeepSeek Key */}
          <div>
            <label
              className="block text-xs uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-deepseek)' }}
            >
              🧠 DeepSeek API Key
            </label>
            <div className="relative">
              <input
                type={showDeepseek ? 'text' : 'password'}
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 pr-10 bg-transparent text-sm"
                style={{
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-deepseek)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
              <button
                onClick={() => setShowDeepseek(!showDeepseek)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* GLM Key */}
          <div>
            <label
              className="block text-xs uppercase tracking-wider mb-2"
              style={{ color: 'var(--color-glm)' }}
            >
              🔮 GLM-4 API Key
            </label>
            <div className="relative">
              <input
                type={showGlm ? 'text' : 'password'}
                value={glmKey}
                onChange={(e) => setGlmKey(e.target.value)}
                placeholder="xxxxxxxx.xxxxxxxxxx"
                className="w-full px-3 py-2.5 pr-10 bg-transparent text-sm"
                style={{
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-glm)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
              <button
                onClick={() => setShowGlm(!showGlm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showGlm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: saved
                ? 'var(--color-deepseek)'
                : canSave
                ? 'var(--color-accent-gold)'
                : 'var(--color-bg-tertiary)',
              color: canSave ? 'var(--color-bg-primary)' : 'var(--color-text-muted)',
              cursor: canSave ? 'pointer' : 'not-allowed',
            }}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? '已保存' : '保存'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm transition-all duration-200"
            style={{
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
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
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
