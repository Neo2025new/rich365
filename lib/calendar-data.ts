export type MBTIType =
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP"

export type ProfessionalRole = "创业者/自雇者" | "职场打工人" | "创作者/内容从业者" | "投资理财者" | "学习者/转型者"

export type DailyAction = {
  id: number
  date: string
  title: string
  description: string
  emoji?: string
  theme?: string
  mbti?: MBTIType[]
  role?: ProfessionalRole[]
}

export type MonthTheme = {
  month: number
  name: string
  theme: string
  description: string
  emoji: string
  mbti?: MBTIType[]
  role?: ProfessionalRole[]
}

export type UserProfile = {
  mbti: MBTIType
  role: ProfessionalRole
}

// MBTI personality data with icons
export const mbtiData: Record<MBTIType, { name: string; emoji: string; trait: string }> = {
  INTJ: { name: "建筑师", emoji: "🏗️", trait: "策略思维" },
  INTP: { name: "逻辑学家", emoji: "🧠", trait: "创新思考" },
  ENTJ: { name: "指挥官", emoji: "⚔️", trait: "领导力" },
  ENTP: { name: "辩论家", emoji: "💡", trait: "创意爆发" },
  INFJ: { name: "提倡者", emoji: "🌟", trait: "洞察力" },
  INFP: { name: "调停者", emoji: "🌈", trait: "理想主义" },
  ENFJ: { name: "主人公", emoji: "🎭", trait: "感染力" },
  ENFP: { name: "竞选者", emoji: "🎪", trait: "热情活力" },
  ISTJ: { name: "物流师", emoji: "📋", trait: "执行力" },
  ISFJ: { name: "守卫者", emoji: "🛡️", trait: "责任心" },
  ESTJ: { name: "总经理", emoji: "📊", trait: "管理能力" },
  ESFJ: { name: "执政官", emoji: "🤝", trait: "协调能力" },
  ISTP: { name: "鉴赏家", emoji: "🔧", trait: "实践能力" },
  ISFP: { name: "探险家", emoji: "🎨", trait: "艺术感" },
  ESTP: { name: "企业家", emoji: "🚀", trait: "行动派" },
  ESFP: { name: "表演者", emoji: "🎬", trait: "社交达人" },
}

// Professional roles with icons and descriptions
export const roleData: Record<ProfessionalRole, { emoji: string; description: string; traits: string }> = {
  "创业者/自雇者": {
    emoji: "🧑‍💻",
    description: "独立经营项目或品牌，关注收入增长与商业模式",
    traits: "执行力强，时间自由，重视现金流",
  },
  职场打工人: {
    emoji: "👩‍💼",
    description: "在企业工作，关注升职加薪与副业拓展",
    traits: "稳定执行，注重个人成长",
  },
  "创作者/内容从业者": {
    emoji: "🧑‍🎨",
    description: "以创意、表达、社交媒体为生",
    traits: "热爱表达，重视影响力变现",
  },
  投资理财者: {
    emoji: "📈",
    description: "以投资、资产管理为主要搞钱方式",
    traits: "注重策略与判断力",
  },
  "学习者/转型者": {
    emoji: "👩‍🏫",
    description: "正在学习或准备转型职业",
    traits: "成长导向，愿意尝试新领域",
  },
}

// Action categories for better organization
type ActionCategory =
  | "learning"
  | "networking"
  | "content"
  | "optimization"
  | "sales"
  | "investment"
  | "branding"
  | "skill"
  | "mindset"
  | "execution"

// Comprehensive action templates organized by category
const actionTemplatesByCategory: Record<
  ActionCategory,
  Array<{
    title: string
    description: string
    emoji: string
    mbtiPreference?: string[]
    rolePreference?: ProfessionalRole[]
  }>
