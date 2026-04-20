import { useCallback } from 'react';
import type { AIRole, Message } from '../types';

interface StreamCallbacks {
  onContent: (content: string, reasoningContent?: string) => void;
  onComplete: (searchResults?: SearchResult[]) => void;
  onError: (error: Error) => void;
}

interface SearchResult {
  title: string;
  link: string;
  content: string;
}

// 使用 GLM 进行联网搜索（为 DeepSeek 提供搜索服务）
const searchWithGLM = async (query: string, apiKey: string): Promise<SearchResult[]> => {
  console.log('[Search] Using GLM to search for:', query);
  
  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          { role: 'system', content: '你是一个搜索助手。请使用联网搜索功能搜索相关信息。' },
          { role: 'user', content: `请搜索以下话题的最新信息：${query}` }
        ],
        tools: [{
          type: 'web_search',
          web_search: { enable: true, search_result: true }
        }],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('[Search] GLM search failed:', response.status);
      return [];
    }

    const data = await response.json();
    const results: SearchResult[] = [];
    
    // 提取搜索结果
    if (data.choices?.[0]?.message?.tool_calls) {
      for (const toolCall of data.choices[0].message.tool_calls) {
        if (toolCall.type === 'web_search' && toolCall.web_search?.results) {
          for (const result of toolCall.web_search.results) {
            results.push({
              title: result.title || '',
              link: result.link || '',
              content: result.content || ''
            });
          }
        }
      }
    }
    
    console.log('[Search] Found', results.length, 'results');
    return results;
  } catch (error) {
    console.error('[Search] Error:', error);
    return [];
  }
};

// 获取当前真实日期时间
const getCurrentDateTime = (): string => {
  const now = new Date();
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
};

// 构建提示词 - 轮流讨论模式
const buildPrompt = (
  role: AIRole,
  topic: string,
  history: Message[],
  otherRole: AIRole,
  isFirstSpeaker: boolean,
  searchResults?: SearchResult[]
): string => {
  const historyText = history
    .filter(m => m.roleId !== 'host' && m.roleId !== 'system')
    .map((m) => {
      const speaker = m.roleId === 'deepseek' ? 'DeepSeek' : 'GLM-4';
      return `${speaker}: ${m.content}`;
    })
    .join('\n\n');

  // 当前真实时间
  const currentDateTime = getCurrentDateTime();

  // 根据功能开关构建能力描述
  const capabilities: string[] = [];
  if (role.features?.deepThinking) capabilities.push('深度思考');
  if (role.features?.webSearch) capabilities.push('联网搜索获取最新信息');
  
  const capabilityText = capabilities.length > 0 
    ? `【当前启用：${capabilities.join(' + ')}】\n\n` 
    : '';

  // 深度思考模式的特殊提示
  const deepThinkingPrompt = role.features?.deepThinking ? `
【深度思考模式】
请按以下步骤思考并回复：
1. 先分析问题的核心矛盾点和关键因素
2. 列出可能的解决方案及其优劣
3. 结合最新信息（如开启联网）给出最优建议
4. 提供具体可执行的行动步骤
` : '';

  // 联网搜索结果
  const searchResultsPrompt = searchResults && searchResults.length > 0 ? `
【联网搜索结果】
以下是搜索到的最新相关信息：
${searchResults.map((r, i) => `${i + 1}. ${r.title}
   链接: ${r.link}
   内容: ${r.content}`).join('\n\n')}

请基于以上搜索结果和已有知识进行回复。
` : '';

  return `你是"${role.name}"，${role.personality}
你的专长：${role.expertise}

【重要】今天是：${currentDateTime}
你的知识可能截止到过去，但现在是2026年。请基于当前真实时间（2026年）进行分析和建议。

${capabilityText}【协作模式】
你和${otherRole.name}正在主持人引导下轮流讨论。
${isFirstSpeaker ? '你是本轮第一个发言。' : `对方(${otherRole.name})已经发表了观点，你需要在分析对方观点的基础上回应。`}
主持人可以随时介入引导。

【当前话题】
${topic}
${deepThinkingPrompt}${searchResultsPrompt}
【历史对话】
${historyText || '（这是本轮的开始）'}

【回复要求】
1. ${isFirstSpeaker ? '直接针对话题发表你的深入见解' : '先简要分析对方观点的亮点和不足，然后发表你的见解'}
2. 每次发言控制在300-500字
3. 展现清晰的逻辑结构
4. ${role.features?.webSearch ? '搜索并使用2026年的最新数据和信息' : '基于已有知识给出建议，但请记住现在是2026年'}
5. 所有时间相关建议必须基于当前真实时间：${currentDateTime}（2026年）

请发表你的观点（只输出最终结论，不要输出思考过程）：`;
};


