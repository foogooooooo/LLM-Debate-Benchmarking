import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
      className={`
        relative inline-flex items-center justify-center rounded-full
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        backgroundColor: isDark 
          ? 'rgba(212, 165, 116, 0.15)' 
          : 'rgba(184, 115, 51, 0.12)',
        border: `1px solid ${isDark 
          ? 'rgba(212, 165, 116, 0.3)' 
          : 'rgba(184, 115, 51, 0.25)'}`,
        color: 'var(--color-accent-gold)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDark 
          ? 'rgba(212, 165, 116, 0.25)' 
          : 'rgba(184, 115, 51, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isDark 
          ? 'rgba(212, 165, 116, 0.15)' 
          : 'rgba(184, 115, 51, 0.12)';
      }}
    >
      <span
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-300 ease-out
          ${isDark 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-50'
          }
        `}
      >
        <Moon 
          size={iconSizes[size]} 
          style={{ color: 'var(--color-accent-gold)' }}
        />
      </span>
      
      <span
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-300 ease-out
          ${isDark 
            ? 'opacity-0 rotate-90 scale-50' 
            : 'opacity-100 rotate-0 scale-100'
          }
        `}
      >
        <Sun 
          size={iconSizes[size]} 
          style={{ color: 'var(--color-accent-gold)' }}
        />
      </span>
    </button>
  );
}

export default ThemeToggle;
