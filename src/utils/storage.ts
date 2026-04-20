import type { DiscussionState, Message, AIRole } from '../types';

// 存储键名
const STORAGE_KEY = 'three-ai-debate-conversations';
const LAST_CONVERSATION_KEY = 'three-ai-debate-last-conversation';

// 会话记录类型
export interface ConversationRecord {
  id: string;
  topic: string;
  messages: Message[];
  timestamp: number;
  roles: AIRole[];
  conclusion: string | null;
  currentRound: number;
  maxRounds: number;
  status: DiscussionState['status'];
}

// 生成唯一ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 保存会话
export const saveConversation = (state: DiscussionState, existingId?: string): string => {
  try {
    const conversations = loadConversations();
    const id = existingId || generateId();
    
    const record: ConversationRecord = {
      id,
      topic: state.topic,
      messages: state.messages,
      timestamp: Date.now(),
      roles: state.roles,
      conclusion: state.finalConclusion,
      currentRound: state.currentRound,
      maxRounds: state.maxRounds,
      status: state.status,
    };

    // 检查是否已存在相同ID的记录
    const existingIndex = conversations.findIndex(c => c.id === id);
    if (existingIndex >= 0) {
      conversations[existingIndex] = record;
    } else {
      conversations.push(record);
    }

    // 按时间倒序排序
    conversations.sort((a, b) => b.timestamp - a.timestamp);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    
    // 同时保存为"最后一次会话"
    localStorage.setItem(LAST_CONVERSATION_KEY, JSON.stringify(record));
    
    return id;
  } catch (error) {
    console.error('Failed to save conversation:', error);
    throw new Error('保存会话失败');
  }
};

// 加载所有会话
export const loadConversations = (): ConversationRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const conversations: ConversationRecord[] = JSON.parse(data);
    // 按时间倒序排序
    return conversations.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
};

// 根据ID获取单个会话
export const getConversationById = (id: string): ConversationRecord | null => {
  try {
    const conversations = loadConversations();
    return conversations.find(c => c.id === id) || null;
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return null;
  }
};

// 删除会话
export const deleteConversation = (id: string): void => {
  try {
    const conversations = loadConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    throw new Error('删除会话失败');
  }
};

// 加载最后一次会话
export const loadLastConversation = (): ConversationRecord | null => {
  try {
    const data = localStorage.getItem(LAST_CONVERSATION_KEY);
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load last conversation:', error);
    return null;
  }
};

// 将会话记录转换为 DiscussionState
export const conversationToState = (record: ConversationRecord): Partial<DiscussionState> => {
  return {
    topic: record.topic,
    messages: record.messages,
    roles: record.roles,
    currentRound: record.currentRound,
    maxRounds: record.maxRounds,
    status: record.status,
    finalConclusion: record.conclusion,
  };
};

// 清空所有历史记录
export const clearAllConversations = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_CONVERSATION_KEY);
  } catch (error) {
    console.error('Failed to clear conversations:', error);
    throw new Error('清空历史记录失败');
  }
};

// 获取格式化的日期时间
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  }
  
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  }
  
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`;
  }
  
  // 超过7天显示日期
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 截断话题标题
export const truncateTopic = (topic: string, maxLength: number = 30): string => {
  if (topic.length <= maxLength) return topic;
  return topic.substring(0, maxLength) + '...';
};
