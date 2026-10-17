import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowsOut,
  Bell,
  BookOpenText,
  Browser,
  CaretDown,
  CaretRight,
  Check,
  CheckCircle,
  Circle,
  CloudCheck,
  Command,
  Database,
  DotsThree,
  DownloadSimple,
  Eye,
  FileText,
  Folder,
  Funnel,
  Gear,
  GitBranch,
  GridFour,
  LinkSimple,
  List,
  MagicWand,
  MagnifyingGlass,
  NotePencil,
  Plus,
  Question,
  Robot,
  SealCheck,
  SidebarSimple,
  SlidersHorizontal,
  Sparkle,
  Stack,
  Table,
  TreeStructure,
  UploadSimple,
  User,
  UsersThree,
  Warning,
  X,
} from "@phosphor-icons/react";
import { initialProjects, roleColors, statusMeta } from "./projects.js";

const VIEW_META = [
  { id: "panorama", label: "全景图", icon: GridFour },
  { id: "flow", label: "流程画布", icon: GitBranch },
  { id: "prd", label: "PRD", icon: FileText },
  { id: "data", label: "数据模型", icon: Database },
  { id: "ai", label: "AI 执行记录", icon: Robot },
];

const LAYER_ICONS = {
  task: User,
  process: GitBranch,
  feature: GridFour,
  page: Browser,
  acceptance: SealCheck,
};

const DEFAULT_PRD = {
  objective: "明确该节点的业务目标、参与角色和完成标准。",
  trigger: "当前置流程完成后进入本节点。",
  preconditions: ["上游资料完整", "参与角色具有操作权限"],
  normalFlow: ["负责人发起处理", "系统校验必要信息", "参与方确认", "节点完成并通知下游"],
  exceptions: [{ scene: "资料不完整", action: "阻断流程并提示补充资料。" }],
};

function cloneInitialProjects() {
  return JSON.parse(JSON.stringify(initialProjects));
}

function loadProjects() {
  try {
    const saved = localStorage.getItem("prd-visualizer-projects-v1");
    return saved ? JSON.parse(saved) : cloneInitialProjects();
  } catch {
    return cloneInitialProjects();
  }
}

function getItem(project, id) {
  return project.items.find((item) => item.id === id) || project.items.find((item) => item.layer === "process") || project.items[0];
}

function StatusBadge({ status, compact = false }) {
  const meta = statusMeta[status] || statusMeta["未开始"];
  return (
    <span className={`status-badge ${meta.className} ${compact ? "compact" : ""}`}>
      <span className="status-dot" />
      {meta.label}
    </span>
  );
}

function RolePill({ role }) {
  return <span className={`role-pill ${roleColors[role] || "neutral"}`}>{role}</span>;
}

function IconButton({ label, children, className = "", ...props }) {
  return (
    <button className={`icon-button ${className}`} title={label} aria-label={label} {...props}>
      {children}
    </button>
  );
}

function Topbar({ project, view, setView, onToggleProjects, projectMenuOpen, onRunAi, syncState }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <IconButton label="主菜单"><List size={20} /></IconButton>
        <button className="project-switcher" onClick={onToggleProjects}>
          <span className="brand-mark"><TreeStructure size={17} weight="bold" /></span>
          <span>{project.name}</span>
          <CaretDown size={14} className={projectMenuOpen ? "rotate" : ""} />
        </button>
      </div>
      <nav className="top-nav" aria-label="项目视图">
        {VIEW_META.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)} aria-label={label} title={label}>
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="top-actions">
        <button className="search-command">
          <MagnifyingGlass size={17} />
          <span>搜索节点、文档、人员</span>
          <kbd><Command size={11} /> K</kbd>
        </button>
        <span className="sync-state"><CloudCheck size={18} weight="fill" />{syncState}</span>
        <IconButton label="帮助"><Question size={19} /></IconButton>
        <IconButton label="通知" className="notification-button"><Bell size={19} /><i>3</i></IconButton>
        <button className="avatar">L</button>
        <button className="primary-button ai-button" onClick={onRunAi}><Sparkle size={17} weight="fill" />AI 检查完整性</button>
      </div>
    </header>
  );
}

