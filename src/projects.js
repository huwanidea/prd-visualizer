const stages = [
  { id: "lead", order: "01", title: "商机与客户", caption: "发现商机，管理客户" },
  { id: "quote", order: "02", title: "需求与报价", caption: "澄清需求，提供报价" },
  { id: "procure", order: "03", title: "采购与履约", caption: "采购执行，履约协同" },
  { id: "delivery", order: "04", title: "交付与验收", caption: "交付产品，验收确认" },
  { id: "settle", order: "05", title: "结算与复盘", caption: "对账结算，复盘改进" },
];

const layers = [
  { id: "task", title: "用户任务" },
  { id: "process", title: "业务流程" },
  { id: "feature", title: "产品功能" },
  { id: "page", title: "页面 / 交互" },
  { id: "acceptance", title: "验收标准" },
];

const makeItem = (id, title, stage, layer, extras = {}) => ({
  id,
  code: id.startsWith("SC-") ? id : undefined,
  title,
  stage,
  layer,
  owner: "李楠",
  role: "产品",
  status: "已完成",
  priority: "P1 高",
  description: "",
  acceptance: [],
  ...extras,
});

const supplyItems = [
  makeItem("TASK-01", "拓展客户", "lead", "task", { owner: "张磊", role: "销售", description: "建立潜在客户池并持续跟进商机。" }),
  makeItem("TASK-02", "商机跟进", "lead", "task", { owner: "张磊", role: "销售" }),
  makeItem("TASK-03", "收集需求", "quote", "task", { owner: "陈平", role: "产品" }),
  makeItem("TASK-04", "方案与报价", "quote", "task", { owner: "陈平", role: "产品" }),
  makeItem("TASK-05", "采购下单", "procure", "task", { owner: "王超", role: "采购" }),
  makeItem("TASK-06", "供应商协同", "procure", "task", { owner: "王超", role: "采购" }),
  makeItem("TASK-07", "交付执行", "delivery", "task", { owner: "刘静", role: "供应商" }),
  makeItem("TASK-08", "验收确认", "delivery", "task", { owner: "崔霞", role: "财务" }),
  makeItem("TASK-09", "对账结算", "settle", "task", { owner: "崔霞", role: "财务" }),
  makeItem("TASK-10", "复盘改进", "settle", "task", { owner: "李楠", role: "产品" }),

  makeItem("SC-010", "客户需求", "lead", "process", { owner: "张磊", role: "销售", description: "记录客户目标、范围、预算与交付时间。", position: { x: 80, y: 150 } }),
  makeItem("SC-020", "供应商询价", "quote", "process", { owner: "王超", role: "采购", description: "向候选供应商发起标准化询价。", position: { x: 240, y: 150 } }),
  makeItem("SC-030", "方案报价", "quote", "process", { owner: "陈平", role: "产品", description: "结合需求和询价结果形成客户方案与报价。", position: { x: 400, y: 150 } }),
  makeItem("SC-042", "合同审批", "procure", "process", {
    owner: "李楠",
    role: "采购",
    status: "待确认",
    description: "对采购合同条款、金额、供应商资质等进行合规性审批。",
    position: { x: 560, y: 150 },
    acceptance: [
      "合同在各审批角色处理后状态正确流转，审批意见可追溯。",
      "金额超预算时触发预算超限流程并记录。",
      "条款不合规可退回并保留修改历史。",
      "生成合同编号唯一，合同归档可查。",
    ],
    prd: {
      objective: "确保合同在合规、风控与预算范围内完成审批，形成可执行的采购合同。",
      trigger: "当“方案报价”通过后，系统创建合同草稿并进入审批流程。",
      preconditions: ["报价单已通过", "客户、供应商、物料等主数据已完成校验", "合同模板与金额范围匹配"],
      normalFlow: ["采购发起合同并填写关键条款", "销售确认商务条款与客户信息", "法务审查并提出修改意见", "财务复核预算与付款条件", "管理员或授权人审批通过", "系统生成合同编号并进入采购下单"],
      exceptions: [
        { scene: "金额超预算", action: "触发预算超限流程，需财务负责人复核或调整预算。" },
        { scene: "条款不合规", action: "退回法务修改，记录原因并通知相关方。" },
        { scene: "审批人超时", action: "系统发送催办，超时后按规则自动升级或转交。" },
        { scene: "供应商资质异常", action: "阻断审批，要求采购维护资质或更换供应商。" },
      ],
    },
  }),
  makeItem("SC-043", "合同归档", "procure", "process", { owner: "方敏", role: "法务", status: "已完成", position: { x: 560, y: 390 }, description: "对已通过合同进行电子归档。" }),
  makeItem("SC-044", "补充资料", "procure", "process", { owner: "王超", role: "采购", status: "待确认", position: { x: 720, y: 390 }, description: "资料不完整时补充附件与资质文件。" }),
  makeItem("SC-050", "采购下单", "procure", "process", { owner: "王超", role: "采购", position: { x: 720, y: 150 }, description: "基于审批合同生成采购订单。" }),
  makeItem("SC-060", "交付验收", "delivery", "process", { owner: "刘静", role: "供应商", position: { x: 880, y: 150 }, description: "执行交付并完成质量、数量和资料验收。" }),
  makeItem("SC-070", "对账结算", "settle", "process", { owner: "崔霞", role: "财务", position: { x: 1040, y: 150 }, description: "基于合同、订单与验收结果完成对账。" }),

  makeItem("FEAT-01", "客户管理", "lead", "feature", { owner: "张磊", role: "销售" }),
  makeItem("FEAT-02", "商机管理", "lead", "feature", { owner: "张磊", role: "销售" }),
  makeItem("FEAT-03", "报价管理", "quote", "feature", { owner: "陈平", role: "产品" }),
  makeItem("FEAT-04", "合同审批", "procure", "feature", { owner: "李楠", role: "采购", status: "待确认" }),
  makeItem("FEAT-05", "采购管理", "procure", "feature", { owner: "王超", role: "采购" }),
  makeItem("FEAT-06", "交付管理", "delivery", "feature", { owner: "刘静", role: "供应商" }),
  makeItem("FEAT-07", "验收管理", "delivery", "feature", { owner: "陈平", role: "产品" }),
  makeItem("FEAT-08", "结算管理", "settle", "feature", { owner: "崔霞", role: "财务" }),
  makeItem("FEAT-09", "复盘管理", "settle", "feature", { owner: "李楠", role: "产品" }),

  makeItem("PAGE-01", "客户档案页", "lead", "page"),
  makeItem("PAGE-02", "商机详情页", "lead", "page"),
  makeItem("PAGE-03", "报价工作台", "quote", "page"),
  makeItem("PAGE-04", "报价单详情页", "quote", "page"),
  makeItem("PAGE-05", "合同审批页", "procure", "page", { status: "待确认" }),
  makeItem("PAGE-06", "采购订单页", "procure", "page"),
  makeItem("PAGE-07", "交付任务页", "delivery", "page"),
  makeItem("PAGE-08", "验收单页", "delivery", "page"),
  makeItem("PAGE-09", "结算单页", "settle", "page"),
  makeItem("PAGE-10", "复盘报告页", "settle", "page"),

  makeItem("AC-01", "客户信息完整率 ≥ 95%", "lead", "acceptance"),
  makeItem("AC-02", "商机转化记录可追溯", "lead", "acceptance"),
  makeItem("AC-03", "报价准确率 ≥ 98%", "quote", "acceptance"),
  makeItem("AC-04", "报价响应时效 ≤ 4 小时", "quote", "acceptance"),
  makeItem("AC-05", "采购订单准确率 ≥ 98%", "procure", "acceptance"),
  makeItem("AC-06", "订单确认及时率 ≥ 95%", "procure", "acceptance"),
  makeItem("AC-07", "验收通过率 ≥ 98%", "delivery", "acceptance"),
  makeItem("AC-08", "验收不通过处理标准缺失", "delivery", "acceptance", { status: "缺失", owner: "待分配", role: "产品" }),
  makeItem("AC-09", "对账差异率 ≤ 0.5%", "settle", "acceptance"),
  makeItem("AC-10", "结算周期 ≤ 7 天", "settle", "acceptance"),
];

