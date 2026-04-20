import type { DiscussionState } from '../types';

export function exportToMarkdown(state: DiscussionState): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const roleNameMap: Record<string, string> = {
    deepseek: '🧠 DeepSeek',
    glm: '🔮 GLM-4',
    host: '🎙️ 主持人',
  };

  const messagesByRound = state.messages.reduce((acc, msg) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {} as Record<number, typeof state.messages>);

  let md = `# 智识交响 · AI 思辨记录\n\n`;
  md += `**话题**：${state.topic}  \n`;
  md += `**日期**：${dateStr}  \n`;
  md += `**总轮数**：${state.currentRound}\n\n`;
  md += `---\n\n`;

  for (const [round, msgs] of Object.entries(messagesByRound)) {
    md += `## 第 ${round} 轮\n\n`;

    for (const msg of msgs) {
      if (msg.roleId === 'system' || !msg.content) continue;

      const name = roleNameMap[msg.roleId] || msg.roleId;
      md += `### ${name}\n\n`;

      if (msg.reasoningContent) {
        md += `<details>\n<summary>思考过程</summary>\n\n${msg.reasoningContent}\n\n</details>\n\n`;
      }

      md += `${msg.content}\n\n`;
    }

    md += `---\n\n`;
  }

  if (state.finalConclusion) {
    md += `## 综合结论\n\n${state.finalConclusion}\n`;
  }

  const safeTitle = state.topic.slice(0, 20).replace(/[\\/:*?"<>|]/g, '_');
  const datePart = now.toISOString().slice(0, 10);

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AI讨论-${safeTitle}-${datePart}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
