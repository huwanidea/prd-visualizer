# 结构镜 · PRD 全景工作台 MVP

一个面向复杂项目的桌面端 PRD 可视化原型。它把同一份项目数据同时呈现为分层全景图、自由流程画布、结构化 PRD、数据模型和 AI 执行记录。

## 已实现

- 多项目切换与新建项目
- “业务阶段 → 用户任务 → 业务流程 → 产品功能 → 页面 / 交互 → 验收标准”的分层全景
- 基于 React Flow 的拖拽、缩放、连线、新建、删除和小地图
- PRD 直接编辑并写回统一项目模型
- 节点负责人、角色、状态、优先级、依赖和 AI 建议面板
- 本地 `localStorage` 持久化
- 三个可切换的示例项目，主示例为供应链协同平台

## 本地运行

```powershell
npm.cmd install
npm.cmd run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

打开 `http://localhost:4173/` 。

## 验证

```powershell
npm.cmd run build
npm.cmd run test:sites
```

设计对照、交互验证与已知限制记录在 `design-qa.md`。

## 下一阶段边界

进入真正可用的内测版前，需要补齐后端数据库、登录和项目权限、版本历史与冲突解决、DOCX/Markdown 解析、模型 API 编排以及 MCP/Skill 执行审批机制。