const supplyEdges = [
  ["SC-010", "SC-020"], ["SC-020", "SC-030"], ["SC-030", "SC-042"],
  ["SC-042", "SC-050"], ["SC-050", "SC-060"], ["SC-060", "SC-070"],
  ["SC-042", "SC-043", "通过"], ["SC-042", "SC-044", "资料不完整"],
  ["SC-043", "SC-030", "驳回修改"], ["SC-044", "SC-042", "补充后重提"],
].map(([source, target, label], index) => ({ id: `e-${index}`, source, target, label }));

const actors = [
  { role: "销售", owner: "张磊", color: "blue" },
  { role: "产品", owner: "陈平", color: "indigo" },
  { role: "采购", owner: "王超", color: "green" },
  { role: "供应商", owner: "刘静", color: "purple" },
  { role: "财务", owner: "崔霞", color: "amber" },
];

const aiFindings = [
  { id: "AI-01", type: "需求缺口", title: "缺少“验收不通过处理标准”", stage: "交付与验收", severity: "high" },
  { id: "AI-02", type: "需求缺口", title: "未定义“合同审批超时处理规则”", stage: "采购与履约", severity: "high" },
  { id: "AI-03", type: "需求缺口", title: "未覆盖“变更申请与审批流程”", stage: "采购与履约", severity: "medium" },
  { id: "AI-04", type: "断链", title: "报价管理 → 合同审批存在断链", stage: "需求与报价", severity: "medium" },
];