> = {
  learning: [
    { title: "学习一个新的投资知识", description: "每天学一点，财商就会慢慢提升。", emoji: "📚" },
    { title: "研究一个成功案例", description: "从别人的成功中找到可复制的方法。", emoji: "🔍" },
    { title: "阅读一篇行业报告", description: "了解行业趋势，把握赚钱机会。", emoji: "📊", mbtiPreference: ["N", "T"] },
    {
      title: "学习一个新工具",
      description: "工具用得好，效率翻倍。",
      emoji: "🛠️",
      rolePreference: ["创业者/自雇者", "创作者/内容从业者"],
    },
    { title: "观看一个商业课程", description: "系统学习，快速成长。", emoji: "🎓" },
    { title: "研究竞争对手策略", description: "知己知彼，百战不殆。", emoji: "🎯", mbtiPreference: ["T", "J"] },
    {
      title: "学习数据分析技能",
      description: "用数据驱动决策。",
      emoji: "📈",
      rolePreference: ["投资理财者", "创业者/自雇者"],
    },
    { title: "深入研究用户需求", description: "理解需求才能创造价值。", emoji: "🔬", mbtiPreference: ["N", "F"] },
    {
      title: "探索新的职业方向",
      description: "多尝试才能找到适合自己的路。",
      emoji: "🧭",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "学习职场沟通技巧",
      description: "沟通能力决定职场高度。",
      emoji: "💬",
      rolePreference: ["职场打工人"],
    },
    {
      title: "研究内容创作技巧",
      description: "好内容是影响力的基础。",
      emoji: "✨",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "学习投资理财知识",
      description: "理财是一生的必修课。",
      emoji: "💰",
      rolePreference: ["投资理财者"],
    },
    {
      title: "参加技能培训课程",
      description: "持续学习，保持竞争力。",
      emoji: "📖",
      rolePreference: ["学习者/转型者", "职场打工人"],
    },
    {
      title: "研究商业模式创新",
      description: "好的商业模式是成功的关键。",
      emoji: "💡",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "学习时间管理方法",
      description: "时间管理好，效率自然高。",
      emoji: "⏰",
      rolePreference: ["职场打工人", "创业者/自雇者"],
    },
    {
      title: "研究行业趋势变化",
      description: "把握趋势，抓住机会。",
      emoji: "🔮",
      mbtiPreference: ["N"],
    },
    {
      title: "学习个人品牌打造",
      description: "品牌是最好的护城河。",
      emoji: "⭐",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "研究副业赚钱方法",
      description: "多一份收入，多一份保障。",
      emoji: "💼",
      rolePreference: ["职场打工人", "学习者/转型者"],
    },
    {
      title: "学习资产配置策略",
      description: "合理配置，降低风险。",
      emoji: "📊",
      rolePreference: ["投资理财者"],
    },
    {
      title: "研究用户增长策略",
      description: "增长是商业的核心。",
      emoji: "📈",
      rolePreference: ["创业者/自雇者", "创作者/内容从业者"],
    },
  ],

  networking: [
    {
      title: "主动联系一个潜在客户",
      description: "机会不会自己来，要主动去创造。",
      emoji: "📞",
      mbtiPreference: ["E"],
      rolePreference: ["创业者/自雇者"],
    },
    { title: "参加一个行业活动", description: "拓展人脉，发现新机会。", emoji: "🤝", mbtiPreference: ["E"] },
    { title: "约见一位行业前辈", description: "前辈的经验是最宝贵的财富。", emoji: "☕", mbtiPreference: ["E", "F"] },
    { title: "加入一个专业社群", description: "找到志同道合的伙伴。", emoji: "👥", mbtiPreference: ["E"] },
    { title: "为他人提供价值", description: "先付出，后收获。", emoji: "🎁", mbtiPreference: ["F"] },
    {
      title: "建立合作关系",
      description: "合作共赢，1+1>2。",
      emoji: "🤜🤛",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "维护老客户关系",
      description: "老客户是最稳定的收入来源。",
      emoji: "💝",
      rolePreference: ["创业者/自雇者"],
    },
    { title: "拓展跨界人脉", description: "跨界合作带来新机会。", emoji: "🌐", mbtiPreference: ["N", "E"] },
    {
      title: "参加职场社交活动",
      description: "人脉就是钱脉。",
      emoji: "🎉",
      rolePreference: ["职场打工人"],
    },
    {
      title: "与创作者交流合作",
      description: "互相学习，共同成长。",
      emoji: "🤝",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "参加投资者聚会",
      description: "交流投资心得，拓展视野。",
      emoji: "💼",
      rolePreference: ["投资理财者"],
    },
    {
      title: "寻找职业导师",
      description: "导师的指导能少走弯路。",
      emoji: "🧑‍🏫",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "建立客户信任关系",
      description: "信任是成交的基础。",
      emoji: "🤝",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "参与行业交流会",
      description: "了解行业动态，把握机会。",
      emoji: "📢",
      mbtiPreference: ["E"],
    },
    {
      title: "与同行建立联系",
      description: "同行不是冤家，是资源。",
      emoji: "👥",
      rolePreference: ["创业者/自雇者", "创作者/内容从业者"],
    },
    {
      title: "拓展职场人脉圈",
      description: "人脉广，机会多。",
      emoji: "🌟",
      rolePreference: ["职场打工人"],
    },
    {
      title: "参加创业者聚会",
      description: "与创业者交流，激发灵感。",
      emoji: "🚀",
      rolePreference: ["创业者/自雇者", "学习者/转型者"],
    },
    {
      title: "建立粉丝社群",
      description: "社群是最好的流量池。",
      emoji: "👨‍👩‍👧‍👦",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "与投资人建立联系",
      description: "好的投资人能带来资源。",
      emoji: "💰",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "参加职业发展讲座",
      description: "学习他人经验，规划自己未来。",
      emoji: "🎓",
      rolePreference: ["学习者/转型者", "职场打工人"],
    },
  ],

  content: [
    {
      title: "发布一条有价值的内容",
      description: "分享你的专业见解，建立个人影响力。",
      emoji: "✍️",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "创作一个新的作品",
      description: "用创意打开财富之门。",
      emoji: "🎨",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "录制一个短视频",
      description: "视频是最好的传播方式。",
      emoji: "🎬",
      rolePreference: ["创作者/内容从业者"],
    },
    { title: "写一篇深度文章", description: "深度内容建立专业形象。", emoji: "📝", mbtiPreference: ["I", "N"] },
    { title: "设计一个爆款标题", description: "好标题是成功的一半。", emoji: "💡", mbtiPreference: ["N"] },
    { title: "优化内容发布策略", description: "策略对了，事半功倍。", emoji: "📅", mbtiPreference: ["J"] },
    { title: "分析内容数据表现", description: "数据告诉你什么内容受欢迎。", emoji: "📊", mbtiPreference: ["T"] },
    { title: "创建内容日历", description: "有计划的创作更高效。", emoji: "🗓️", mbtiPreference: ["J"] },
    {
      title: "分享工作心得体会",
      description: "分享是最好的学习方式。",
      emoji: "💭",
      rolePreference: ["职场打工人"],
    },
    {
      title: "记录创业心路历程",
      description: "记录成长，激励自己。",
      emoji: "📖",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "分享投资理财经验",
      description: "分享经验，帮助他人。",
      emoji: "💰",
      rolePreference: ["投资理财者"],
    },
    {
      title: "记录学习成长过程",
      description: "记录是最好的复盘。",
      emoji: "📚",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "制作教程类内容",
      description: "教学相长，共同进步。",
      emoji: "🎓",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "分享行业洞察观点",
      description: "专业观点建立权威。",
      emoji: "🔍",
      mbtiPreference: ["N", "T"],
    },
    {
      title: "创作故事类内容",
      description: "故事更容易打动人心。",
      emoji: "📖",
      mbtiPreference: ["N", "F"],
    },
    {
      title: "制作数据可视化内容",
      description: "数据可视化更有说服力。",
      emoji: "📊",
      rolePreference: ["投资理财者"],
    },
    {
      title: "分享职场技能干货",
      description: "干货内容最受欢迎。",
      emoji: "💼",
      rolePreference: ["职场打工人"],
    },
    {
      title: "记录创作灵感想法",
      description: "灵感稍纵即逝，要及时记录。",
      emoji: "💡",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "分享商业案例分析",
      description: "案例分析提升商业认知。",
      emoji: "📈",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "制作学习笔记总结",
      description: "总结是深度学习的关键。",
      emoji: "📝",
      rolePreference: ["学习者/转型者"],
    },
  ],

  optimization: [
    {
      title: "优化你的工作流程",
      description: "效率提升10%，收入就可能增加10%。",
      emoji: "⚙️",
      mbtiPreference: ["T", "J"],
    },
    {
      title: "优化产品页面",
      description: "细节决定转化率。",
      emoji: "💻",
      rolePreference: ["创业者/自雇者"],
    },
    { title: "提升时间管理能力", description: "时间就是金钱。", emoji: "⏰", mbtiPreference: ["J"] },
    { title: "简化业务流程", description: "复杂的流程会降低效率。", emoji: "🔄", mbtiPreference: ["T"] },
    {
      title: "优化定价策略",
      description: "价格定得对，利润翻一倍。",
      emoji: "💰",
      rolePreference: ["创业者/自雇者"],
    },
    { title: "改进客户体验", description: "体验好，客户才会回头。", emoji: "⭐", mbtiPreference: ["F"] },
    {
      title: "自动化重复工作",
      description: "把时间用在更有价值的事上。",
      emoji: "🤖",
      rolePreference: ["创业者/自雇者"],
    },
    { title: "优化成本结构", description: "降低成本就是增加利润。", emoji: "📉", mbtiPreference: ["T", "J"] },
    {
      title: "优化职场工作效率",
      description: "高效工作，准时下班。",
      emoji: "⚡",
      rolePreference: ["职场打工人"],
    },
    {
      title: "优化内容创作流程",
      description: "流程优化，产出更多。",
      emoji: "🔧",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "优化投资组合配置",
      description: "定期优化，提升收益。",
      emoji: "📊",
      rolePreference: ["投资理财者"],
    },
    {
      title: "优化学习方法策略",
      description: "方法对了，事半功倍。",
      emoji: "📚",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "优化客户服务流程",
      description: "服务好，口碑自然好。",
      emoji: "🎯",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "优化个人时间分配",
      description: "时间分配决定人生方向。",
      emoji: "⏱️",
      mbtiPreference: ["J"],
    },
    {
      title: "优化内容分发渠道",
      description: "多渠道分发，扩大影响力。",
      emoji: "📡",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "优化职业发展路径",
      description: "规划清晰，目标明确。",
      emoji: "🗺️",
      rolePreference: ["职场打工人", "学习者/转型者"],
    },
    {
      title: "优化商业运营模式",
      description: "模式优化，效益倍增。",
      emoji: "🚀",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "优化资金使用效率",
      description: "资金效率决定投资回报。",
      emoji: "💵",
      rolePreference: ["投资理财者"],
    },
    {
      title: "优化技能学习路径",
      description: "路径清晰，学习高效。",
      emoji: "🎯",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "优化工作生活平衡",
      description: "平衡才能走得更远。",
      emoji: "⚖️",
      rolePreference: ["职场打工人"],
    },
  ],

  sales: [
    {
      title: "完成一次销售转化",
      description: "行动才有结果。",
      emoji: "💸",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "设计一个促销活动",
      description: "好活动能带来爆发式增长。",
      emoji: "🎉",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "优化销售话术",
      description: "话术对了，成交率翻倍。",
      emoji: "💬",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "跟进潜在客户",
      description: "持续跟进才能成交。",
      emoji: "📲",
      rolePreference: ["创业者/自雇者"],
    },
    { title: "分析客户需求", description: "了解需求才能精准营销。", emoji: "🎯", mbtiPreference: ["N", "T"] },
    { title: "创建销售漏斗", description: "系统化销售更高效。", emoji: "🔻", mbtiPreference: ["T", "J"] },
    {
      title: "提升客单价",
      description: "同样的客户，更高的收入。",
      emoji: "📈",
      rolePreference: ["创业者/自雇者"],
    },
    { title: "开发新客户渠道", description: "多渠道获客更稳定。", emoji: "🌊", mbtiPreference: ["N", "E"] },
    {
      title: "推广个人服务产品",
      description: "好产品需要好推广。",
      emoji: "📢",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "争取职场加薪机会",
      description: "主动争取，才有可能。",
      emoji: "💰",
      rolePreference: ["职场打工人"],
    },
    {
      title: "寻找投资变现机会",
      description: "把握时机，及时变现。",
      emoji: "💵",
      rolePreference: ["投资理财者"],
    },
    {
      title: "尝试技能变现方式",
      description: "技能变现，增加收入。",
      emoji: "💼",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "优化产品定价策略",
      description: "定价是门艺术。",
      emoji: "🏷️",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "开发新的收入来源",
      description: "多元化收入更安全。",
      emoji: "🌟",
      mbtiPreference: ["N"],
    },
    {
      title: "提升内容变现能力",
      description: "内容变现是长期价值。",
      emoji: "💎",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "争取职场晋升机会",
      description: "晋升意味着更高收入。",
      emoji: "📈",
      rolePreference: ["职场打工人"],
    },
    {
      title: "寻找合作变现机会",
      description: "合作能创造更大价值。",
      emoji: "🤝",
      rolePreference: ["创业者/自雇者", "创作者/内容从业者"],
    },
    {
      title: "优化投资收益策略",
      description: "策略优化，收益提升。",
      emoji: "📊",
      rolePreference: ["投资理财者"],
    },
    {
      title: "探索副业赚钱机会",
      description: "副业是额外收入来源。",
      emoji: "💡",
      rolePreference: ["职场打工人", "学习者/转型者"],
    },
    {
      title: "建立被动收入系统",
      description: "被动收入是财务自由的关键。",
      emoji: "🏖️",
      mbtiPreference: ["N", "J"],
    },
  ],

  investment: [
    {
      title: "研究一个投资机会",
      description: "机会总是留给有准备的人。",
      emoji: "💎",
      rolePreference: ["投资理财者"],
    },
    {
      title: "优化资产配置",
      description: "分散投资，降低风险。",
      emoji: "📊",
      rolePreference: ["投资理财者"],
    },
    { title: "学习理财知识", description: "会赚钱更要会理财。", emoji: "💰" },
    { title: "复盘投资决策", description: "总结经验，避免重复犯错。", emoji: "📝", mbtiPreference: ["T", "J"] },
    {
      title: "研究市场趋势",
      description: "顺势而为，事半功倍。",
      emoji: "📈",
      rolePreference: ["投资理财者"],
    },
    { title: "建立投资组合", description: "系统化投资更稳健。", emoji: "🎯", mbtiPreference: ["T", "J"] },
    { title: "评估风险收益", description: "理性决策，控制风险。", emoji: "⚖️", mbtiPreference: ["T"] },
    { title: "学习价值投资", description: "长期主义才能获得复利。", emoji: "🌱", mbtiPreference: ["N", "J"] },
    {
      title: "投资个人成长",
      description: "投资自己是最好的投资。",
      emoji: "🎓",
      rolePreference: ["学习者/转型者", "职场打工人"],
    },
    {
      title: "投资技能提升",
      description: "技能是最好的资产。",
      emoji: "💪",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "投资人脉关系",
      description: "人脉是无形资产。",
      emoji: "🤝",
      mbtiPreference: ["E"],
    },
    {
      title: "投资内容创作",
      description: "内容是长期资产。",
      emoji: "✍️",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "投资商业项目",
      description: "好项目带来好回报。",
      emoji: "🚀",
      rolePreference: ["创业者/自雇者", "投资理财者"],
    },
    {
      title: "投资健康管理",
      description: "健康是一切的基础。",
      emoji: "🏃",
      mbtiPreference: ["S"],
    },
    {
      title: "投资品牌建设",
      description: "品牌是长期价值。",
      emoji: "⭐",
      rolePreference: ["创作者/内容从业者", "创业者/自雇者"],
    },
    {
      title: "投资工具设备",
      description: "好工具提升效率。",
      emoji: "🛠️",
      rolePreference: ["创作者/内容从业者", "创业者/自雇者"],
    },
    {
      title: "投资知识产权",
      description: "知识产权是核心资产。",
      emoji: "📚",
      mbtiPreference: ["N"],
    },
    {
      title: "投资时间管理",
      description: "时间是最宝贵的资源。",
      emoji: "⏰",
      mbtiPreference: ["J"],
    },
    {
      title: "投资职业发展",
      description: "职业发展决定收入上限。",
      emoji: "📈",
      rolePreference: ["职场打工人"],
    },
    {
      title: "投资学习成长",
      description: "持续学习，持续成长。",
      emoji: "🌱",
      rolePreference: ["学习者/转型者"],
    },
  ],

  branding: [
    {
      title: "打造个人品牌",
      description: "品牌是最好的护城河。",
      emoji: "✨",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "设计品牌视觉",
      description: "视觉统一提升专业度。",
      emoji: "🎨",
      rolePreference: ["创作者/内容从业者"],
    },
    { title: "明确品牌定位", description: "定位清晰才能吸引精准用户。", emoji: "🎯", mbtiPreference: ["N", "T"] },
    { title: "讲述品牌故事", description: "故事让品牌更有温度。", emoji: "📖", mbtiPreference: ["N", "F"] },
    {
      title: "提升品牌影响力",
      description: "影响力就是变现能力。",
      emoji: "🌟",
      rolePreference: ["创作者/内容从业者"],
    },
    { title: "建立品牌信任", description: "信任是成交的基础。", emoji: "🤝", mbtiPreference: ["F"] },
    { title: "扩大品牌曝光", description: "曝光越多，机会越多。", emoji: "📢", mbtiPreference: ["E"] },
    { title: "打造差异化优势", description: "与众不同才能脱颖而出。", emoji: "💫", mbtiPreference: ["N"] },
    {
      title: "建立职场个人品牌",
      description: "职场品牌决定职业高度。",
      emoji: "👔",
      rolePreference: ["职场打工人"],
    },
    {
      title: "打造创业品牌形象",
      description: "品牌形象影响客户信任。",
      emoji: "🏢",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "建立专业投资形象",
      description: "专业形象吸引合作机会。",
      emoji: "💼",
      rolePreference: ["投资理财者"],
    },
    {
      title: "塑造学习者形象",
      description: "学习形象吸引导师关注。",
      emoji: "📚",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "优化社交媒体形象",
      description: "社交形象是第一印象。",
      emoji: "📱",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "建立行业专家形象",
      description: "专家形象带来溢价能力。",
      emoji: "🎓",
      mbtiPreference: ["N", "T"],
    },
    {
      title: "打造可信赖形象",
      description: "可信赖是长期合作的基础。",
      emoji: "🛡️",
      mbtiPreference: ["S", "J"],
    },
    {
      title: "建立创新者形象",
      description: "创新形象吸引机会。",
      emoji: "💡",
      mbtiPreference: ["N", "P"],
    },
    {
      title: "塑造领导者形象",
      description: "领导力提升影响力。",
      emoji: "👑",
      mbtiPreference: ["E", "J"],
    },
    {
      title: "建立专业服务形象",
      description: "专业服务赢得客户。",
      emoji: "⭐",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "打造高效执行形象",
      description: "执行力是核心竞争力。",
      emoji: "⚡",
      mbtiPreference: ["S", "J"],
    },
    {
      title: "建立持续成长形象",
      description: "成长形象激励自己和他人。",
      emoji: "🌱",
      rolePreference: ["学习者/转型者"],
    },
  ],

  skill: [
    { title: "提升专业技能", description: "技能是最好的投资。", emoji: "🎓" },
    {
      title: "学习新技术",
      description: "技术迭代快，要持续学习。",
      emoji: "💻",
      rolePreference: ["创业者/自雇者", "学习者/转型者"],
    },
    { title: "练习演讲能力", description: "会表达才能影响更多人。", emoji: "🎤", mbtiPreference: ["E"] },
    { title: "提升写作能力", description: "写作是最好的思考方式。", emoji: "✍️", mbtiPreference: ["I", "N"] },
    {
      title: "学习设计思维",
      description: "设计思维帮你解决问题。",
      emoji: "🎨",
      rolePreference: ["创作者/内容从业者"],
    },
    { title: "提升沟通能力", description: "沟通顺畅，合作才能愉快。", emoji: "💬", mbtiPreference: ["E", "F"] },
    { title: "学习项目管理", description: "管理好项目才能按时交付。", emoji: "📋", mbtiPreference: ["J"] },
    { title: "提升数据思维", description: "用数据说话更有说服力。", emoji: "📊", mbtiPreference: ["T"] },
    {
      title: "学习职场技能",
      description: "职场技能决定职业发展。",
      emoji: "💼",
      rolePreference: ["职场打工人"],
    },
    {
      title: "提升创作技能",
      description: "创作技能是核心竞争力。",
      emoji: "🎬",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "学习投资分析",
      description: "分析能力决定投资回报。",
      emoji: "📈",
      rolePreference: ["投资理财者"],
    },
    {
      title: "提升学习能力",
      description: "学习能力是元能力。",
      emoji: "🧠",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "学习商业谈判",
      description: "谈判能力影响商业结果。",
      emoji: "🤝",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "提升领导能力",
      description: "领导力带来更多机会。",
      emoji: "👑",
      mbtiPreference: ["E", "J"],
    },
    {
      title: "学习营销技能",
      description: "营销是商业的核心。",
      emoji: "📢",
      rolePreference: ["创业者/自雇者", "创作者/内容从业者"],
    },
    {
      title: "提升财务管理",
      description: "财务管理是基本功。",
      emoji: "💰",
      rolePreference: ["投资理财者", "创业者/自雇者"],
    },
    {
      title: "学习时间管理",
      description: "时间管理提升效率。",
      emoji: "⏰",
      mbtiPreference: ["J"],
    },
    {
      title: "提升问题解决能力",
      description: "解决问题创造价值。",
      emoji: "🧩",
      mbtiPreference: ["T"],
    },
    {
      title: "学习创新思维",
      description: "创新思维带来突破。",
      emoji: "💡",
      mbtiPreference: ["N"],
    },
    {
      title: "提升执行能力",
      description: "执行力决定成败。",
      emoji: "⚡",
      mbtiPreference: ["S", "J"],
    },
  ],

  mindset: [
    { title: "写下今天的财富目标", description: "明确的目标是行动的起点。", emoji: "🎯", mbtiPreference: ["J"] },
    { title: "培养富人思维", description: "思维决定财富上限。", emoji: "🧠" },
    { title: "克服拖延症", description: "行动才有结果。", emoji: "⚡", mbtiPreference: ["P"] },
    { title: "建立成长型思维", description: "相信自己可以不断进步。", emoji: "🌱", mbtiPreference: ["N"] },
    { title: "保持积极心态", description: "心态好，运气才会好。", emoji: "😊", mbtiPreference: ["F"] },
    { title: "设定长期目标", description: "长期主义才能走得更远。", emoji: "🗺️", mbtiPreference: ["N", "J"] },
    { title: "培养自律习惯", description: "自律是成功的基础。", emoji: "💪", mbtiPreference: ["J"] },
    { title: "突破舒适区", description: "成长总是发生在舒适区之外。", emoji: "🚀", mbtiPreference: ["N", "P"] },
    {
      title: "培养创业者思维",
      description: "创业思维看到机会。",
      emoji: "💡",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "建立职场成长思维",
      description: "成长思维带来晋升。",
      emoji: "📈",
      rolePreference: ["职场打工人"],
    },
    {
      title: "培养创作者心态",
      description: "创作心态激发灵感。",
      emoji: "🎨",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "建立投资者思维",
      description: "投资思维看长期价值。",
      emoji: "💰",
      rolePreference: ["投资理财者"],
    },
    {
      title: "培养学习者心态",
      description: "学习心态保持谦逊。",
      emoji: "📚",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "建立长期主义思维",
      description: "长期主义获得复利。",
      emoji: "🌳",
      mbtiPreference: ["N", "J"],
    },
    {
      title: "培养结果导向思维",
      description: "结果导向提升效率。",
      emoji: "🎯",
      mbtiPreference: ["T", "J"],
    },
    {
      title: "建立用户思维",
      description: "用户思维创造价值。",
      emoji: "👥",
      mbtiPreference: ["F"],
    },
    {
      title: "培养商业思维",
      description: "商业思维发现机会。",
      emoji: "💼",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "建立系统思维",
      description: "系统思维解决根本问题。",
      emoji: "🔄",
      mbtiPreference: ["N", "T"],
    },
    {
      title: "培养行动思维",
      description: "行动思维快速验证。",
      emoji: "⚡",
      mbtiPreference: ["S", "P"],
    },
    {
      title: "建立价值思维",
      description: "价值思维创造财富。",
      emoji: "💎",
      mbtiPreference: ["N"],
    },
  ],

  execution: [
    { title: "完成一个小目标", description: "小目标积累成大成就。", emoji: "✅" },
    { title: "测试一个新想法", description: "快速验证，快速迭代。", emoji: "🧪", mbtiPreference: ["N", "P"] },
    {
      title: "启动一个副业项目",
      description: "多一份收入，多一份保障。",
      emoji: "🚀",
      rolePreference: ["职场打工人"],
    },
    { title: "复盘本周进展", description: "定期复盘，持续优化。", emoji: "📊", mbtiPreference: ["J"] },
    { title: "制定行动计划", description: "计划清晰，执行才有力。", emoji: "📝", mbtiPreference: ["J"] },
    { title: "快速试错迭代", description: "失败是成功之母。", emoji: "🔄", mbtiPreference: ["P"] },
    { title: "专注核心任务", description: "聚焦才能产生突破。", emoji: "🎯", mbtiPreference: ["J"] },
    { title: "突破一个难题", description: "解决难题就是成长。", emoji: "🧩", mbtiPreference: ["T"] },
    {
      title: "推进创业项目进度",
      description: "持续推进，才能成功。",
      emoji: "🚀",
      rolePreference: ["创业者/自雇者"],
    },
    {
      title: "完成职场重要任务",
      description: "完成任务，展现价值。",
      emoji: "✅",
      rolePreference: ["职场打工人"],
    },
    {
      title: "发布创作作品",
      description: "作品发布，才有价值。",
      emoji: "🎬",
      rolePreference: ["创作者/内容从业者"],
    },
    {
      title: "执行投资决策",
      description: "决策后要果断执行。",
      emoji: "💰",
      rolePreference: ["投资理财者"],
    },
    {
      title: "完成学习计划",
      description: "完成计划，积累成长。",
      emoji: "📚",
      rolePreference: ["学习者/转型者"],
    },
    {
      title: "推进重要项目",
      description: "重要项目优先执行。",
      emoji: "🎯",
      mbtiPreference: ["J"],
    },
    {
      title: "完成每日行动清单",
      description: "清单完成，成就感满满。",
      emoji: "✅",
      mbtiPreference: ["J"],
    },
    {
      title: "快速响应市场变化",
      description: "快速响应，抓住机会。",
      emoji: "⚡",
      mbtiPreference: ["S", "P"],
    },
    {
      title: "执行优化改进方案",
      description: "方案执行，才能见效。",
      emoji: "🔧",
      mbtiPreference: ["T", "J"],
    },
    {
      title: "完成阶段性目标",
      description: "阶段目标，里程碑。",
      emoji: "🏆",
      mbtiPreference: ["J"],
    },
    {
      title: "推进合作项目",
      description: "合作项目，共同推进。",
      emoji: "🤝",
      mbtiPreference: ["E"],
    },
    {
      title: "完成挑战任务",
      description: "挑战完成，能力提升。",
      emoji: "💪",
      mbtiPreference: ["S", "P"],
    },
  ],
}

