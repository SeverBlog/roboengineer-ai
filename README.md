# RoboEngineer AI V1.2

面向机械臂开发者的一人公司 MVP：从参数输入、力矩计算、电机选型到基础 BOM，在浏览器内完成完整闭环。

## Windows 一键启动

双击 start-roboengineer.bat。首次运行会自动安装依赖，以后不会重复安装。

启动成功后打开 http://localhost:3000。

## 命令行启动

需要 Node.js 22.13 或更高版本：

    npm install
    npm run dev

以后只需运行 npm run dev。

## 已完成功能

- J2 肩关节、J3 肘关节静态力矩计算
- N·m 与 kg·cm 自动换算
- 任意数值输入，不再出现 291/301 步长问题
- 三种机械臂参数模板
- 基于额定力矩的电机候选筛选
- 电机选择与基础 BOM 联动
- BOM 成本估算、CSV 导出和打印
- 项目案例复用
- 方案保存到浏览器本机
- 完整方案 JSON 导出
- 本地匿名行为计数占位
- 第一次使用的新手流程引导
- Free、Pro、Team 三档付费意向验证
- 下一功能路线图投票
- 用户问题与联系邮箱反馈收集
- 创始人运营看板与转化漏斗
- 运营数据、投票和反馈一键导出
- 手机、平板和桌面响应式布局
- Vercel Web Analytics 访问统计
- Supabase 集中收集反馈、路线图投票和 Pro/Team 付费意向
- Supabase 提交失败时保留浏览器本机数据

## Supabase 配置

复制 `.env.example` 为 `.env.local`，填写 Supabase 项目的公开连接信息：

    NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_你的密钥

Vercel 部署时，在项目的 Environment Variables 中配置同名变量。只使用 Publishable Key；不要在前端或 GitHub 中保存数据库密码、Secret Key 或 service_role。

网站只在用户主动提交时写入以下表：

- `feedback`
- `feature_votes`
- `pricing_interests`

工程参数、保存的方案和本地运营漏斗仍保存在当前浏览器。

## 计算假设

- 两段机械臂水平伸直，按静态最不利姿态估算。
- 臂杆质量均匀分布，重心位于每段中点。
- 肩关节包含上臂、前臂和末端负载。
- 肘关节包含前臂和末端负载。
- 结果乘以安全系数。
- 结果用于概念设计，不替代动力学仿真、结构强度校核或实际测试。

## 一人公司验证指标

点击导航栏“运营看板”，可以查看成功计算、进入选型、查看 BOM、导出方案、保存项目和付费意向等本地数据。Vercel Analytics 用于汇总访问量；Supabase 用于汇总用户主动提交的反馈、投票和付费意向。