// 流式响应处理
const handleStream = async (
  response: Response, 
  callbacks: StreamCallbacks, 
  apiType: 'deepseek' | 'glm',
  role?: AIRole
) => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let accumulatedContent = '';
  let accumulatedReasoning = '';
  let hasReceivedContent = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  const searchResults: SearchResult[] = [];

  // 设置超时检测
  const resetTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      console.warn(`[API] ${apiType} stream timeout, forcing complete`);
      if (hasReceivedContent) {
        callbacks.onComplete(searchResults.length > 0 ? searchResults : undefined);
      }
    }, 30000);
  };

  try {
    resetTimeout();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (!hasReceivedContent) {
          throw new Error('No content received from API');
        }
        callbacks.onComplete(searchResults.length > 0 ? searchResults : undefined);
        break;
      }

      resetTimeout();
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.trim() === 'data: [DONE]') {
          callbacks.onComplete(searchResults.length > 0 ? searchResults : undefined);
          return;
        }

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices?.[0]?.delta;
            
            // DeepSeek: 捕获思考过程
            if (apiType === 'deepseek' && role?.features?.deepThinking) {
              const reasoning = delta?.reasoning_content || '';
              if (reasoning) {
                accumulatedReasoning += reasoning;
              }
            }
            
            // 捕获正式回复内容
            const content = delta?.content || '';
            
            // GLM: 捕获联网搜索结果
            if (apiType === 'glm' && data.choices?.[0]?.delta?.tool_calls) {
              const toolCalls = data.choices[0].delta.tool_calls;
              for (const toolCall of toolCalls) {
                if (toolCall.type === 'web_search' && toolCall.web_search?.results) {
                  for (const result of toolCall.web_search.results) {
                    searchResults.push({
                      title: result.title || '',
                      link: result.link || '',
                      content: result.content || ''
                    });
                  }
                }
              }
            }
            
            if (content && content.trim()) {
              hasReceivedContent = true;
              accumulatedContent += content;
              callbacks.onContent(
                accumulatedContent, 
                accumulatedReasoning || undefined
              );
            }
          } catch (e) {
            // 忽略解析错误的行
          }
        }
      }
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    reader.releaseLock();
  }
};

// DeepSeek API 调用
const callDeepSeekAPI = async (
  role: AIRole,
  messages: { role: string; content: string }[],
  callbacks: StreamCallbacks,
  searchResults?: SearchResult[]
) => {
  console.log('[API] Calling DeepSeek...', new Date().toISOString(), 
    '深度思考:', role.features?.deepThinking, 
    '联网搜索:', role.features?.webSearch,
    '搜索结果数:', searchResults?.length || 0);
  const startTime = Date.now();
  
  // 根据功能开关选择模型
  const model = role.features?.deepThinking 
    ? 'deepseek-reasoner'
    : 'deepseek-chat';
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${role.apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] DeepSeek error response:', errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    await handleStream(response, callbacks, 'deepseek', role);
    console.log('[API] DeepSeek completed in', (Date.now() - startTime) / 1000, 'seconds');
  } catch (error) {
    console.error('[API] DeepSeek failed:', error);
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
};

