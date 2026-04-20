import { useState, useEffect, useCallback } from 'react';
import type { ConversationRecord } from '../utils/storage';
import {
  loadConversations,
  deleteConversation,
  formatTimestamp,
  truncateTopic,
} from '../utils/storage';
import {
  History,
  Trash2,
  MessageSquare,
  Clock,
  X,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface ConversationHistoryProps {
  onLoadConversation: (conversation: ConversationRecord) => void;
  currentConversationId?: string | null;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  onLoadConversation,
  currentConversationId,
}) => {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 加载会话列表
  const refreshConversations = useCallback(() => {
    const data = loadConversations();
    setConversations(data);
  }, []);

  // 初始加载
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // 当组件展开时刷新列表
  useEffect(() => {
    if (isExpanded) {
      refreshConversations();
    }
  }, [isExpanded, refreshConversations]);

  // 处理删除会话
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIsDeleting(id);
    
    // 延迟执行删除，让用户看到反馈
    setTimeout(() => {
      deleteConversation(id);
      refreshConversations();
      setIsDeleting(null);
    }, 200);
  };

  // 处理加载会话
  const handleLoad = (conversation: ConversationRecord) => {
    onLoadConversation(conversation);
    setIsExpanded(false);
  };

  // 如果没有会话，显示空状态
  if (conversations.length === 0 && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200"
        style={{
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'transparent',
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
        <History className="w-4 h-4" />
        <span>历史话题</span>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200"
        style={{
          color: isExpanded ? 'var(--color-accent-gold)' : 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
          backgroundColor: isExpanded ? 'var(--color-bg-tertiary)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.borderColor = 'var(--color-accent-gold)';
            e.currentTarget.style.color = 'var(--color-accent-gold)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }
        }}
      >
        <History className="w-4 h-4" />
        <span>历史话题</span>
        {conversations.length > 0 && (
          <span
            className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
            style={{
              backgroundColor: 'var(--color-accent-gold)',
              color: 'var(--color-bg-primary)',
            }}
          >
            {conversations.length}
          </span>
        )}
      </button>

      {/* 下拉面板 */}
      {isExpanded && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* 面板内容 */}
          <div
            className="absolute right-0 top-full mt-2 w-80 z-50 overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* 头部 */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" style={{ color: 'var(--color-accent-gold)' }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  历史话题
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={refreshConversations}
                  className="p-1.5 transition-colors duration-200"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--color-accent-gold)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--color-text-muted)')
                  }
                  title="刷新列表"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 transition-colors duration-200"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--color-text-secondary)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--color-text-muted)')
                  }
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 会话列表 */}
            <div className="max-h-96 overflow-y-auto">
              {conversations.length === 0 ? (
                <div
                  className="px-4 py-8 text-center"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">暂无历史话题</p>
                </div>
              ) : (
                <div className="py-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleLoad(conversation)}
                      className="group mx-2 mb-2 p-3 cursor-pointer transition-all duration-200"
                      style={{
                        backgroundColor:
                          currentConversationId === conversation.id
                            ? 'var(--color-bg-tertiary)'
                            : 'var(--color-bg-primary)',
                        border:
                          currentConversationId === conversation.id
                            ? '1px solid var(--color-accent-gold)'
                            : '1px solid var(--color-border)',
                        opacity: isDeleting === conversation.id ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (currentConversationId !== conversation.id) {
                          e.currentTarget.style.borderColor = 'var(--color-border-light)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentConversationId !== conversation.id) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    >
                      {/* 话题标题 */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4
                          className="text-sm font-medium line-clamp-2 flex-1"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {truncateTopic(conversation.topic, 40)}
                        </h4>
                        <ChevronRight
                          className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--color-accent-gold)' }}
                        />
                      </div>

                      {/* 元信息 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* 消息数量 */}
                          <span
                            className="flex items-center gap-1 text-xs px-2 py-0.5"
                            style={{
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            <MessageSquare className="w-3 h-3" />
                            {conversation.messages.length}
                          </span>
                          
                          {/* 时间 */}
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(conversation.timestamp)}
                          </span>
                        </div>

                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDelete(e, conversation.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = '#ef4444')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = 'var(--color-text-muted)')
                          }
                          title="删除此记录"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 状态标签 */}
                      {conversation.status === 'finished' && (
                        <div className="mt-2">
                          <span
                            className="text-[10px] px-1.5 py-0.5"
                            style={{
                              backgroundColor: 'rgba(91, 138, 114, 0.2)',
                              color: 'var(--color-deepseek)',
                            }}
                          >
                            已完成
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部信息 */}
            {conversations.length > 0 && (
              <div
                className="px-4 py-2 border-t text-center"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span className="text-xs">共 {conversations.length} 条历史记录</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationHistory;
