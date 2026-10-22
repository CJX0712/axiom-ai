# ✦ AXIOM · 自验证 AI 微指令操作系统

> **从零造 AI，并造尺子证明它没骗你** · 一套开源的"AI 验伪"方法与实物
> 舰队总览：[apex-flagship](https://github.com/CJX0712/apex-flagship) · 作者：晨星


<div align="center">

[![License](https://img.shields.io/badge/License-MIT-green)](https://github.com/CJX0712/axiom-ai/blob/main/LICENSE) [![Language](https://img.shields.io/badge/HTML-E34F26?logo=html)](https://github.com/CJX0712/axiom-ai) [![Deps](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/CJX0712) [![Verified](https://img.shields.io/badge/invariants-359%2F359-brightgreen)](https://github.com/CJX0712) [![ISA](https://img.shields.io/badge/ISA-1024%20micro--instructions-blue)](https://github.com/CJX0712/axiom-ai) [![Kernels](https://img.shields.io/badge/verified%20kernels-811%2F1024-blueviolet)](https://github.com/CJX0712/axiom-ai) [![Author](https://img.shields.io/badge/author-晨星-blueviolet)](https://github.com/CJX0712)

</div>

> **十层架构 × 1024 微指令 × 359 项数学不变量 · 零依赖单文件 · 浏览器/Node 双端同源 · 可运行 / 可复现 / 可验证**
>
> 作者：**晨星** · License: MIT · [github.com/CJX0712/axiom-ai](https://github.com/CJX0712/axiom-ai)

---

## 1. 这是什么

AXIOM 是一套**指令集架构（ISA）级别的 AI 系统**：把"世界顶级 AI"分解为 **10 个系统层**，最底层落为 **1024 条微指令**（16 指令族 × 16 基础算子 × 4 执行变体）。每条微指令都携带：

- **语义契约**（输入/输出/执行语义）
- **数学不变量**（如 `(AB)ᵀ = BᵀAᵀ` 逐位一致、`‖Sv−λv‖ ≤ 1e-12`、EM 对数似然单调不减、FlashAttention 分块 = 全量）
- **实现状态**（✅ 参考实现已验证 / 🟡 规格已定义）

**核心主张：AI 的每一层都必须可被独立复算验证。** 不是"训练出来了就看效果"，而是每个算法携带一条可被第三方用完全不同的方法（解析解、暴力枚举、参照实现）交叉验证的硬不变量。

```
npm test          # → 369/369：359 核心不变量 + 10 注册表完整性，UI 冒烟 32/32，全绿
open axiom.html   # → 单文件仪表盘：架构图 / 指令浏览器 / 实时自检 / 算法库（51 组，可运行演示）/ L9 管线编排 / 三个训练演示 / 导出
```

## 2. 零重写 · 集大成

不重复造轮子——直接站在世界顶级成果之上，用它们的**同源算法**以零依赖单文件实现，并用**同样的不变量**自证一致：

| 领域 | 世界顶级来源 | AXIOM 采用 | 验证基准 |
|---|---|---|---|
| QR 分解 | Householder (1958)；scipy.linalg | Householder 反射 | QᵀQ=I、‖QR−A‖≤1e-10 |
| 对称特征分解 | Jacobi (1846) | 循环 Jacobi 旋转 | ‖Sv−λv‖≤1e-12、V 正交归一 |
| 融合乘加 | Dekker (1971) / Knuth TwoSum | Dekker 分裂模拟 fma | 朴素双舍入失败案例精确复原 |
| 概率图推断 | Rabiner (1989)；Koller–Friedman (2009)；Metropolis (1953) | 前向-后向 / Viterbi / 变量消去 / 链式 BP / Gibbs / Metropolis | P(O) 与 2⁸ 路径全枚举一致、平稳分布 = 解析解 |
| D-分离 | Pearl (1988)；Lauritzen (1990) | 路径枚举 + 祖先道德图 | 与联合分布暴力条件独立检验一致 |
| EM / GMM | Dempster–Laird–Rubin (1977) | 全协方差 EM + logsumexp | 对数似然单调不减 |
| 优化 | Cauchy (1847) 至 Loshchilov–Hutter (2019)；Broyden–Fletcher–Goldfarb–Shanno (1970)；Liu–Nocedal (1989)；Nocedal–Wright (2006) 强 Wolfe | GD / 动量 / CG / Adam / RMSProp / AdaGrad / AdamW / BFGS / L-BFGS | 凸二次 ≤30 步收敛至解析最优、H ≈ A⁻¹ |
| 信道容量 | Arimoto–Blahut (1972) | AB 迭代 | BSC(0.1) 容量 = 1−H(ε) = 0.531 bits |
| 注意力 | Vaswani (2017)、Dao (2022)、Press (2021)、Su (2021)、Ainslie (2023) | SDPA / Flash 在线 softmax / ALiBi / RoPE / MQA-GQA | 分块=全量、RoPE 相对性、权重行和=1 |
| 策略优化 | Watkins–Dayan (1992)、Schulman (2016/2017) | VI / TD(0) / Q-Learning / SARSA / GAE / PPO | Bellman 残差、解析解、贪心成功率 |
| 反向传播 | Rumelhart–Hinton–Williams (1986)、Werbos (1990) | MLP 解析梯度 / BPTT / 层归一化梯度 | 中心差分梯度检验 ≤1e-6 |
| 数值稳定 | Kahan (1965)、Box–Muller (1958)、A&S 7.1.26 | Kahan/TwoSum、logsumexp | 病态求和精确、±1e300 不溢出 |
| K-Means | Lloyd (1982) + Arthur–Vassilvitskii (2007) | Lloyd + D² 初始化 | SSE 逐轮单调不增 |

对标 `scipy.linalg`、`ml.js`、`@tangent.to/lina`（其测试同样对标 numpy/scipy，机器精度一致）。

## 3. 十层架构

| 层 | 名称 | verified 数 | 指令族 |
|---|---|---|---|
| L1 | 数学基础 | 80/320 | TENSOR · LINALG · NUMER · PROB · INFO |
| L2 | 监督学习 | 16/64 | OPTIM |
| L3 | 表示学习 | 48/192 | FWD · BWD · NORM |
| L4 | 序列与生成 | 32/128 | ATTEN · SAMPLE |
| L5 | 概率图模型 | 16/64 | GRAPH |
| L6 | 强化学习 | 16/64 | RL |
| L7 | 评估与数据 | 32/128 | METRIC · DATA |
| L8 | 系统运行时 | 15/64 | SYS |
| L9 | 组合应用层 | — | 由 L1–L8 微指令组合而成的推理/训练编排层（管线编排视图） |
| L10 | **微指令层** | **811/1024** | 全部 16 族（本指令集主体） |

每条指令的 4 个执行变体：`base`（标量语义）· `batched`（批处理，逐位一致）· `fused`（融合，消除中间物化）· `inplace`（原地执行）。

## 4. 仓库结构

```
axiom-ai/
├── axiom.html              # ★ 单文件应用（构建产物，零依赖，双击即用）
├── src/
│   ├── core.js             # 数学与算法核心（UMD，浏览器/Node 双端同源，359 项不变量 + 集大成算法库 51 组）
│   ├── registry.js         # 1024 微指令注册表（自动生成，勿手改）
│   └── ui.js               # 仪表盘 UI（7 视图，含算法库与 L9 管线编排）
├── test/
│   ├── run.js              # 无头自检：359 不变量 + 10 注册表完整性
│   └── ui-smoke.js         # UI 冒烟测试（Node DOM 垫片执行全部渲染路径）
├── tools/
│   ├── gen-registry.js     # 从分类学生成 1024 指令（含完整性断言）
│   ├── gen-verification.js # 从真实运行结果生成验证报告
│   ├── gen-isa-doc.js      # 生成指令集全目录
│   └── build.js            # 打包单文件 HTML（构建期语法预检）
├── docs/
│   ├── ARCHITECTURE.md     # 十层架构 + 指令集规范
│   ├── VERIFICATION.md     # 359 项不变量残差全表（自动生成）
│   └── ISA-1024.md         # 1024 条微指令完整规格表（自动生成）
├── package.json            # test / build / gen:* 脚本
├── LICENSE                 # MIT
└── README.md
```

**单一事实来源**：`axiom.html` 内联的正是 Node 测试运行的同一份 `core.js`——浏览器里点"运行全量自检"与命令行 `npm test` 跑的是同一批检查。

## 5. 快速开始

```bash
# 无头自检（Node ≥ 14，零依赖）
node test/run.js        # 369 项：359 不变量 + 10 注册表完整性
node test/ui-smoke.js   # 26 项：UI 渲染/交互/管线/演示计算路径
# 或 npm test（两者串联）

# 重新生成指令注册表 / 文档（保证文档与实测一致）
node tools/gen-registry.js
node tools/gen-verification.js
node tools/gen-isa-doc.js

# 构建单文件 HTML
node tools/build.js
```

浏览器用法：直接打开 `axiom.html`，七个视图——**架构总览 / 指令集（1024，可搜索过滤）/ 实时自检 / 算法库（51 组，每组可一键运行演示）/ 管线编排（L9）/ 演示实验室 / 导出**。

作为库使用（Node 或浏览器 `<script>`）：

```js
const AXIOM = require('./src/core.js');   // 浏览器：window.AXIOM
const { jacobiEigen, gmmEM, flashAttention, gae, channelCapacity } = AXIOM;
const eig = jacobiEigen([[4, 1], [1, 3]]);   // { values, vectors }
AXIOM.runChecks();                            // { total: 359, passed, results }
```

## 6. 验证哲学

每个算法至少一条**可独立复算的不变量**：

- **解析 vs 数值**：GD/Adam/CG/动量/Nesterov/RMSProp/AdaGrad 收敛到二次函数解析最优；线搜索满足 Armijo 条件
- **暴力枚举 vs 优化算法**：Viterbi 路径 = 2⁸ 全枚举最优；P(O) 前向 = 256 路径求和；变量消去 = 枚举
- **参照实现 vs 主实现**：幂迭代 vs Jacobi 主特征值；Kahan vs TwoSum 精确和；FlashAttention 分块 vs 全量
- **算法定理**：EM 似然单调不减（Dempster 1977）；K-Means SSE 单调不增；Bellman 备份压缩性；AB 算法 = 信道容量解析值
- **恒等式**：(AB)ᵀ=BᵀAᵀ 逐位一致；KL≥0 且 p=q 取等；I(X;Y)=I(Y;X)；D-分离 = 道德图判据 = 暴力条件独立
- **梯度检验**：MLP 与 BPTT 解析梯度 vs 中心差分 ≤ 1e-6；vjp/jvp 对偶恒等式

全部 359 项残差实测值见 [docs/VERIFICATION.md](docs/VERIFICATION.md)——矩阵分解类全部 ≤ 1e-14，最差残差为蒙特卡洛统计类（固有）。UI 层另有 32 项冒烟测试（Node DOM 垫片执行全部渲染路径，含分页/自检/算法库 51 组演示/管线/三个演示）。

## 7. 设计决策

- **为什么纯 JS 数组不用 Float64Array/BLAS**：单文件零依赖 + 简单数组作为 API 边界（与 @tangent.to/lina 同思路），规模定位在 n≤数百的教学/验证负载；算法选型偏向无条件稳定（Jacobi/Householder）而非速度。
- **为什么确定性随机（mulberry32）**：一切蒙特卡洛类验证必须可复现——同种子同序列是检查项之一。
- **为什么 1024 = 16×16×4**：指令集需要完备且可枚举；4 变体覆盖执行语义的三个正交维度（批/融合/原地），全部携带"与 base 逐位一致"的降级契约。
- **为什么 verified 是 811 条**：诚实优先——只标记真有参考实现且通过不变量自检的指令；其余 213 条规格已定义（语义+不变量+世界最优参考），作为路线图。已验证覆盖 **16 族代表算子的 base，以及三大通用执行变体引擎规模化覆盖的实例**：
  - **通用批处理引擎（v1.1.4，v1.1.7 扩面）**：`batched` 变体 **242 个**（沿 batch 维逐位一致，单一 `batched` 调度器 + `BATCH_SIG` 签名表；v1.1.7 新增 `args` 可变参数类并扩至全谱 14 族算子：TENSOR/LINALG/NUMER/PROB/INFO/METRIC/SYS/FWD/BWD/NORM/ATTEN/SAMPLE/DATA/RL）；
  - **通用原地引擎（v1.1.5，v1.1.8 扩面）**：`inplace` 变体 **73 个**（70 引擎实例 + 3 具名内核；v1.3.0 第四轮扩面 53→70）。原地覆盖输入、返回值与 out-of-place 逐位一致；v1.1.8 将 `INPLACE_SIG` 扩至全谱（17→43），引擎统一为「首参 dst 写回」：elem（逐元素标量，extra 可选标量参数）/ vec（整张量形状守恒，extra 可选，如映射类）/ pair / triple / args（多输入：其余参数经 extra 传入，如残差加、层归一化、谱归一化、温度采样、梯度裁剪、Mixup、权重衰减、Dropout）；
  - **通用 Epilogue 融合引擎（v1.1.6，v1.1.7/v1.1.9 扩面）**：`fused` 变体 **240 个**（224 个引擎实例 + 16 个具名代表内核；v1.1.9/v1.2.0 持续对齐 `FUSE_SIG` 与 `BATCH_SIG` 键集，通用引擎测试覆盖全部融合算子）。引擎锚定 **cuBLASLt / CUTLASS 的 GEMM epilogue 融合范式**：算子输出不物化中间张量，单遍就地施加逐元素尾算子，硬不变量 `fused ≡ post ∘ op`（≤1e-15）；v1.1.7 将 `FUSE_SIG` 扩至全谱（尾算子统一 `Math.abs` 保证域安全），全部 183 条新样本经沙盒逐条验证（无异常 + 输出全有限）；
  - 具名原地内核 3 个（fill / copy / normalize_l2，真正原地无中间数组）。
  - 剩余 spec 213 条全部为**诚实保留**（甄别结论见下文「诚实保留（spec）甄别」）：原地变体 183 条（标量输出 / 形状变换 / 函数参数类，单线程无 dst 覆盖语义）；批处理/融合变体 30 条（SYS 并发原语、PRNG 控制、字符串/对象 I/O，单线程无对应可验证语义）；base 1 条（`fence` 内存屏障在单线程运行时是恒等操作，无残差可测）。

### 诚实保留（spec）甄别

`spec` = 规格已定义但未标记 `verified`。本指令集固定为 1024 条（16 族 × 16 算子 × 4 变体），**已验证 811 条**，剩余 **213 条**经逐一甄别确认全部为诚实保留——并非遗漏，而是单线程 JavaScript 运行时下**无可独立复算的可验证语义**：

| 变体 | spec 数 | 诚实保留原因 |
|------|--------|--------------|
| inplace | 183 | 语义为「输入被覆盖、返回值与 out-of-place 逐位一致」；但标量输出 / 形状变换 / 函数参数类算子没有可写回的 dst 张量，原地契约天然失效 |
| batched | 13 | SYS 并发原语（arena_alloc/barrier/cache/ref_count/stream/event/profile/trace/dispatch）——屏障/同步/流保序等并发语义在单线程下是恒等；`seed_repro`/`tokenize` 为 PRNG 控制 / 字符串 I/O，无张量批语义 |
| fused | 16 | 同上 SYS 并发原语 + `tokenize`（字符串输出无法套用数值 epilogue 融合）；`onehot.fused` 输出为对象、FUSE 引擎仅支持数值尾算子 |
| base | 1 | `SYS.fence`（内存屏障）单线程下恒等，无残差可测 |

> 已转化项：v1.3.7 将唯一具备干净批语义的 `RL.monte_carlo.batched`（回报估计沿 batch 独立执行、标量输出、确定性可复算）由 spec 转为 verified，verified 810 → 811。其余 213 条保持 spec，遵守「零重写 + 诚实」铁律——不为凑数虚构语义。

## 7.5 集大成验证算法库（v1.3.8–v1.3.19）

L10 的 1024 微指令是**原子算子 ISA**；在此之外，AXIOM 另附一层**旗舰级算法参考实现**，每条同样携带可独立复算的硬不变量（不占 ISA 网格，计入核心不变量总数 359）。浏览器端在 **「算法库」视图** 中可见可跑：51 组算法的世界顶级来源、硬不变量、实测残差（直接取自 `runChecks()`）一览，每组一个「▶ 运行」按钮执行固定输入的真实计算，另有「运行全部 51 组演示」一键执行：

| 算法 | 世界顶级来源 | AXIOM 实现 | 硬不变量（独立复算路径） | 实测残差 |
|---|---|---|---|---|
| SVD | Golub–Reinsch / Hestenes (1958)；Golub–Van Loan | 单侧 Jacobi（Hestenes 法） | A = U·Σ·Vᵀ 重构 + σᵢ = √λᵢ(AᵀA)（**独立谱交叉**，jacobiEigen 另路计算）+ UᵀU = VᵀV = I；v1.3.11 新增 **ζ=0 等范数列边界**回归检查（修复 `Math.sign(0)=0` 退化） | 2.4e-15 |
| LU 分解 | Doolittle (1878)；Golub–Van Loan | Doolittle 无主元 | A = L·U 重构 + L 单位下三角 / U 上三角（结构精确） | 3.4e-16 |
| FFT | Cooley–Tukey (1965) | 迭代 radix-2 + 位反转 | **参照实现 vs 主实现**：≡ 朴素 O(n²) DFT | 4.3e-14 |
| PageRank | Page–Brin (1998)；Langville–Meyer | 幂迭代 + 悬挂节点 teleport | **两条独立路径**：幂迭代 ≡ 直接线性求解 (I − αP)π = (1−α)·1/n | 3.9e-16 |
| Dijkstra | Dijkstra (1959) | 贪心 + 线性扫描 | **参照实现 vs 主实现**：≡ Bellman–Ford（含不可达节点） | 0（精确） |
| Slice sampling | Neal (2003) | 步进扩展 + 收缩 | 目标保真：E[均值] = 0、E[方差] = 1（标准正态，**12 seed 稳健**） | 3.3e-3 |
| Newton 求根 | Newton–Raphson (1669) | 牛顿迭代 + 驻点早停 | \|f(x*)\| = 0（解析根 ≈ 2.094551482） | 8.9e-16 |
| RK4 | Runge (1895)–Kutta (1901) | 经典四阶 | dx/dt = λx ≡ 解析解 x(T) = x₀e^{λT} | 1.9e-12 |
| 二叉堆 + 堆排序 | Williams (1964)；Knuth TAOCP Vol.3 | 小顶堆（显式比较器）+ 入堆/弹出 | **参照实现 vs 主实现**：堆排序 ≡ Array.sort 升序（200 元素逐位） | 0（精确） |
| 堆优化 Dijkstra | Dijkstra (1959) + 二叉堆 | 优先队列 + 过期条目惰性删除 | **三路交叉**：堆版 ≡ Bellman–Ford ≡ 线性扫描版（含不可达 ∞） | 0（精确） |
| A* | Hart–Nilsson–Raphael (1968) | 二叉堆开放集 + 可采纳启发 | ① 最优距离 ≡ Dijkstra（10 个随机阻挡网格）② 欧氏启发扩展数 < h≡0 一致代价搜索 | 0（精确） |
| FFT 卷积 | Cooley–Tukey (1965)；卷积定理 | c = IFFT(FFT(a)·FFT(b)) 循环卷积 | **参照实现 vs 主实现**：≡ 朴素 O(n²) 卷积 | 4.4e-16 |
| CSR 稀疏矩阵 | 稀疏行压缩存储（SciPy/BLAS 生态） | indptr/indices/data 三数组 | 稀疏 matVec ≡ 稠密 matVec + 转置 ≡ 稠密 transpose（结构守恒） | 0（精确） |
| Prim / Kruskal MST | Prim (1957)；Kruskal (1956) | 稠密 O(V²) + 并查集 O(E logE) | **三路交叉**：Prim ≡ Kruskal ≡ 暴力枚举生成树（割集最优性） | 1.8e-15 |
| 二分求根 | 经典区间二分（数值分析教材） | 括号区间折半 + 变号保持 | 括号二分根 ≡ Newton 根（同一方程两条独立路径） | 3.6e-15 |
| Kadane 最大子数组 | Kadane (1977) | 线性 DP：cur = max(aᵢ, cur+aᵢ) | **参照实现 vs 主实现**：≡ 暴力枚举 O(n²)（20 实例） | 0（精确） |
| QR 迭代特征值 | Francis–Wilkinson (1961–64) | Householder QR 每步 + Wilkinson 位移 + 块 deflation | **两条独立路径**：QR 迭代 ≡ Jacobi 旋转法（含重根/2×2/1×1 退化用例）+ tr(A) = Σλᵢ | 3.2e-14 |
| 最大流 Edmonds–Karp | Edmonds–Karp (1972) | BFS 最短增广路 + 残量网络 | **定理级**：max-flow = min-cut（暴力枚举 2^(n−2) 个割） | 0（精确） |
| 最大流 Dinic | Dinic (1970) | 层次图 + 多路增广阻塞流 | **跨算法一致**：Dinic ≡ Edmonds–Karp | 0（精确） |
| 强连通分量 | Tarjan (1972)；Kosaraju (1978) | low-link 单遍 / 两遍反向图 | **跨算法一致**：Tarjan ≡ Kosaraju（划分逐分量一致，15 图） | 0（精确） |
| 拓扑排序 | Kahn (1962) | 入度队列 | **结构不变量**：所有边前向 + 全节点覆盖 + 有环返回 null | 0（精确） |
| 二分图最大匹配 | Kuhn (1955)；Munkres (1957) | 匈牙利增广路 | **定理级**：König 定理 最大匹配 = 最小顶点覆盖（暴力枚举 2^8）+ 匹配合法性 | 0（精确） |
| Bluestein 任意长度 FFT | Bluestein (1968/1970) | chirp 序列循环卷积 + radix-2 | ≡ 朴素 O(n²) DFT（n = 3/5/…/15 非 2 的幂）+ 2 的幂 ≡ radix-2 | 1.7e-14 |
| 自适应 Metropolis | Haario (2001)；Roberts–Rosenthal (2001) | 协方差自适应随机游走（s_d = 2.38²/d，burn 后冻结） | 三目标经验矩 ≡ 解析：N(0,1) / 2D ρ=0.8 / Gamma(k=3)（20 seed） | 1.0e-2 |
| Hamiltonian MC | Duane (1987)；Neal (2011) | leapfrog 积分 + Metropolis（轨迹抖动） | 经验矩 ≡ 解析 + leapfrog 能量误差 E\|ΔH\| 有界（可逆保体积） | 1.2e-2 |
| Floyd–Warshall | Floyd (1962)；Warshall (1962) | 全源最短路 DP O(n³) | ≡ 每源 Dijkstra + 负权（无负环）≡ 每源 Bellman–Ford | 3.6e-15 |
| 并查集 | Tarjan (1975) | 路径压缩 + 按秩合并 | 连通分量 ≡ BFS + Kruskal-DSU MST ≡ Prim + 分量数守恒 | 7.1e-15 |
| KMP 字符串匹配 | Knuth–Morris–Pratt (1977) | 失败函数预处理 + 单遍扫描 | 命中位置 ≡ 朴素暴力 + 失败函数 ≡ 暴力最长真前后缀 | 0（精确） |
| Gauss–Legendre 求积 | Gauss (1814)；Golub–Welsch (1969) | Newton 求 Pₙ 零点，w = 2/((1−x²)P'ₙ²) | **定理级**：n 点对 ≤2n−1 次多项式精确（n=6/10）+ ∫cos x = 2sin1 | 5.6e-16 |
| Strassen 矩阵乘 | Strassen (1969) | 7 次递归乘法分治（O(n^2.807)） | ≡ 朴素 O(n³)（n = 1/2/4/8/16） | 6.7e-15 |
| 混合基 FFT | Cooley–Tukey (1965)；radix-3·5 | 长度按最小质因子分解，2 幂走 fft、质因子走朴素 DFT | radix-2/3/5 通用 ≡ 朴素 DFT（N=15/45/75/90/225/300…） | 3.7e-12 |
| NUTS 采样器 | Hoffman–Gelman (2014) | 递归二叉轨迹 + 双平均步长自适应 + 多项式选态 | 经验矩 ≡ 解析（1D N(0,1) + 2D ρ=0.8，12 seed 池化） | 2.4e-2 |
| 最小费用最大流 | Ford–Fulkerson (1956)；Busacker–Gowen | SSP + Johnson 势能（Dijkstra） | ≡ SSP+Bellman–Ford ≡ EK（max-flow 值，DAG 含负费用） | 0（精确） |
| 泛化 U-turn NUTS | Betancourt (2017)；Hoffman–Gelman (2014) | 逐维速度判据（修正经典判据在强相关目标上的折叠漏检） | 经验矩 ≡ 解析（2D ρ=0.95，20 seed 池化）+ 判据语义钉死 + 严格细化经典 | 1.7e-2 |
| NTT 数论变换 | Cooley–Tukey；CRT（数论 FFT） | 双模 NTT（p² < 2^53 免 BigInt）+ 中国剩余定理重组 | NTT（模 p）≡ 直接卷积 ≡ 朴素 mod-DFT + CRT ≡ 精确整数卷积 | 0（精确） |
| Hopcroft–Karp 二分图最大匹配 | Hopcroft–Karp (1973) | BFS 分层 + DFS 增广（O(E√V)） | 最大匹配 ≡ Kuhn + 匹配合法性 + 终止时无残留增广路 | 0（精确） |
| Edmonds blossom 一般图最大匹配 | Edmonds (1965)；Berge (1957) | BFS 交错树 + 花缩并 + LCA 联动 | 最大匹配 ≡ 暴力枚举全部匹配子集 + 合法性 + 极大性 + 二分图退化 ≡ Hopcroft–Karp | 0（精确） |
| Split-radix FFT | Yavne (1968)；Duhamel–Hollmann (1984) | 共轭对 L 型分解 Xₖ = E[k] + Wᵏ·A[k] + W³ᵏ·B[k]（2 的幂最低运算量档） | ≡ 朴素 DFT ≙ fft（radix-2）（N = 2..64） | 1.8e-13 |
| Stoer–Wagner 全局最小割 | Stoer & Wagner (1997) | 最大邻接序逐相缩并（O(n³)，无需 s-t） | ≡ 暴力枚举 2ⁿ 划分 ≙ n−1 次 s-t 最小割（Gomory–Hu） | 0（精确） |
| Gomory–Hu 树 | Gomory & Hu (1961) | n−1 次原图最大流缩并（laminar 割） | ≡ 暴力枚举 2^(n−1) s-t 割（所有点对路径最小边 == 精确最小割，**整数 0 容差**，120 图） | 0（精确） |
| Radix-4 FFT | Cooley–Tukey (1965)；基-4 DIT | 长度 N=4^k 四子问题 + 基-4 蝶形 | ≡ 朴素 O(n²) DFT ≙ fft（radix-2）（N = 4/16/64/256） | 1.4e-12 |
| NUTS 对角质量矩阵自适应 | Hoffman–Gelman (2014)；Stan warmup | 双平均步长 + Welford 协方差对角自适应 | 拟合对角质量矩阵 ≡ 目标协方差对角（2D 异方差 σ²=[4,1]，20 seed 稳健） | 5.2e-2 |
| Push-Relabel 最大流 | Goldberg & Tarjan (1988) | 预流推进 + 高度标号（discharge/relabel） | ≙ maxFlowEK（Edmonds–Karp）≙ maxFlowDinic（整数容量 25 图，0 精确） | 0（精确） |
| Hungarian 最大权二分匹配 | Kuhn (1955)；Munkres (1957) | O(n³) 位势法（Kuhn–Munkres） | ≙ mcmfSSPRef（二分图 MCMF）≙ 暴力枚举排列（n≤8，25 图，0 精确） | 0（精确） |
| Gale–Shapley 稳定婚姻 | Gale & Shapley (1962)；Shapley 诺贝尔 | 求婚者主动算法（man/woman-proposing） | **结构不变量**：输出为完美匹配且稳定（无 blocking pair）；男主动与女主动（角色交换）均得稳定匹配 | 0（结构精确） |
| Push-Relabel 全局最小割 | Goldberg (1985/1998) | 固定 s，n−1 次 s-t 最小割（pushRelabel 最大流值）收缩（连续抬升 ≤n−1 次） | ≙ stoerWagner（不同算法，全局最小割，**整数 0 精确**，25 图） | 0（精确） |
| 2-SAT 可满足性 | Aspvall–Plass–Tarjan (1979) | 蕴含图（2n 节点）上 tarjanSCC；SAT ⇔ 变量与其否定不同 SCC；缩点 + Kahn 拓扑序贪心构造可行赋值 | ≙ 暴力枚举 2ⁿ 指派（决策一致，**0 精确**，25 实例） | 0（精确） |
| 桥与割点 | Tarjan (1974) | DFS + disc/low：桥 low[v] > disc[u]；割点 low[v] ≥ disc[u]（根 ≥2 子树） | ≙ 暴力删边/删点连通分量计数（集合精确一致，**0 精确**，25 图） | 0（精确） |
| 拍卖算法解指派问题 | Bertsekas (1981) | ε-标度价格拍卖：未匹配者对「效益−价格」最高与次高对象竞价（加价 = 差 + ε），ε 逐相 ÷n 至 < 1/n；**每相重启匹配、保留价格** | ≙ hungarianMaxWeight（−费用对偶一致）≙ 暴力枚举 n! 排列（最小费用，n≤7，25 seed，**0 精确**） | 0（精确） |
| Top Trading Cycles | Shapley–Scarf (1974) | 函数图找环交易（初始禀赋 + 严格偏好，逐轮消除有向环） | 输出 = **唯一弱核**配置（Roth–Postlewaite 1977）≙ 暴力枚举 n! 配置的弱核/强核（TTC ∈ 强核，n≤5，25 seed，**0 精确**） | 0（精确） |
| 两阶段单纯形 LP | Dantzig (1947)；Bland (1977) | 阶段一人工变量判可行（b≥0 归整，ge/eq 加人工列）+ 阶段二原始单纯形，Bland 规则（进入最小约化成本下标 / 离开最小比值并列最小基下标）防退化循环 | ≙ 暴力顶点枚举（m 约束取 n 等式组 + solveLinear，混合 ≤/≥/= 约束绕可行点构造，25 seed） | 1.4e-14 |

用法：`AXIOM.svd(A)` / `AXIOM.pageRank(n, edges, alpha)` / `AXIOM.fft(complexArray)` / `AXIOM.dijkstra(n, edges, src)` / `AXIOM.sliceSample(logf, x0, N, rng, w, m, burn)` / `AXIOM.heapSort(a)` / `AXIOM.dijkstraHeap(n, edges, src)` / `AXIOM.aStar(n, edges, src, goal, h)` / `AXIOM.fftConvolve(a, b)` / `AXIOM.denseToCSR(M)` / `AXIOM.primMST(n, edges)` / `AXIOM.bisect(f, lo, hi, tol, maxIter)` / `AXIOM.kadane(a)` / `AXIOM.qrEigenvalues(A)` / `AXIOM.maxFlowEK(n, cap, s, t)` / `AXIOM.maxFlowDinic(n, cap, s, t)` / `AXIOM.tarjanSCC(n, edges)` / `AXIOM.kahnTopo(n, edges)` / `AXIOM.bluesteinFFT(x)` / `AXIOM.adaptiveMetropolis(logf, x0, N, rng, burn)` / `AXIOM.hmcSample(logf, gradLogf, x0, N, rng, eps, L)` / `AXIOM.floydWarshall(n, edges)` / `AXIOM.dsuCreate(n)` / `AXIOM.kmpSearch(text, pat)` / `AXIOM.gaussQuad(f, a, b, n)` / `AXIOM.strassenMul(A, B, leaf)` / `AXIOM.kuhnMatching(l, r, edges)` / `AXIOM.mixedRadixFFT(complexArray)` / `AXIOM.nutsSample(logf, gradLogf, x0, N, rng, opts)` / `AXIOM.mcmfSSP(n, s, t, edges)` / `AXIOM.nutsGenUTurn(logf, gradLogf, x0, N, rng, opts)` / `AXIOM.nttConvolveExact(a, b)` / `AXIOM.hopcroftKarp(l, r, edges)` / `AXIOM.blossomMatching(n, edges)` / `AXIOM.splitRadixFFT(complexArray)` / `AXIOM.stoerWagner(n, edges)` / `AXIOM.gomoryHu(n, edges)` / `AXIOM.radix4FFT(complexArray)` / `AXIOM.nutsDiagMass(logf, gradLogf, x0, N, rng, opts)` / `AXIOM.pushRelabel(n, edges, s, t)` / `AXIOM.hungarianMaxWeight(w)` / `AXIOM.stableMarriage(proposerPref, proposeePref)` / `AXIOM.globalMinCutPR(n, edges)` / `AXIOM.twoSat(n, clauses)` / `AXIOM.bridgesArticulation(n, edges)` / `AXIOM.auctionAssignment(cost)` / `AXIOM.topTradingCycles(endow, prefs)` / `AXIOM.simplexLP(c, A, b, senses, opts)` 等，详见 [docs/ALGORITHMS.md](docs/ALGORITHMS.md)。

## 8. 路线图

- [x] L2 监督学习：动量/Nesterov/AdaGrad/RMSProp/AdamW/线搜索/Polyak（凸二次收敛验证）
- [x] L4：FlashAttention 分块、RoPE 相对性、MQA/GQA、KV-cache 增量一致性
- [x] L5：变量消去 vs 暴力枚举、链式 BP = 前向-后向、D-分离 vs 条件独立、联合树 RIP、粒子滤波
- [x] L9：L9 管线编排视图（微指令组合执行，3 预设 + 自定义）
- [x] L2：L-BFGS / BFGS 拟牛顿（两循环递归 + 强 Wolfe 线搜索，≤30 步收敛、H ≈ A⁻¹）
- [x] L3：层归一化解析梯度（链式法则复合，数值 Jacobian 验证）
- [x] L5：Gibbs/MCMC 平稳分布收敛（解析平稳分布验证）
- [x] L10 执行变体层：16 族代表算子的 base/batched/fused/inplace 全覆盖（fused=顺序组合、batched/inplace 逐位一致）
- [ ] WASM 内核加速（保持 JS 回退，API 不变）
- [x] L10 诚实保留甄别收口（v1.3.7）：213 条 spec 全部确认为诚实保留，唯一可转化项 `monte_carlo.batched` 已 verified（810→811）
- [x] 集大成验证算法库（v1.3.8）：SVD / LU / FFT / PageRank / Dijkstra / slice sampling / Newton / RK4 八项旗舰实现，各带独立复算硬不变量（核心不变量 304 → 312）
- [x] 算法库扩展（v1.3.9）：二叉堆+堆排序 / 堆优化 Dijkstra / A* / FFT 卷积 / CSR 稀疏矩阵 / Prim+Kruskal MST（暴力枚举独立验证）/ 二分求根 / Kadane，九条硬不变量全部 25-seed 稳健（核心不变量 312 → 321）
- [x] 算法库扩展（v1.3.10）：QR 迭代特征值（Wilkinson 位移）≡ Jacobi / 最大流 Edmonds–Karp + Dinic（max-flow = min-cut 定理级验证）/ Tarjan ≡ Kosaraju SCC / Kahn 拓扑 / Kuhn 匹配（König 定理级验证），七条硬不变量全部 25-seed 稳健（核心不变量 321 → 328）
- [x] 算法库 UI 层（v1.3.11）：新增「算法库」视图（第七个 Tab），22 组算法来源/硬不变量/实测残差一览 + 每组「▶ 运行」真实计算演示 + 「运行全部 22 组」；UI 冒烟 26 → 33 项全绿。同步修复 `svd` Hestenes 旋转 ζ=0 边界缺陷（等范数列对称阵 SVD 退化，随机矩阵检查概率 0 永不触发）并新增回归检查（核心不变量 328 → 329，总 338 → 339）
- [x] 算法库扩展二（v1.3.12）：Bluestein 任意长度 FFT / 自适应 Metropolis（Haario 协方差自适应，三目标 20 seed）/ Hamiltonian MC（leapfrog + 能量守恒）/ Floyd–Warshall / 并查集 / KMP / Gauss–Legendre 求积 / Strassen 矩阵乘，九条硬不变量全部 25-seed 稳健（核心不变量 329 → 338）
- [x] 算法库扩展三（v1.3.13）：混合基 FFT（radix-2/3/5 通用分解）/ NUTS（No-U-Turn Sampler，双平均自适应步长 + 多项式选态，严格遵循 Hoffman–Gelman Algorithm 2/3）/ 最小费用最大流（SSP + Johnson 势能），三条硬不变量全部通过（核心不变量 338 → 341）
- [x] 算法库扩展四（v1.3.14）：泛化 U-turn NUTS（Betancourt 2017 逐维速度判据 —— 修正经典标量判据在 ρ=0.95 强相关目标上的折叠漏检，残差 2.80e-1 → 1.66e-2）/ NTT 数论变换 + CRT 精确整数卷积（FFT 的有限域对应）/ Hopcroft–Karp 二分图最大匹配（O(E√V)），三条硬不变量全部通过（核心不变量 341 → 344）
- [x] 算法库扩展五（v1.3.15）：Edmonds blossom 一般图最大匹配（超越二分图，≡ 暴力枚举全部匹配子集）/ Split-radix FFT（Yavne 1968 共轭对 L 型分解，2 的幂已知最低运算量档）/ Stoer–Wagner 全局最小割（≡ 暴力 2ⁿ 划分 ≙ n−1 次 s-t 最小割），三条硬不变量全部 **0 精确**（核心不变量 344 → 347）
- [x] 算法库扩展六（v1.3.16）：Gomory–Hu 树（Gomory & Hu 1961，n−1 次原图最大流缩并给出所有点对最小割结构，≡ 暴力枚举 2^(n−1) s-t 割，**整数 0 精确**）/ Radix-4 FFT（基-4 DIT，N=4^k 运算量低于纯 radix-2）/ NUTS 对角质量矩阵自适应（Stan warmup + Welford，拟合质量矩阵 ≡ 目标协方差对角），三条硬不变量全部通过（核心不变量 347 → 350，算法库 39 → 42）
- [x] 算法库扩展七（v1.3.17）：Push-Relabel 最大流（Goldberg–Tarjan 1988，预流推进 + 高度标号，≙ maxFlowEK ≙ maxFlowDinic，**整数容量 0 精确**）/ Hungarian 最大权二分匹配（Kuhn–Munkres O(n³) 位势法，≙ mcmfSSPRef ≙ 暴力枚举排列，**0 精确**）/ Gale–Shapley 稳定婚姻（Gale & Shapley 1962，求婚者主动算法，结构不变量：完美匹配 + 无 blocking pair，男主动与女主动均稳定），三条硬不变量全部 **0 精确**（核心不变量 350 → 353，算法库 42 → 45）
- [x] 算法库扩展八（v1.3.18）：Push-Relabel 全局最小割（Goldberg 1985/1998，固定 s 后 n−1 次 s-t 最小割（pushRelabel 最大流值）收缩，≙ stoerWagner 不同算法，**全局最小割 0 精确**）/ 2-SAT 可满足性（Aspvall–Plass–Tarjan 1979，蕴含图 SCC：SAT ⇔ 变量与其否定不同 SCC，≙ 暴力枚举 2ⁿ 指派，**决策 0 精确**）/ 桥与割点（Tarjan 1974，DFS disc/low：桥 low[v]>disc[u]、割点 low[v]≥disc[u]，≙ 暴力删边/删点连通分量计数，集合 **0 精确**），三条硬不变量全部 **0 精确**（核心不变量 353 → 356，算法库 45 → 48）
- [x] 算法库扩展九（v1.3.19）：拍卖算法解指派问题（Bertsekas 1981，ε-标度价格拍卖 —— 每相重启匹配保留价格，否则首相后 ε₀-最优性丧失；≙ hungarianMaxWeight ≙ 暴力排列，**0 精确**）/ Top Trading Cycles（Shapley–Scarf 1974，函数图找环交易 —— 输出为唯一弱核配置（Roth–Postlewaite 1977）且必在强核中，≙ 暴力 n! 配置核扫描，**0 精确**）/ 两阶段单纯形 LP（Dantzig 1947 + Bland 1977，人工变量阶段一 + Bland 规则防退化循环，≙ 暴力顶点枚举，1.4e-14），三条硬不变量全部通过（核心不变量 356 → 359，算法库 48 → 51）
- [ ] 集大成算法库后续扩展（MCMF 网络单纯形对偶 / 任意图最大权匹配 Blossom V / NUTS 全质量矩阵（dense M）自适应 / HMC 自适应步长 dual-averaging / Radix-4 任意长度 split-radix 推广 / Hungarian 与稳定婚姻延迟接受变种交叉）

## 9. 致谢

站在巨人肩上：Householder · Jacobi · Cholesky · Dekker · Knuth · Dempster · Rabiner · Pearl · Lauritzen · Bellman · Kahan · Box–Muller · Lloyd · Breiman · Rumelhart · Hestenes–Stiefel · Watkins–Dayan · Kingma–Ba · Loshchilov–Hutter · Vaswani · Dao · Press · Su · Ainslie · Schulman · Arimoto–Blahut · Hestenes · Doolittle · Cooley–Tukey · Page–Brin · Dijkstra · Neal · Newton · Runge–Kutta · Williams · Hart–Nilsson–Raphael · Prim · Kruskal · Kadane · Wilkinson · Edmonds–Karp · Dinic · Tarjan · Kosaraju · Kahn · Kuhn–Munkres · König · Bluestein · Haario · Roberts–Rosenthal · Duane · Floyd · Warshall · Tarjan–van Leeuwen · Knuth–Morris–Pratt · Gauss · Golub–Welsch · Strassen · Hoffman–Gelman · Ford–Fulkerson · Busacker–Gowen · Betancourt · Hopcroft–Karp · Edmonds · Berge · Yavne · Duhamel–Hollmann · Stoer–Wagner · Bertsekas · Shapley–Scarf · Roth–Postlewaite · Dantzig · Bland，以及 scipy / ml.js / @tangent.to/lina 开源生态。

---

**作者：晨星** ✦ 天亮前最后还亮着的那颗。