// Get MBTI traits from type
function getMBTITraits(mbti: MBTIType): string[] {
  return [
    mbti[0], // E or I
    mbti[1], // S or N
    mbti[2], // T or F
    mbti[3], // J or P
  ]
}

// Calculate action relevance score
function calculateActionRelevance(
  action: (typeof actionTemplatesByCategory)[ActionCategory][0],
  profile: UserProfile,
  traits: string[],
): number {
  let score = 1

  // MBTI preference match
  if (action.mbtiPreference) {
    const matchCount = action.mbtiPreference.filter((pref) => traits.includes(pref)).length
    score += matchCount * 2
  }

  // Role preference match
  if (action.rolePreference && action.rolePreference.includes(profile.role)) {
    score += 5
  }

  return score
}

// Generate unique seed for consistent randomization
function generateSeed(profile: UserProfile, day: number): number {
  const mbtiValue = profile.mbti.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const roleValue = profile.role.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return mbtiValue * 1000 + roleValue * 100 + day
}

// Seeded random number generator
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Global action tracking for deduplication across the entire year
const YEAR_ACTION_STORAGE_KEY = "action-to-richness-year-actions"

// Get all used action titles for the year
function getUsedActionsForYear(year: number, profile: UserProfile): Set<string> {
  if (typeof window === "undefined") return new Set()

  const storageKey = `${YEAR_ACTION_STORAGE_KEY}-${year}-${profile.mbti}-${profile.role}`
  const stored = localStorage.getItem(storageKey)
  return stored ? new Set(JSON.parse(stored)) : new Set()
}