function ProjectMenu({ projects, activeProjectId, onSelect, onNew, onClose }) {
  return (
    <div className="project-menu">
      <div className="project-menu-header">
        <div>
          <strong>切换项目</strong>
          <span>{projects.length} 个项目</span>
        </div>
        <IconButton label="关闭" onClick={onClose}><X size={16} /></IconButton>
      </div>
      <label className="menu-search">
        <MagnifyingGlass size={16} />
        <input placeholder="搜索项目" autoFocus />
      </label>
      <div className="project-list">
        {projects.map((item) => (
          <button key={item.id} className={item.id === activeProjectId ? "active" : ""} onClick={() => onSelect(item.id)}>
            <span className="project-color" style={{ background: item.accent }} />
            <span className="project-menu-copy">
              <strong>{item.name}</strong>
              <small>{item.description}</small>
            </span>
            {item.id === activeProjectId && <Check size={17} weight="bold" />}
          </button>
        ))}
      </div>
      <button className="new-project-button" onClick={onNew}><Plus size={17} />新建项目</button>
    </div>
  );
}

function Sidebar({ project, view, setView, onSelectItem, selectedItemId, onImport }) {
  const [treeOpen, setTreeOpen] = useState(true);
  const [assetOpen, setAssetOpen] = useState(false);
  const selectedItem = getItem(project, selectedItemId);
  const layerGroups = project.layers.map((layer) => ({
    ...layer,
    count: project.items.filter((item) => item.layer === layer.id).length,
  }));
  return (
    <aside className="sidebar">
      <div className="sidebar-title"><span><SidebarSimple size={17} />项目结构</span><IconButton label="新增"><Plus size={16} /></IconButton></div>
      <button className="tree-project" onClick={() => setTreeOpen((value) => !value)}>
        {treeOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
        <span className="tree-project-mark" style={{ background: project.accent }} />
        <strong>{project.name}</strong>
      </button>
      {treeOpen && (
        <div className="tree-section">
          <p className="section-kicker">业务阶段</p>
          {project.stages.map((stage) => (
            <button
              key={stage.id}
              className={selectedItem?.stage === stage.id ? "tree-row active" : "tree-row"}
              onClick={() => {
                const item = project.items.find((node) => node.stage === stage.id && node.layer === "process");
                if (item) onSelectItem(item.id);
              }}
            >
              <span className="stage-order">{stage.order}</span>
              <span>{stage.title}</span>
            </button>
          ))}
          <p className="section-kicker with-space">项目内容</p>
          {layerGroups.map((layer) => {
            const Icon = LAYER_ICONS[layer.id];
            return (
              <button
                key={layer.id}
                className={view === (layer.id === "process" ? "flow" : layer.id === "page" ? "panorama" : view) ? "tree-row active-soft" : "tree-row"}
                onClick={() => {
                  if (layer.id === "process") setView("flow");
                  if (layer.id === "page" || layer.id === "task" || layer.id === "feature" || layer.id === "acceptance") setView("panorama");
                }}
              >
                <Icon size={15} />
                <span>{layer.title}</span>
                <small>{layer.count}</small>
              </button>
            );
          })}
        </div>
      )}
      <div className="sidebar-divider" />
      <p className="section-kicker sidebar-label">保存的视图</p>
      <div className="saved-views">
        <button className={view === "panorama" ? "active" : ""} onClick={() => setView("panorama")}><GridFour size={16} />当前全景图</button>
        <button onClick={() => setView("panorama")}><UsersThree size={16} />按角色查看</button>
        <button onClick={() => setView("panorama")}><Warning size={16} />问题项视图<span className="count danger">4</span></button>
        <button onClick={() => setView("panorama")}><Eye size={16} />仅看未覆盖验收</button>
      </div>
      <div className="sidebar-divider" />
      <button className="asset-toggle" onClick={() => setAssetOpen((value) => !value)}>
        <span>资产库</span>{assetOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
      </button>
      {assetOpen && (
        <div className="saved-views">
          <button><Stack size={16} />模块库</button>
          <button><Database size={16} />数据字典</button>
          <button><BookOpenText size={16} />文档库</button>
        </div>
      )}
      <div className="sidebar-bottom">
        <label className="import-button">
          <UploadSimple size={17} />
          导入 PRD
          <input type="file" accept=".docx,.md,.txt,.json" onChange={onImport} />
        </label>
        <button><Gear size={17} />项目设置</button>
      </div>
    </aside>
  );
}

function WorkspaceToolbar({ view, filters, setFilters, onAddNode }) {
  if (view === "flow") {
    return (
      <div className="workspace-toolbar flow-toolbar">
        <button className="tool-active"><GitBranch size={17} />选择</button>
        <button onClick={onAddNode}><Plus size={17} />添加节点</button>
        <span className="toolbar-separator" />
        <button><NotePencil size={17} />批注</button>
        <button><LinkSimple size={17} />连接</button>
        <span className="toolbar-hint">拖动节点 · 拖拽端点连线 · Delete 删除</span>
      </div>
    );
  }
  if (view === "prd") {
    return (
      <div className="workspace-toolbar document-toolbar">
        <span className="breadcrumb">业务流程 <CaretRight size={13} /> 功能清单 <CaretRight size={13} /> 合同审批</span>
        <span className="toolbar-spacer" />
        <button><UsersThree size={17} />协作</button>
        <button><DotsThree size={20} /></button>
      </div>
    );
  }
  return (
    <div className="workspace-toolbar">
      <label className="filter-control"><User size={15} /><select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}><option>全部角色</option><option>销售</option><option>产品</option><option>采购</option><option>供应商</option><option>财务</option></select></label>
      <label className="filter-control"><Circle size={15} /><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option>全部状态</option><option>已完成</option><option>待确认</option><option>缺失</option></select></label>
      <label className="filter-control"><Funnel size={15} /><select value={filters.coverage} onChange={(event) => setFilters({ ...filters, coverage: event.target.value })}><option>全部覆盖度</option><option>存在缺口</option><option>覆盖完整</option></select></label>
      <span className="toolbar-separator" />
      <label className="toggle-control"><input type="checkbox" checked={filters.onlyIssues} onChange={(event) => setFilters({ ...filters, onlyIssues: event.target.checked })} /><span />仅看问题项</label>
      <span className="toolbar-spacer" />
      <span className="toolbar-caption">视图已自动保存</span>
    </div>
  );
}

function PanoramaCard({ item, selected, onSelect }) {
  return (
    <button className={`panorama-card ${selected ? "selected" : ""} ${item.status === "缺失" ? "missing" : ""}`} onClick={() => onSelect(item.id)}>
      <span>{item.title}</span>
      {item.status === "缺失" && <Warning size={15} weight="fill" />}
    </button>
  );
}

function PanoramaView({ project, selectedItemId, onSelectItem, filters }) {
  const filteredItems = useMemo(() => project.items.filter((item) => {
    if (filters.role !== "全部角色" && item.role !== filters.role) return false;
    if (filters.status !== "全部状态" && item.status !== filters.status) return false;
    if (filters.onlyIssues && !["缺失", "待确认"].includes(item.status)) return false;
    return true;
  }), [project.items, filters]);
  const selected = getItem(project, selectedItemId);
  return (
    <div className="panorama-view dotted-surface">
      <div className="panorama-grid" style={{ "--stage-count": project.stages.length }}>
        <div className="matrix-corner"><span>业务阶段</span><small>{project.stages.length}</small></div>
        {project.stages.map((stage) => (
          <button key={stage.id} className={selected?.stage === stage.id ? "stage-header active" : "stage-header"}>
            <span>{stage.order}</span><strong>{stage.title}</strong>
          </button>
        ))}
        {project.layers.map((layer, layerIndex) => {
          const LayerIcon = LAYER_ICONS[layer.id];
          const coverage = Math.max(68, 96 - layerIndex * 4 - (layer.id === "acceptance" ? 2 : 0));
          return [
            <div className="layer-header" key={`label-${layer.id}`}>
              <span><LayerIcon size={17} />{layer.title}<CaretDown size={13} /></span>
              <small>覆盖度 <b>{coverage}%</b>{layer.id === "acceptance" && <Warning size={13} weight="fill" />}</small>
            </div>,
            ...project.stages.map((stage) => {
              const items = filteredItems.filter((item) => item.layer === layer.id && item.stage === stage.id);
              return (
                <div className={`matrix-cell ${selected?.stage === stage.id ? "column-active" : ""}`} key={`${layer.id}-${stage.id}`}>
                  {items.length ? items.map((item) => <PanoramaCard key={item.id} item={item} selected={selectedItemId === item.id} onSelect={onSelectItem} />) : <span className="empty-cell">—</span>}
                </div>
              );
            }),
          ];
        })}
      </div>
      <div className="ai-activity-strip">
        <div className="ai-activity-title"><Sparkle size={17} weight="fill" /><strong>AI 活动</strong><span>发现 3 个需求缺口 · 1 个断链</span></div>
        <div className="ai-finding-cards">
          {project.aiFindings.map((finding) => (
            <button key={finding.id} onClick={() => onSelectItem(finding.id === "AI-01" ? "AC-08" : selectedItemId)}>
              <span className={`finding-type ${finding.severity}`}><i />{finding.type}</span>
              <strong>{finding.title}</strong>
              <small>{finding.stage}</small>
              <CaretRight size={15} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const ProcessNode = memo(({ data, selected }) => {
  const item = data.item;
  return (
    <div className={`flow-node ${selected ? "selected" : ""} ${item.status === "待确认" ? "pending" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="flow-node-head"><span>{item.code || item.id}</span>{item.status === "已完成" ? <CheckCircle size={15} weight="fill" /> : <Circle size={15} weight="fill" />}</div>
      <strong>{item.title}</strong>
      <div className="flow-node-meta"><RolePill role={item.role} /><span className="initial-avatar">{item.owner.slice(0, 1)}</span></div>
      <Handle type="source" position={Position.Right} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="top" type="target" position={Position.Top} />
    </div>
  );
});
ProcessNode.displayName = "ProcessNode";

function FlowView({ project, setProject, selectedItemId, onSelectItem, addNodeRequest }) {
  const processItems = useMemo(() => project.items.filter((item) => item.layer === "process"), [project.items]);
  const toFlowNodes = useCallback(() => processItems.map((item) => ({
    id: item.id,
    type: "process",
    position: item.position || { x: 80, y: 160 },
    data: { item },
  })), [processItems]);
  const toFlowEdges = useCallback(() => project.edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    animated: edge.label === "补充后重提",
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#748196" },
    style: { stroke: edge.label ? "#9a6b35" : "#748196", strokeWidth: 1.5, strokeDasharray: edge.label === "资料不完整" ? "5 4" : undefined },
    labelStyle: { fill: "#866137", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#fffdf8", fillOpacity: 0.92 },
  })), [project.edges]);
  const [nodes, setNodes] = useState(toFlowNodes);
  const [edges, setEdges] = useState(toFlowEdges);

  useEffect(() => setNodes(toFlowNodes()), [project.id, project.items, toFlowNodes]);
  useEffect(() => setEdges(toFlowEdges()), [project.id, project.edges, toFlowEdges]);

  useEffect(() => {
    if (!addNodeRequest) return;
    const index = project.items.filter((item) => item.layer === "process").length + 1;
    const id = `SC-${String(80 + index).padStart(3, "0")}`;
    const newItem = {
      id, code: id, title: "新流程节点", stage: project.stages[1]?.id || project.stages[0].id,
      layer: "process", owner: "待分配", role: "产品", status: "未开始", priority: "P2 中",
      description: "双击右侧属性进行编辑。", acceptance: [], position: { x: 380 + index * 24, y: 440 + index * 18 },
    };
    setProject({ ...project, items: [...project.items, newItem] });
    onSelectItem(id);
  }, [addNodeRequest]);

  const onNodesChange = useCallback((changes) => setNodes((current) => applyNodeChanges(changes, current)), []);
  const onEdgesChange = useCallback((changes) => setEdges((current) => applyEdgeChanges(changes, current)), []);
  const onConnect = useCallback((connection) => {
    const edge = { ...connection, id: `e-${Date.now()}` };
    setEdges((current) => addEdge(edge, current));
    setProject({ ...project, edges: [...project.edges, edge] });
  }, [project, setProject]);
  const onNodeDragStop = useCallback((_, node) => {
    setProject({ ...project, items: project.items.map((item) => item.id === node.id ? { ...item, position: node.position } : item) });
  }, [project, setProject]);
  const onNodesDelete = useCallback((deleted) => {
    const ids = new Set(deleted.map((node) => node.id));
    setProject({
      ...project,
      items: project.items.filter((item) => !ids.has(item.id)),
      edges: project.edges.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)),
    });
  }, [project, setProject]);
  return (
    <div className="flow-view dotted-surface">
      <div className="stage-lanes">
        {project.stages.map((stage) => <div key={stage.id}><strong>{stage.order} {stage.title}</strong><small>{stage.caption}</small></div>)}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ process: ProcessNode }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onNodeClick={(_, node) => onSelectItem(node.id)}
        onPaneClick={() => {}}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        minZoom={0.35}
        maxZoom={1.8}
        selectionOnDrag
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background variant="dots" gap={22} size={1.25} color="#c9d2df" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={(node) => node.id === selectedItemId ? "#2f66f5" : "#cfd9e8"} maskColor="rgba(247,249,252,.78)" />
      </ReactFlow>
      <div className="flow-legend">
        <span><i className="done" />已完成</span><span><i className="pending" />待确认</span><span><i className="branch" />异常分支</span>
      </div>
    </div>
  );
}

function EditableText({ value, onChange, className = "", as: Tag = "p" }) {
  return (
    <Tag
      className={`editable-text ${className}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={(event) => onChange(event.currentTarget.textContent.trim())}
    >
      {value}
    </Tag>
  );
}

function PrdView({ project, selectedItemId, updateItem }) {
  const item = getItem(project, selectedItemId);
  const prd = item.prd || DEFAULT_PRD;
  const updatePrd = (patch) => updateItem(item.id, { prd: { ...prd, ...patch } });
  return (
    <div className="prd-view dotted-surface">
      <article className="prd-document">
        <div className="document-head">
          <div><span className="document-id">{item.code || item.id}</span><StatusBadge status={item.status} compact /></div>
          <h1>{item.title}</h1>
          <p>最后同步于刚刚 · 所有修改都会写入项目统一模型</p>
        </div>
        <section className="doc-section">
          <h3><span>01</span>目标</h3>
          <EditableText value={prd.objective} onChange={(value) => updatePrd({ objective: value })} />
        </section>
        <section className="doc-section">
          <h3><span>02</span>参与角色</h3>
          <div className="role-row">{["销售", "采购", "财务", "法务", "管理员"].map((role) => <RolePill key={role} role={role} />)}</div>
        </section>
        <section className="doc-section">
          <h3><span>03</span>触发条件</h3>
          <EditableText value={prd.trigger} onChange={(value) => updatePrd({ trigger: value })} />
          <h4>前置条件</h4>
          <ul>{prd.preconditions.map((condition, index) => <li key={index}><EditableText as="span" value={condition} onChange={(value) => updatePrd({ preconditions: prd.preconditions.map((entry, i) => i === index ? value : entry) })} /></li>)}</ul>
        </section>
        <section className="doc-section">
          <h3><span>04</span>正常流程</h3>
          <ol className="flow-steps">{prd.normalFlow.map((step, index) => <li key={index}><b>{index + 1}</b><EditableText as="span" value={step} onChange={(value) => updatePrd({ normalFlow: prd.normalFlow.map((entry, i) => i === index ? value : entry) })} /></li>)}</ol>
        </section>
        <section className="doc-section">
          <h3><span>05</span>异常流程</h3>
          <table className="exception-table">
            <thead><tr><th>异常场景</th><th>处理策略</th></tr></thead>
            <tbody>{prd.exceptions.map((row, index) => <tr key={index}><td>{row.scene}</td><td>{row.action}</td></tr>)}</tbody>
          </table>
        </section>
        <section className="doc-section">
          <h3><span>06</span>验收标准</h3>
          <div className="checklist">{(item.acceptance?.length ? item.acceptance : ["业务状态流转正确并可追溯", "关键异常场景有明确处理策略"]).map((entry, index) => <label key={index}><input type="checkbox" defaultChecked={index < 3} /><span>{entry}</span></label>)}</div>
        </section>
      </article>
    </div>
  );
}

function DataModelView({ project }) {
  const entities = [
    { name: "Project", label: "项目", fields: ["id", "name", "status", "owner"] },
    { name: "Stage", label: "业务阶段", fields: ["id", "project_id", "order", "title"] },
    { name: "Requirement", label: "需求节点", fields: ["id", "stage_id", "type", "status", "owner"] },
    { name: "Relation", label: "节点关系", fields: ["source_id", "target_id", "relation_type"] },
    { name: "Document", label: "PRD 文档", fields: ["id", "requirement_id", "content", "version"] },
    { name: "AiRun", label: "AI 执行", fields: ["id", "project_id", "action", "result"] },
  ];
  return (
    <div className="data-view dotted-surface">
      <div className="data-summary">
        <div><Database size={21} /><span><strong>{entities.length}</strong>核心实体</span></div>
        <div><LinkSimple size={21} /><span><strong>{project.edges.length}</strong>流程关系</span></div>
        <div><Stack size={21} /><span><strong>{project.items.length}</strong>结构化节点</span></div>
        <button><DownloadSimple size={17} />导出 JSON Schema</button>
      </div>
      <div className="entity-canvas">
        {entities.map((entity, index) => (
          <section className="entity-card" key={entity.name} style={{ "--entity-index": index }}>
            <header><Table size={17} /><div><strong>{entity.name}</strong><span>{entity.label}</span></div><DotsThree size={18} /></header>
            <div>{entity.fields.map((field, fieldIndex) => <p key={field}><span>{fieldIndex === 0 ? "PK" : field.includes("_id") ? "FK" : "—"}</span><code>{field}</code><small>{fieldIndex === 0 ? "uuid" : "text"}</small></p>)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AiLogView({ project, onRunAi, onApplyFinding }) {
  const events = [
    { time: "刚刚", title: "完整性检查完成", detail: `扫描 ${project.items.length} 个节点，发现 ${project.aiFindings.length} 个问题`, status: "完成" },
    { time: "10:24", title: "PRD 自动同步", detail: "合同审批节点字段已写回 PRD 4.3", status: "完成" },
    { time: "09:58", title: "导入结构化分析", detail: "识别 5 个阶段、17 个流程和 24 个功能映射", status: "完成" },
  ];
  return (
    <div className="ai-log-view dotted-surface">
      <div className="ai-hero">
        <div className="ai-orb"><Sparkle size={28} weight="fill" /></div>
        <div><p>项目智能体</p><h2>让 AI 检查项目结构，而不是替你做决定</h2><span>AI 修改进入待确认状态；人工批准后才会同步到全景图和 PRD。</span></div>
        <button className="primary-button" onClick={onRunAi}><MagicWand size={17} />运行完整性检查</button>
      </div>
      <div className="ai-layout">
        <section className="ai-findings-panel">
          <header><div><strong>待处理建议</strong><span>{project.aiFindings.length} 项</span></div><button><SlidersHorizontal size={17} />筛选</button></header>
          {project.aiFindings.map((finding) => (
            <article key={finding.id}>
              <div className={`finding-icon ${finding.severity}`}><Warning size={18} weight="fill" /></div>
              <div><span>{finding.type} · {finding.stage}</span><strong>{finding.title}</strong><p>AI 已定位关联节点并生成建议修改，应用前可查看影响范围。</p></div>
              <button onClick={() => onApplyFinding(finding)}>应用</button>
            </article>
          ))}
        </section>
        <section className="ai-history-panel">
          <header><strong>执行记录</strong><button>查看全部</button></header>
          {events.map((event, index) => (
            <div className="timeline-event" key={index}>
              <i><Check size={12} weight="bold" /></i>
              <div><span>{event.time}</span><strong>{event.title}</strong><p>{event.detail}</p></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function MiniFlow({ project, selectedItemId, onSelectItem }) {
  const nodes = project.items.filter((item) => item.layer === "process").slice(0, 7);
  return (
    <div className="mini-flow">
      {nodes.map((node, index) => (
        <div key={node.id}>
          <button className={node.id === selectedItemId ? "active" : ""} onClick={() => onSelectItem(node.id)}><span>{node.title}</span><small>{node.code || node.id}</small></button>
          {index < nodes.length - 1 && <CaretRight size={14} />}
        </div>
      ))}
    </div>
  );
}

function Inspector({ project, selectedItemId, updateItem, onSelectItem, onApplySuggestion, view, setView }) {
  const item = getItem(project, selectedItemId);
  const stage = project.stages.find((entry) => entry.id === item.stage);
  const deps = project.edges.filter((edge) => edge.source === item.id || edge.target === item.id).map((edge) => {
    const otherId = edge.source === item.id ? edge.target : edge.source;
    return { ...getItem(project, otherId), direction: edge.source === item.id ? "下游" : "上游" };
  });
  if (view === "prd") {
    return (
      <aside className="inspector prd-inspector">
        <div className="inspector-head"><div><span>同步视图</span><small>实时</small></div><IconButton label="展开"><ArrowsOut size={17} /></IconButton></div>
        <section className="inspector-section">
          <div className="section-heading"><strong>流程视图（端到端）</strong><button>全屏</button></div>
          <MiniFlow project={project} selectedItemId={selectedItemId} onSelectItem={onSelectItem} />
        </section>
        <section className="sync-card">
          <div><span>变更摘要</span><StatusBadge status="待确认" compact /></div>
          <p>画布和 PRD 共享同一数据模型，当前有 2 处修改等待确认。</p>
          <div><button>接受图中修改</button><button className="primary-button">写回 PRD</button></div>
        </section>
        <section className="inspector-section">
          <div className="section-heading"><strong>差异详情</strong><span>2</span></div>
          <div className="diff-card"><b>1</b><div><strong>字段变更：负责人</strong><p>PRD：李楠</p><p className="diff-new">图中：张伟（采购）</p><small>来源：流程图编辑 · 10:18</small></div></div>
          <div className="diff-card"><b>2</b><div><strong>新增异常分支</strong><p className="diff-new">供应商资质异常</p><small>来源：AI 补全异常分支 · 10:15</small></div></div>
        </section>
      </aside>
    );
  }
  return (
    <aside className="inspector">
      <div className="inspector-head"><div><span>所选项详情</span><small>{item.layer === "process" ? "业务流程" : project.layers.find((layer) => layer.id === item.layer)?.title}</small></div><IconButton label="收起"><X size={17} /></IconButton></div>
      <section className="item-summary">
        <div className="item-code-row"><span>{item.code || item.id}</span><StatusBadge status={item.status} compact /></div>
        <input className="title-input" value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} />
        <p>{stage?.order} {stage?.title}</p>
      </section>
      <section className="inspector-form">
        <label><span>负责人</span><input value={item.owner} onChange={(event) => updateItem(item.id, { owner: event.target.value })} /></label>
        <label><span>参与角色</span><select value={item.role} onChange={(event) => updateItem(item.id, { role: event.target.value })}>{["销售", "产品", "采购", "供应商", "财务", "法务", "研发", "设计"].map((role) => <option key={role}>{role}</option>)}</select></label>
        <label><span>状态</span><select value={item.status} onChange={(event) => updateItem(item.id, { status: event.target.value })}>{Object.keys(statusMeta).map((status) => <option key={status}>{status}</option>)}</select></label>
        <label><span>优先级</span><select value={item.priority} onChange={(event) => updateItem(item.id, { priority: event.target.value })}><option>P0 紧急</option><option>P1 高</option><option>P2 中</option><option>P3 低</option></select></label>
        <label className="description-field"><span>描述</span><textarea value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /></label>
      </section>
      <section className="inspector-section">
        <div className="section-heading"><strong>PRD 同步状态</strong><span className="synced"><CheckCircle size={15} weight="fill" />已同步</span></div>
        <p className="muted">最近同步：刚刚</p>
        <button className="outline-button" onClick={() => setView("prd")}><FileText size={16} />打开对应 PRD</button>
      </section>
      <section className="inspector-section">
        <div className="section-heading"><strong>依赖关系</strong><span>{deps.length}</span></div>
        <div className="dependency-list">{deps.length ? deps.slice(0, 4).map((dep) => <button key={dep.id} onClick={() => onSelectItem(dep.id)}><span>{dep.direction}</span><strong>{dep.code || dep.id} {dep.title}</strong><StatusBadge status={dep.status} compact /></button>) : <p className="muted">暂无依赖关系</p>}</div>
      </section>
      <section className="inspector-section">
        <div className="section-heading"><strong>AI 建议</strong><button>刷新</button></div>
        <div className="suggestion-list">
          {[["补全异常分支", "识别到 1 处异常边，建议补全处理路径"], ["检查需求遗漏", "发现 3 项潜在遗漏需求"], ["生成验收标准", "基于上下游生成验收草案"]].map(([title, detail]) => <div key={title}><span><Sparkle size={15} weight="fill" /></span><div><strong>{title}</strong><p>{detail}</p></div><button onClick={() => onApplySuggestion(title, item)}>应用</button></div>)}
        </div>
      </section>
    </aside>
  );
}

function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (name.trim()) onCreate(name.trim()); }}>
        <div className="modal-icon"><Folder size={22} /></div>
        <h2>新建项目</h2>
        <p>创建一个独立项目空间，画布、PRD、数据和 AI 上下文会完全隔离。</p>
        <label>项目名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：订单履约平台" autoFocus /></label>
        <div className="modal-actions"><button type="button" onClick={onClose}>取消</button><button className="primary-button" type="submit">创建项目</button></div>
      </form>
    </div>
  );
}

export function App() {
  const [projects, setProjects] = useState(loadProjects);
  const [activeProjectId, setActiveProjectId] = useState(projects[0]?.id || "supply-chain");
  const [view, setView] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    return VIEW_META.some((entry) => entry.id === requested) ? requested : "panorama";
  });
  const [selectedItemId, setSelectedItemId] = useState("SC-042");
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [filters, setFilters] = useState({ role: "全部角色", status: "全部状态", coverage: "全部覆盖度", onlyIssues: false });
  const [toast, setToast] = useState("");
  const [syncState, setSyncState] = useState("已同步");
  const [addNodeRequest, setAddNodeRequest] = useState(0);
  const toastTimer = useRef(null);
  const project = projects.find((item) => item.id === activeProjectId) || projects[0];

  useEffect(() => {
    localStorage.setItem("prd-visualizer-projects-v1", JSON.stringify(projects));
  }, [projects]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }, []);

  const setProject = useCallback((nextProject) => {
    setSyncState("同步中…");
    setProjects((current) => current.map((entry) => entry.id === nextProject.id ? nextProject : entry));
    window.setTimeout(() => setSyncState("已同步"), 520);
  }, []);

  const updateItem = useCallback((id, patch) => {
    const currentProject = projects.find((entry) => entry.id === activeProjectId);
    setProject({ ...currentProject, items: currentProject.items.map((item) => item.id === id ? { ...item, ...patch } : item), updatedAt: "刚刚" });
  }, [projects, activeProjectId, setProject]);

  const handleProjectSelect = (id) => {
    const next = projects.find((item) => item.id === id);
    setActiveProjectId(id);
    setSelectedItemId(next.items.find((item) => item.layer === "process")?.id || next.items[0]?.id);
    setProjectMenuOpen(false);
    showToast(`已切换到「${next.name}」`);
  };

  const createProject = (name) => {
    const base = cloneInitialProjects()[1];
    const id = `project-${Date.now()}`;
    const next = { ...base, id, name, description: "新建业务项目", items: base.items.map((item) => ({ ...item, id: item.id.replace(/^crm/, id) })), edges: [] };
    setProjects((current) => [...current, next]);
    setActiveProjectId(id);
    setSelectedItemId(next.items[0].id);
    setNewProjectOpen(false);
    setProjectMenuOpen(false);
    showToast("项目已创建，数据与 AI 上下文已隔离");
  };

  const handleRunAi = () => {
    showToast(`AI 正在检查 ${project.items.length} 个节点，已发现 ${project.aiFindings.length} 个问题`);
  };

  const applySuggestion = (title, item) => {
    if (title === "补全异常分支") {
      const prd = item.prd || DEFAULT_PRD;
      updateItem(item.id, { prd: { ...prd, exceptions: [...prd.exceptions, { scene: "审批超时", action: "自动催办，并在超时后升级至上级审批人。" }] }, status: "待确认" });
    } else if (title === "生成验收标准") {
      updateItem(item.id, { acceptance: [...(item.acceptance || []), "异常处理路径完整，节点状态与通知记录可追溯。"], status: "待确认" });
    }
    showToast(`“${title}”已生成草案，等待确认`);
  };

  const applyFinding = (finding) => {
    if (finding.id === "AI-01") updateItem("AC-08", { title: "验收不通过时 2 小时内生成整改任务", status: "待确认", owner: "陈平" });
    showToast("建议已应用到统一模型，并同步至相关视图");
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (file) showToast(`已读取「${file.name}」，结构化解析任务已建立`);
    event.target.value = "";
  };

  return (
    <div className="app-shell">
      <Topbar project={project} view={view} setView={setView} onToggleProjects={() => setProjectMenuOpen((value) => !value)} projectMenuOpen={projectMenuOpen} onRunAi={handleRunAi} syncState={syncState} />
      {projectMenuOpen && <ProjectMenu projects={projects} activeProjectId={activeProjectId} onSelect={handleProjectSelect} onNew={() => setNewProjectOpen(true)} onClose={() => setProjectMenuOpen(false)} />}
      <Sidebar project={project} view={view} setView={setView} onSelectItem={setSelectedItemId} selectedItemId={selectedItemId} onImport={handleImport} />
      <main className="workspace">
        <WorkspaceToolbar view={view} filters={filters} setFilters={setFilters} onAddNode={() => setAddNodeRequest((value) => value + 1)} />
        <div className="workspace-content">
          {view === "panorama" && <PanoramaView project={project} selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} filters={filters} />}
          {view === "flow" && <FlowView project={project} setProject={setProject} selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} addNodeRequest={addNodeRequest} />}
          {view === "prd" && <PrdView project={project} selectedItemId={selectedItemId} updateItem={updateItem} />}
          {view === "data" && <DataModelView project={project} />}
          {view === "ai" && <AiLogView project={project} onRunAi={handleRunAi} onApplyFinding={applyFinding} />}
        </div>
      </main>
      {view !== "data" && view !== "ai" && <Inspector project={project} selectedItemId={selectedItemId} updateItem={updateItem} onSelectItem={setSelectedItemId} onApplySuggestion={applySuggestion} view={view} setView={setView} />}
      {newProjectOpen && <NewProjectModal onClose={() => setNewProjectOpen(false)} onCreate={createProject} />}
      {toast && <div className="toast"><CheckCircle size={18} weight="fill" />{toast}</div>}
    </div>
  );
}
