import { createContext, useContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { DiscussionState, DiscussionStatus, AIRole, Message } from '../types';
import { INITIAL_STATE } from '../types';
import { saveConversation } from '../utils/storage';

// Action 类型
type DiscussionAction =
  | { type: 'SET_TOPIC'; payload: string }
  | { type: 'UPDATE_ROLE'; payload: AIRole }
  | { type: 'ADD_MESSAGE'; payload: { roleId: string; content: string; round: number; id: string } }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string; isComplete: boolean; reasoningContent?: string; searchResults?: Array<{title: string; link: string; content: string}> } }
  | { type: 'SET_STATUS'; payload: DiscussionStatus }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET' }
  | { type: 'SET_MAX_ROUNDS'; payload: number }
  | { type: 'SET_CONCLUSION'; payload: string }
  | { type: 'SAVE_CONVERSATION' }
  | { type: 'LOAD_CONVERSATION'; payload: Partial<DiscussionState> & { conversationId?: string } }
  | { type: 'SET_CONVERSATION_ID'; payload: string | null };

// State 扩展，包含当前会话ID
interface ExtendedDiscussionState extends DiscussionState {
  conversationId: string | null;
}

// 扩展 INITIAL_STATE
const EXTENDED_INITIAL_STATE: ExtendedDiscussionState = {
  ...INITIAL_STATE,
  conversationId: null,
};

// Reducer
const discussionReducer = (state: ExtendedDiscussionState, action: DiscussionAction): ExtendedDiscussionState => {
  switch (action.type) {
    case 'SET_TOPIC':
      return { ...state, topic: action.payload };
    
    case 'UPDATE_ROLE':
      return {
        ...state,
        roles: state.roles.map((role) =>
          role.id === action.payload.id ? action.payload : role
        ),
      };
    
    case 'ADD_MESSAGE':
      const newMessage: Message = {
        id: action.payload.id,
        roleId: action.payload.roleId,
        content: action.payload.content,
        timestamp: Date.now(),
        round: action.payload.round,
        isComplete: false,
      };
      return {
        ...state,
        messages: [...state.messages, newMessage],
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { 
                ...msg, 
                content: action.payload.content, 
                isComplete: action.payload.isComplete,
                ...(action.payload.reasoningContent !== undefined && { reasoningContent: action.payload.reasoningContent }),
                ...(action.payload.searchResults !== undefined && { searchResults: action.payload.searchResults }),
              }
            : msg
        ),
      };
    
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    
    case 'NEXT_ROUND':
      return { 
        ...state, 
        currentRound: state.currentRound + 1,
        status: 'waiting_deepseek'
      };
    
    case 'RESET':
      return {
        ...EXTENDED_INITIAL_STATE,
        roles: state.roles,
      };
    
    case 'SET_MAX_ROUNDS':
      return { ...state, maxRounds: action.payload };
    
    case 'SET_CONCLUSION':
      // 生成结论后仍保持可讨论状态，让用户可以继续深入
      return { ...state, finalConclusion: action.payload, status: 'waiting_host' };
    
    case 'SAVE_CONVERSATION':
      // 保存当前会话到本地存储
      try {
        const id = saveConversation(state, state.conversationId || undefined);
        return { ...state, conversationId: id };
      } catch (error) {
        console.error('Failed to save conversation:', error);
        return state;
      }
    
    case 'LOAD_CONVERSATION':
      // 加载会话到状态中
      return {
        ...state,
        ...action.payload,
        conversationId: action.payload.conversationId || null,
      };
    
    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.payload };
    
    default:
      return state;
  }
};

// Context 类型
interface DiscussionContextType {
  state: ExtendedDiscussionState;
  dispatch: React.Dispatch<DiscussionAction>;
  saveCurrentConversation: () => void;
  loadConversation: (conversationData: Partial<DiscussionState> & { conversationId?: string }) => void;
}

const DiscussionContext = createContext<DiscussionContextType | null>(null);

// Provider 组件
export const DiscussionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(discussionReducer, EXTENDED_INITIAL_STATE);

  // 保存当前会话的回调函数
  const saveCurrentConversation = useCallback(() => {
    if (state.topic && state.messages.length > 0) {
      dispatch({ type: 'SAVE_CONVERSATION' });
    }
  }, [state.topic, state.messages.length]);

  // 加载会话的回调函数
  const loadConversation = useCallback((conversationData: Partial<DiscussionState> & { conversationId?: string }) => {
    dispatch({ type: 'LOAD_CONVERSATION', payload: conversationData });
  }, []);

  return (
    <DiscussionContext.Provider value={{ state, dispatch, saveCurrentConversation, loadConversation }}>
      {children}
    </DiscussionContext.Provider>
  );
};

// Hook
export const useDiscussion = (): DiscussionContextType => {
  const context = useContext(DiscussionContext);
  if (!context) {
    throw new Error('useDiscussion must be used within a DiscussionProvider');
  }
  return context;
};