// Save used action titles for the year
function saveUsedActionsForYear(year: number, profile: UserProfile, usedActions: Set<string>): void {
  if (typeof window === "undefined") return

  const storageKey = `${YEAR_ACTION_STORAGE_KEY}-${year}-${profile.mbti}-${profile.role}`
  localStorage.setItem(storageKey, JSON.stringify(Array.from(usedActions)))
}

export function getPersonalizedDailyActions(year: number, month: number, profile: UserProfile): DailyAction[] {
  const actions: DailyAction[] = []
  const daysInMonth = new Date(year, month, 0).getDate()
  const traits = getMBTITraits(profile.mbti)

  // Flatten all action templates
  const allActions = Object.entries(actionTemplatesByCategory).flatMap(([category, templates]) =>
    templates.map((template) => ({ ...template, category: category as ActionCategory })),
  )

  // Get already used actions for this year
  const usedActionsThisYear = getUsedActionsForYear(year, profile)

  // Score all actions for this profile
  const scoredActions = allActions.map((action, index) => ({
    ...action,
    score: calculateActionRelevance(action, profile, traits),
    originalIndex: index,
  }))

  // Sort by score (highest first)
  scoredActions.sort((a, b) => b.score - a.score)

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
    const seed = generateSeed(profile, month * 100 + day)

    // Find an unused action
    let selectedAction = null
    let actionIndex = 0

    // Try to find an unused action from the scored list
    while (actionIndex < scoredActions.length && !selectedAction) {
      const candidate = scoredActions[actionIndex]

      // Check if this action has been used this year
      if (!usedActionsThisYear.has(candidate.title)) {
        selectedAction = candidate
        usedActionsThisYear.add(candidate.title)
      }

      actionIndex++
    }

    if (!selectedAction) {
      // Use seeded random to pick an action and create a variation
      const randomIndex = Math.floor(seededRandom(seed) * scoredActions.length)
      const baseAction = scoredActions[randomIndex]

      selectedAction = {
        ...baseAction,
        title: baseAction.title, // Keep title clean without day number
      }
    }

    // Personalize description based on role
    let personalizedDescription = selectedAction.description
    if (profile.role === "创业者/自雇者") {
      personalizedDescription = personalizedDescription.replace("你的", "你的创业")
    } else if (profile.role === "职场打工人") {
      personalizedDescription = personalizedDescription.replace("收入", "职业收入")
    }

    actions.push({
      id: month * 100 + day,
      date: dateStr,
      title: selectedAction.title,
      description: personalizedDescription,
      emoji: selectedAction.emoji,
      theme: getPersonalizedMonthTheme(month, profile).theme,
    })
  }

  // Save the updated used actions list
  saveUsedActionsForYear(year, profile, usedActionsThisYear)

  console.log(
    `[v0] Generated ${actions.length} actions for ${year}-${month}, total used this year: ${usedActionsThisYear.size}`,
  )

  return actions
}

