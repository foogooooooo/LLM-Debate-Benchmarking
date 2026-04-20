import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface SystemMessageProps {
  content: string;
  timestamp?: number;
}

export const SystemMessage: React.FC<SystemMessageProps> = ({ content, timestamp }) => {
  const isFactCheck = content.includes('【事实核查】');
  
  // Parse fact check content
  const parseContent = () => {
    if (!isFactCheck) return { issues: [], corrections: content };
    
    const lines = content.split('\n');
    const issues: string[] = [];
    let corrections = '';
    let inIssues = false;
    let inCorrections = false;
    
    for (const line of lines) {
      if (line.includes('发现以下问题')) {
        inIssues = true;
        inCorrections = false;
        continue;
      }
      if (line.includes('修正说明')) {
        inIssues = false;
        inCorrections = true;
        corrections = line.replace('修正说明：', '').trim();
        continue;
      }
      if (inIssues && line.startsWith('•')) {
        issues.push(line.replace('•', '').trim());
      }
      if (inCorrections && line.trim()) {
        corrections += line;
      }
    }
    
    return { issues, corrections };
  };
  
  const { issues, corrections } = parseContent();
  
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isFactCheck) {
    return (
      <div className="flex justify-center my-6" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
        <div 
          className="max-w-2xl w-full"
          style={{
            backgroundColor: 'rgba(184, 115, 51, 0.1)',
            border: '1px solid var(--color-accent-copper)',
            borderLeft: '4px solid var(--color-accent-copper)',
          }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3 flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgba(184, 115, 51, 0.15)',
              borderBottom: '1px solid rgba(184, 115, 51, 0.3)'
            }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-accent-copper)' }} />
            <span 
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: 'var(--color-accent-copper)' }}
            >
              事实核查结果
            </span>
            {timestamp && (
              <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>
                {formatTime(timestamp)}
              </span>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4">
            {issues.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3 h-3" style={{ color: 'var(--color-accent-amber)' }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    发现问题 ({issues.length})
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {issues.map((issue, idx) => (
                    <li 
                      key={idx}
                      className="text-sm flex items-start gap-2"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <span style={{ color: 'var(--color-accent-copper)' }}>•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {corrections && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-3 h-3" style={{ color: 'var(--color-deepseek)' }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                    修正说明
                  </span>
                </div>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {corrections}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Generic system message
  return (
    <div className="flex justify-center my-4" style={{ animation: 'fadeInUp 0.4s ease forwards' }}>
      <div 
        className="px-4 py-2 text-center max-w-xl"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {content}
        </p>
      </div>
    </div>
  );
};

export default SystemMessage;
