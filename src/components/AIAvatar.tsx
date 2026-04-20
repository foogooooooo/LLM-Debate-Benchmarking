import type { AIRole } from '../types';

interface AIAvatarProps {
  role: AIRole;
  isActive: boolean;
  isThinking: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

export const AIAvatar: React.FC<AIAvatarProps> = ({
  role,
  isActive,
  isThinking,
  size = 'md',
  onClick,
}) => {
  return (
    <div
      className={`flex flex-col items-center cursor-pointer transition-all duration-300 ${
        onClick ? 'hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-4 transition-all duration-300 ${
          isActive
            ? `${role.borderColor} shadow-lg scale-110 ring-4 ring-opacity-50 ring-offset-2`
            : 'border-gray-200 opacity-70'
        } ${isActive ? `ring-${role.color.split('-')[1]}-400` : ''}`}
      >
        <img
          src={role.avatar}
          alt={role.name}
          className="w-full h-full object-cover"
        />
        
        {/* 思考动画 */}
        {isThinking && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        )}
        
        {/* 活跃指示器 */}
        {isActive && !isThinking && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>
      
      <div className="mt-2 text-center">
        <p className={`font-semibold text-sm transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
          {role.name}
        </p>
        <p className="text-xs text-gray-400 max-w-[80px] truncate">{role.expertise}</p>
      </div>
    </div>
  );
};

export default AIAvatar;
