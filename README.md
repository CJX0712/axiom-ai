# ✦ AXIOM · 自验证 AI 微指令操作系统

<div align="center">

[![License](https://img.shields.io/badge/License-MIT-green)](https://github.com/CJX0712/axiom-ai/blob/main/LICENSE) [![Language](https://img.shields.io/badge/HTML-E34F26?logo=html)](https://github.com/CJX0712/axiom-ai) [![Deps](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/CJX0712) [![Verified](https://img.shields.io/badge/invariants-verified-brightgreen)](https://github.com/CJX0712) [![Reproducible](https://img.shields.io/badge/reproducible-bit--identical-blue)](https://github.com/CJX0712) [![Author](https://img.shields.io/badge/author-晨星-blueviolet)](https://github.com/CJX0712)

</div>


> **十层架构 × 1024 微指令 × 64 项数学不变量 · 零依赖单文件 · 浏览器/Node 双端同源 · 可运行 / 可复现 / 可验证**
>
> 作者：**晨星** · License: MIT · [github.com/CJX0712/axiom-ai](https://github.com/CJX0712/axiom-ai)

---

## 1. 这是什么

AXIOM 是一套**指令集架构（ISA）级别的 AI 系统**：把"世界顶级 AI"分解为 **10 个系统层**，最底层落为 **1024 条微指令**（16 指令族 × 16 基础算子 × 4 执行变体）。每条微指令都携带：

- **语义契约**（输入/输出/执行语义）
- **数学不变量**（如 `(AB)ᵀ = BᵀAᵀ` 逐位一致、`‖Sv−λv‖ ≤ 1e-12`、EM 对数似然单调不减）
- **实现状态**（✅ 参考实现已验证 / 🟡 规格已定义）

**核心主张：AI 的每一层都必须可被独立复算验证。** 不是"训练出来了就看效果"，而是每个算法携带一条可被第三方用完全不同的方法（解析解、暴力枚举、参照实现）交叉验证的硬不变量。

```
npm test          # → 74/74 核心不变量+注册表完整性 + 21/21 UI 冒烟，全绿
open axiom.html   # → 单文件仪表盘：架构图 / 指令浏览器 / 实时自检 / 三个训练演示
```

## 2. 零重写 · 集大成

不重复造轮子——直接站在世界顶级成果之上，用它们的**同源算法**以零依赖单文件实现，并用**同样的不变量**自证一致：

| 领域 | 世界顶级来源 | AXIOM 采用 | 验证基准 |
|---|---|---|---|
| QR 分解 | Householder (1958)；scipy.linalg / @tangent.to/lina | Householder 反射 | QᵀQ=I、‖QR−A‖≤1e-10 |
| 对称特征分解 | Jacobi (1846)；lina 的 cyclic Jacobi | 循环 Jacobi 旋转 | ‖Sv−λv‖≤1e-12、V 正交归一 |
| 概率图推断 | Rabiner (1989) 前向-后向/Viterbi | 精确 HMM 推断 | P(O) 与 2⁸ 路径全枚举一致 |
| EM / GMM | Dempster–Laird–Rubin (1977) | 全协方差 EM + logsumexp | 对数似然单调不减 |
| 优化 | Cauchy (1847)、Hestenes–Stiefel (1952)、Kingma–Ba (2015) | GD / CG / Adam | 收敛至解析最优 |
| K-Means | Lloyd (1982) + Arthur–Vassilvitskii (2007) K-Means++ | Lloyd + D² 初始化 | SSE 逐轮单调不增 |
| 反向传播 | Rumelhart–Hinton–Williams (1986) | MLP 解析梯度 | 中心差分梯度检验 ≤1e-6 |
| 决策树 | Breiman (1984) CART | Gini 预剪枝 | 训练准确率 100% |
| 强化学习 | Bellman (1957)、Watkins–Dayan (1992) | 值迭代 / TD(0) / Q-Learning | Bellman 残差、解析解、贪心成功率 |
| 数值稳定 | Kahan (1965)、Box–Muller (1958)、A&S 7.1.26 | Kahan/TwoSum、logsumexp | 病态求和精确、±1e300 不溢出 |

对标 `scipy.linalg`、`ml.js`、`@tangent.to/lina`（其测试同样对标 numpy/scipy，机器精度一致）。

## 3. 十层架构

| 层 | 名称 | 指令数 | 指令族 |
|---|---|---|---|
| L1 | 数学基础 | 320 | TENSOR · LINALG · NUMER · PROB · INFO |
| L2 | 监督学习 | 64 | OPTIM |
| L3 | 表示学习 | 192 | FWD · BWD · NORM |
| L4 | 序列与生成 | 128 | ATTEN · SAMPLE |
| L5 | 概率图模型 | 64 | GRAPH |
| L6 | 强化学习 | 64 | RL |
| L7 | 评估与数据 | 128 | METRIC · DATA |
| L8 | 系统运行时 | 64 | SYS |
| L9 | 组合应用层 | — | 由 L1–L8 微指令组合而成的推理/训练编排层 |
| L10 | **微指令层** | **1024** | 全部 16 族（本指令集主体） |

每条指令的 4 个执行变体：`base`（标量语义）· `batched`（批处理，逐位一致）· `fused`（融合，消除中间物化）· `inplace`（原地执行）。

## 4. 仓库结构

```
axiom-ai/
├── axiom.html            # ★ 单文件应用（构建产物，零依赖，双击即用）
├── src/
│   ├── core.js           # 数学与算法核心（UMD，浏览器/Node 双端同源）
│   ├── registry.js       # 1024 微指令注册表（自动生成，勿手改）
│   └── ui.js             # 仪表盘 UI
├── test/
│   ├── run.js           # 无头自检：64 不变量 + 10 注册表完整性
│   └── ui-smoke.js      # UI 冒烟测试（Node DOM 垫片执行全部渲染路径）
├── tools/
│   ├── gen-registry.js   # 从分类学生成 1024 指令（含完整性断言）
│   └── build.js          # 打包单文件 HTML（构建期语法预检）
├── docs/
│   ├── ARCHITECTURE.md   # 十层架构 + 指令集规范
│   └── VERIFICATION.md   # 64 项不变量残差全表
├── package.json          # test / build / gen:registry 脚本
├── LICENSE               # MIT
└── README.md
```

**单一事实来源**：`axiom.html` 内联的正是 Node 测试运行的同一份 `core.js`——浏览器里点"运行全量自检"与命令行 `npm test` 跑的是同一批检查。

## 5. 快速开始

```bash
# 无头自检（Node ≥ 14，零依赖）
node test/run.js        # 74 项：64 不变量 + 10 注册表完整性
node test/ui-smoke.js   # 21 项：UI 渲染/交互/演示计算路径
# 或 npm test（两者串联）

# 重新生成指令注册表（1024 条，带完整性断言）
node tools/gen-registry.js

# 构建单文件 HTML
node tools/build.js
```

浏览器用法：直接打开 `axiom.html`（或访问部署链接），五个视图——**架构总览 / 指令集（1024，可搜索过滤）/ 实时自检 / 演示实验室 / 导出**。

作为库使用（Node 或浏览器 `<script>`）：

```js
const AXIOM = require('./src/core.js');   // 浏览器：window.AXIOM
const { jacobiEigen, gmmEM, valueIteration } = AXIOM;
const eig = jacobiEigen([[4, 1], [1, 3]]);   // { values, vectors }
AXIOM.runChecks();                            // { total, passed, results }
```

## 6. 验证哲学

每个算法至少一条**可独立复算的不变量**：

- **解析 vs 数值**：GD/Adam/CG 收敛到二次函数解析最优；TD(0) α=1 一步扫描 = γ^d 解析解
- **暴力枚举 vs 优化算法**：Viterbi 路径 = 2⁸ 全枚举最优；P(O) 前向 = 256 路径求和
- **参照实现 vs 主实现**：幂迭代 vs Jacobi 主特征值；Kahan vs TwoSum 精确和
- **算法定理**：EM 似然单调不减（Dempster 1977）；K-Means SSE 单调不增；值迭代 Bellman 残差→0
- **恒等式**：(AB)ᵀ=BᵀAᵀ 逐位一致；KL≥0 且 p=q 取等；I(X;Y)=I(Y;X)

全部 64 项残差实测值见 [docs/VERIFICATION.md](docs/VERIFICATION.md)——最差残差 2.33e-3（蒙特卡洛统计类），矩阵分解类全部 ≤ 1e-14。UI 层另有 21 项冒烟测试（Node DOM 垫片执行全部渲染路径，含分页/自检/三个演示计算）；单文件 HTML 已在真实浏览器中端到端验证（自检 64/64 + 7/7 全绿）。

## 7. 设计决策

- **为什么纯 JS 数组不用 Float64Array/BLAS**：单文件零依赖 + 行列主序简单数组作为 API 边界（与 @tangent.to/lina 同思路），规模定位在 n≤数百的教学/验证负载；算法选型偏向无条件稳定（Jacobi/Householder）而非速度。
- **为什么确定性随机（mulberry32）**：一切蒙特卡洛类验证必须可复现——同种子同序列是检查项之一。
- **为什么 1024 = 16×16×4**：指令集需要完备且可枚举；4 变体覆盖执行语义的三个正交维度（批/融合/原地），全部携带"与 base 逐位一致"的降级契约。
- **为什么 verified 只有 93 条**：诚实优先——只标记真有参考实现且通过不变量自检的指令；其余 931 条规格已定义（语义+不变量），作为路线图。

## 8. 路线图

- [ ] L2 监督学习：SVM 对偶/KKT、朴素贝叶斯、集成方法
- [ ] L4：完整 MHA（多头/交叉/RoPE）、top-p 采样
- [ ] L5：变量消去 vs 暴力枚举、联合树校准
- [ ] L9：由微指令组合的推理/训练编排示例
- [ ] WASM 内核加速（保持 JS 回退，API 不变）

## 9. 致谢

站在巨人肩上：Householder · Jacobi · Cholesky · Dempster · Rabiner · Bellman · Kahan · Box–Muller · Lloyd · Breiman · Rumelhart · Hestenes–Stiefel · Watkins–Dayan · Kingma–Ba，以及 scipy / ml.js / @tangent.to/lina 开源生态。

---

**作者：晨星** ✦ 天亮前最后还亮着的那颗。
