// AI功能开关
export interface AIFeatures {
  deepThinking?: boolean;  // 深度思考
  webSearch?: boolean;     // 联网搜索
}

// AI角色定义
export interface AIRole {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  expertise: string;
  color: string;
  borderColor: string;
  apiType: 'deepseek' | 'glm';
  apiKey: string;
  features?: AIFeatures;  // 功能开关
}

// 主持人（用户）角色
export interface HostRole {
  id: 'host';
  name: string;
  avatar: string;
}

// 单条消息
export interface Message {
  id: string;
  roleId: string;
  content: string;
  timestamp: number;
  round: number;
  isComplete: boolean;
  reasoningContent?: string; // DeepSeek 深度思考内容
  searchResults?: SearchResult[]; // GLM 联网搜索结果
}

// 搜索结果
export interface SearchResult {
  title: string;
  link: string;
  content: string;
}

// 讨论状态 - 轮流模式
export type DiscussionStatus = 'idle' | 'waiting_deepseek' | 'waiting_glm' | 'waiting_host' | 'finished';

// 讨论会话
export interface DiscussionState {
  topic: string;
  roles: AIRole[];
  messages: Message[];
  currentRound: number;
  maxRounds: number;
  status: DiscussionStatus;
  finalConclusion: string | null;
}

// 默认角色配置
export const DEFAULT_ROLES: AIRole[] = [
  {
    id: 'deepseek',
    name: '🧠 DeepSeek',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deepseek&backgroundColor=1e3a8a',
    personality: '你是DeepSeek，以逻辑分析和深度思考见长。你善于拆解复杂问题，找出核心矛盾，提供结构化的分析框架。',
    expertise: '逻辑分析、深度推理',
    color: 'bg-blue-100 border-blue-300 text-blue-900',
    borderColor: 'border-blue-500',
    apiType: 'deepseek',
    apiKey: '',
    features: { deepThinking: true, webSearch: true },
  },
  {
    id: 'glm',
    name: '🔮 GLM-4',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=glm&backgroundColor=047857',
    personality: '你是GLM-4，以知识广博和创意整合见长。你善于连接不同领域的知识，提供创新的视角和实用的解决方案。',
    expertise: '知识整合、创新方案',
    color: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    borderColor: 'border-emerald-500',
    apiType: 'glm',
    apiKey: '',
    features: { deepThinking: true, webSearch: true },
  },
];

// 主持人配置
export const HOST_ROLE: HostRole = {
  id: 'host',
  name: '🎙️ 主持人（你）',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=host&backgroundColor=ffdfbf',
};

// 初始状态
export const INITIAL_STATE: DiscussionState = {
  topic: '',
  roles: DEFAULT_ROLES,
  messages: [],
  currentRound: 1,
  maxRounds: 999,
  status: 'idle',
  finalConclusion: null,
};