const makeLiteProject = (id, name, description, accent, stageNames) => {
  const liteStages = stageNames.map((title, index) => ({ id: `${id}-s${index}`, order: String(index + 1).padStart(2, "0"), title, caption: "" }));
  const liteItems = liteStages.flatMap((stage, index) => [
    makeItem(`${id}-TASK-${index}`, `${stage.title}任务`, stage.id, "task", { owner: "林悦", role: "产品" }),
    makeItem(`${id}-PROC-${index}`, `${stage.title}流程`, stage.id, "process", { owner: "林悦", role: "产品", position: { x: 120 + index * 280, y: 170 } }),
    makeItem(`${id}-FEAT-${index}`, `${stage.title}功能`, stage.id, "feature", { owner: "周明", role: "研发" }),
    makeItem(`${id}-PAGE-${index}`, `${stage.title}页面`, stage.id, "page", { owner: "赵欣", role: "设计" }),
    makeItem(`${id}-AC-${index}`, `${stage.title}验收完整`, stage.id, "acceptance", { owner: "林悦", role: "产品" }),
  ]);
  return {
    id, name, description, accent, stages: liteStages, layers, items: liteItems,
    edges: liteStages.slice(0, -1).map((_, i) => ({ id: `${id}-e${i}`, source: `${id}-PROC-${i}`, target: `${id}-PROC-${i + 1}` })),
    actors: [{ role: "产品", owner: "林悦", color: "blue" }, { role: "研发", owner: "周明", color: "green" }, { role: "设计", owner: "赵欣", color: "purple" }],
    aiFindings: [{ id: `${id}-AI-1`, type: "需求缺口", title: "有 2 项验收标准需要补全", stage: stageNames[1], severity: "medium" }],
    updatedAt: "刚刚",
  };
};

export const initialProjects = [
  {
    id: "supply-chain",
    name: "供应链协同平台",
    description: "从商机到结算的供应链业务与平台功能全景",
    accent: "#2f66f5",
    stages,
    layers,
    items: supplyItems,
    edges: supplyEdges,
    actors,
    aiFindings,
    updatedAt: "刚刚",
  },
  makeLiteProject("crm", "CRM 重构项目", "重构客户生命周期与销售协同", "#6856e8", ["线索", "商机", "方案", "签约", "续费"]),
  makeLiteProject("travel", "旅游定制系统", "定制需求、行程方案与履约协同", "#0f9f6e", ["获客", "需求诊断", "方案设计", "预订履约", "回访"]),
];

export const statusMeta = {
  "已完成": { className: "success", label: "已完成" },
  "进行中": { className: "info", label: "进行中" },
  "待确认": { className: "warning", label: "待确认" },
  "缺失": { className: "danger", label: "缺失" },
  "未开始": { className: "neutral", label: "未开始" },
};

export const roleColors = {
  "销售": "blue",
  "产品": "indigo",
  "采购": "green",
  "供应商": "purple",
  "财务": "amber",
  "法务": "cyan",
  "研发": "green",
  "设计": "purple",
};