export function getDailyAction(date: string, profile: UserProfile): DailyAction | undefined {
  const [year, month] = date.split("-").map(Number)
  const actions = getPersonalizedDailyActions(year, month, profile)
  return actions.find((action) => action.date === date)
}

// Generate personalized month theme based on MBTI and role
export function getPersonalizedMonthTheme(month: number, profile: UserProfile): MonthTheme {
  const baseThemes: Record<number, MonthTheme> = {
    1: {
      month: 1,
      name: "一月",
      theme: "搞钱觉醒月",
      description: "唤醒财富意识，开启行动之旅",
      emoji: "🌅",
    },
    2: {
      month: 2,
      name: "二月",
      theme: "投资学习月",
      description: "学习投资知识，提升财商思维",
      emoji: "📚",
    },
    3: {
      month: 3,
      name: "三月",
      theme: "行动复利月",
      description: "每日小行动，积累大财富",
      emoji: "🚀",
    },
    4: {
      month: 4,
      name: "四月",
      theme: "品牌经营月",
      description: "打造个人品牌，扩大影响力",
      emoji: "✨",
    },
    5: {
      month: 5,
      name: "五月",
      theme: "副业探索月",
      description: "开拓收入渠道，创造被动收入",
      emoji: "💡",
    },
    6: {
      month: 6,
      name: "六月",
      theme: "人脉拓展月",
      description: "建立优质人脉，创造合作机会",
      emoji: "🤝",
    },
    7: {
      month: 7,
      name: "七月",
      theme: "技能变现月",
      description: "将技能转化为收入来源",
      emoji: "💰",
    },
    8: {
      month: 8,
      name: "八月",
      theme: "内容创作月",
      description: "持续输出内容，建立影响力",
      emoji: "✍️",
    },
    9: {
      month: 9,
      name: "九月",
      theme: "商业思维月",
      description: "培养商业嗅觉，发现赚钱机会",
      emoji: "🎯",
    },
    10: {
      month: 10,
      name: "十月",
      theme: "效率提升月",
      description: "优化工作流程，提高产出效率",
      emoji: "⚡",
    },
    11: {
      month: 11,
      name: "十一月",
      theme: "财富复盘月",
      description: "总结经验教训，优化赚钱策略",
      emoji: "📊",
    },
    12: {
      month: 12,
      name: "十二月",
      theme: "目标规划月",
      description: "制定新年计划，设定财富目标",
      emoji: "🎁",
    },
  }

  const theme = baseThemes[month]

  // Personalize based on MBTI
  if (["INTJ", "INTP", "ENTJ", "ENTP"].includes(profile.mbti)) {
    // NT types: Strategic thinkers
    if (month === 3) theme.theme = "策略与复利月"
    if (month === 9) theme.theme = "商业创新月"
  } else if (["INFJ", "INFP", "ENFJ", "ENFP"].includes(profile.mbti)) {
    // NF types: Creative and people-oriented
    if (month === 4) theme.theme = "创意爆发月"
    if (month === 8) theme.theme = "影响力建设月"
  } else if (["ISTJ", "ISFJ", "ESTJ", "ESFJ"].includes(profile.mbti)) {
    // SJ types: Organized and practical
    if (month === 3) theme.theme = "稳健执行月"
    if (month === 5) theme.theme = "稳健副业月"
  } else if (["ISTP", "ISFP", "ESTP", "ESFP"].includes(profile.mbti)) {
    // SP types: Action-oriented and flexible
    if (month === 3) theme.theme = "快速行动月"
    if (month === 7) theme.theme = "技能爆发月"
  }

  // Personalize based on role (5 career types)
  if (profile.role === "投资理财者") {
    if (month === 2) theme.theme = "资产配置月"
    if (month === 11) theme.theme = "投资复盘月"
  } else if (profile.role === "创作者/内容从业者") {
    if (month === 8) theme.theme = "内容爆款月"
    if (month === 4) theme.theme = "IP打造月"
  } else if (profile.role === "职场打工人") {
    if (month === 5) theme.theme = "副业启动月"
    if (month === 10) theme.theme = "职场效能月"
  } else if (profile.role === "创业者/自雇者") {
    if (month === 9) theme.theme = "商业模式月"
    if (month === 6) theme.theme = "资源整合月"
  } else if (profile.role === "学习者/转型者") {
    if (month === 1) theme.theme = "探索觉醒月"
    if (month === 7) theme.theme = "技能突破月"
  }

  return theme
}