// GLM API 调用
const callGLMAPI = async (
  role: AIRole,
  messages: { role: string; content: string }[],
  callbacks: StreamCallbacks
) => {
  console.log('[API] Calling GLM-4...', new Date().toISOString(),
    '深度思考:', role.features?.deepThinking,
    '联网搜索:', role.features?.webSearch);
  const startTime = Date.now();
  
  // 根据功能开关决定是否启用联网搜索
  const tools: any[] = [];
  if (role.features?.webSearch) {
    tools.push({
      type: 'web_search',
      web_search: { enable: true, search_result: true }
    });
  }
  
  // GLM没有深度思考模型，但可以通过temperature和提示词模拟
  const temperature = role.features?.deepThinking ? 0.5 : 0.7;
  
  try {
    const body: any = {
      model: 'glm-4',
      messages,
      temperature,
      max_tokens: 1500,
      stream: true,
    };
    
    if (tools.length > 0) {
      body.tools = tools;
    }
    
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${role.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GLM error response:', errorText);
      throw new Error(`GLM API error: ${response.status} - ${errorText}`);
    }

    await handleStream(response, callbacks, 'glm', role);
    console.log('[API] GLM completed in', (Date.now() - startTime) / 1000, 'seconds');
  } catch (error) {
    console.error('[API] GLM failed:', error);
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const useAIAPI = () => {
  // 让指定AI发言
  const askAI = useCallback(
    async (
      role: AIRole,
      topic: string,
      history: Message[],
      otherRole: AIRole,
      isFirstSpeaker: boolean,
      callbacks: StreamCallbacks
    ) => {
      let searchResults: SearchResult[] | undefined;
      
      // 如果启用了联网搜索，先进行搜索
      if (role.features?.webSearch) {
        if (role.apiType === 'deepseek') {
          // DeepSeek 本身不支持联网，使用 GLM 代搜
          console.log('[Search] DeepSeek using GLM proxy search');
          // 先搜索当前日期确认时间
          const dateResults = await searchWithGLM(`今天是几号 现在时间 2026年`, otherRole.apiKey);
          // 再搜索话题相关内容
          const topicResults = await searchWithGLM(topic, otherRole.apiKey);
          searchResults = [...dateResults, ...topicResults];
        }
        // GLM 会在自己的 API 调用中处理搜索，但也先搜索一下日期
        else {
          console.log('[Search] GLM searching for current date first');
          const dateResults = await searchWithGLM(`今天是几号 现在时间 2026年`, role.apiKey);
          if (dateResults.length > 0) {
            searchResults = dateResults;
          }
        }
      }
      
      const systemPrompt = buildPrompt(role, topic, history, otherRole, isFirstSpeaker, searchResults);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请发表你的观点' },
      ];

      const wrappedCallbacks: StreamCallbacks = {
        onContent: callbacks.onContent,
        onComplete: callbacks.onComplete,
        onError: callbacks.onError,
      };

      if (role.apiType === 'deepseek') {
        await callDeepSeekAPI(role, messages, wrappedCallbacks, searchResults);
      } else {
        await callGLMAPI(role, messages, wrappedCallbacks);
      }
    },
    []
  );

  // 生成最终结论
  const generateConclusion = useCallback(
    async (
      role: AIRole,
      topic: string,
      history: Message[],
      callbacks: StreamCallbacks
    ) => {
      const discussionText = history
        .filter(m => m.roleId !== 'host' && m.roleId !== 'system')
        .map((m) => `${m.roleId === 'deepseek' ? 'DeepSeek' : 'GLM-4'}: ${m.content}`)
        .join('\n\n');

      const prompt = `作为${role.name}，请基于以下讨论记录，生成一个全面的综合结论。

【话题】${topic}

【讨论记录】
${discussionText}

【结论要求】
1. 总结双方观点的精华和互补之处
2. 给出具体、可执行的建议
3. 指出还需要进一步探讨的问题
4. 控制在400字以内

请生成深度分析的结论：`;

      const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: '请生成结论' },
      ];

      if (role.apiType === 'deepseek') {
        await callDeepSeekAPI(role, messages, callbacks);
      } else {
        await callGLMAPI(role, messages, callbacks);
      }
    },
    []
  );

  return { askAI, generateConclusion };
};

export default useAIAPI;
