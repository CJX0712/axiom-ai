# ✦ AXIOM · 自验证 AI 微指令操作系统

<div align="center">

[![License](https://img.shields.io/badge/License-MIT-green)](https://github.com/CJX0712/axiom-ai/blob/main/LICENSE) [![Language](https://img.shields.io/badge/HTML-E34F26?logo=html)](https://github.com/CJX0712/axiom-ai) [![Deps](https://img.shields.io/badge/dependencies-0-brightgreen)](https://github.com/CJX0712) [![Verified](https://img.shields.io/badge/invariants-290%2F290-brightgreen)](https://github.com/CJX0712) [![ISA](https://img.shields.io/badge/ISA-1024%20micro--instructions-blue)](https://github.com/CJX0712/axiom-ai) [![Kernels](https://img.shields.io/badge/verified%20kernels-810%2F1024-blueviolet)](https://github.com/CJX0712/axiom-ai) [![Author](https://img.shields.io/badge/author-晨星-blueviolet)](https://github.com/CJX0712)

</div>

> **十层架构 × 1024 微指令 × 290 项数学不变量 · 零依赖单文件 · 浏览器/Node 双端同源 · 可运行 / 可复现 / 可验证**
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
npm test          # → 300/300：290 核心不变量 + 10 注册表完整性，UI 冒烟 26/26，全绿
open axiom.html   # → 单文件仪表盘：架构图 / 指令浏览器 / 实时自检 / L9 管线编排 / 三个训练演示 / 导出
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
| L10 | **微指令层** | **810/1024** | 全部 16 族（本指令集主体） |

每条指令的 4 个执行变体：`base`（标量语义）· `batched`（批处理，逐位一致）· `fused`（融合，消除中间物化）· `inplace`（原地执行）。

## 4. 仓库结构

```
axiom-ai/
├── axiom.html              # ★ 单文件应用（构建产物，零依赖，双击即用）
├── src/
│   ├── core.js             # 数学与算法核心（UMD，浏览器/Node 双端同源，169 项不变量）
│   ├── registry.js         # 1024 微指令注册表（自动生成，勿手改）
│   └── ui.js               # 仪表盘 UI（6 视图，含 L9 管线编排）
├── test/
│   ├── run.js              # 无头自检：169 不变量 + 10 注册表完整性
│   └── ui-smoke.js         # UI 冒烟测试（Node DOM 垫片执行全部渲染路径）
├── tools/
│   ├── gen-registry.js     # 从分类学生成 1024 指令（含完整性断言）
│   ├── gen-verification.js # 从真实运行结果生成验证报告
│   ├── gen-isa-doc.js      # 生成指令集全目录
│   └── build.js            # 打包单文件 HTML（构建期语法预检）
├── docs/
│   ├── ARCHITECTURE.md     # 十层架构 + 指令集规范
│   ├── VERIFICATION.md     # 169 项不变量残差全表（自动生成）
│   └── ISA-1024.md         # 1024 条微指令完整规格表（自动生成）
├── package.json            # test / build / gen:* 脚本
├── LICENSE                 # MIT
└── README.md
```

**单一事实来源**：`axiom.html` 内联的正是 Node 测试运行的同一份 `core.js`——浏览器里点"运行全量自检"与命令行 `npm test` 跑的是同一批检查。

## 5. 快速开始

```bash
# 无头自检（Node ≥ 14，零依赖）
node test/run.js        # 185 项：175 不变量 + 10 注册表完整性
node test/ui-smoke.js   # 26 项：UI 渲染/交互/管线/演示计算路径
# 或 npm test（两者串联）

# 重新生成指令注册表 / 文档（保证文档与实测一致）
node tools/gen-registry.js
node tools/gen-verification.js
node tools/gen-isa-doc.js

# 构建单文件 HTML
node tools/build.js
```

浏览器用法：直接打开 `axiom.html`，六个视图——**架构总览 / 指令集（1024，可搜索过滤）/ 实时自检 / 管线编排（L9）/ 演示实验室 / 导出**。

作为库使用（Node 或浏览器 `<script>`）：

```js
const AXIOM = require('./src/core.js');   // 浏览器：window.AXIOM
const { jacobiEigen, gmmEM, flashAttention, gae, channelCapacity } = AXIOM;
const eig = jacobiEigen([[4, 1], [1, 3]]);   // { values, vectors }
AXIOM.runChecks();                            // { total: 169, passed, results }
```

## 6. 验证哲学

每个算法至少一条**可独立复算的不变量**：

- **解析 vs 数值**：GD/Adam/CG/动量/Nesterov/RMSProp/AdaGrad 收敛到二次函数解析最优；线搜索满足 Armijo 条件
- **暴力枚举 vs 优化算法**：Viterbi 路径 = 2⁸ 全枚举最优；P(O) 前向 = 256 路径求和；变量消去 = 枚举
- **参照实现 vs 主实现**：幂迭代 vs Jacobi 主特征值；Kahan vs TwoSum 精确和；FlashAttention 分块 vs 全量
- **算法定理**：EM 似然单调不减（Dempster 1977）；K-Means SSE 单调不增；Bellman 备份压缩性；AB 算法 = 信道容量解析值
- **恒等式**：(AB)ᵀ=BᵀAᵀ 逐位一致；KL≥0 且 p=q 取等；I(X;Y)=I(Y;X)；D-分离 = 道德图判据 = 暴力条件独立
- **梯度检验**：MLP 与 BPTT 解析梯度 vs 中心差分 ≤ 1e-6；vjp/jvp 对偶恒等式

全部 290 项残差实测值见 [docs/VERIFICATION.md](docs/VERIFICATION.md)——矩阵分解类全部 ≤ 1e-14，最差残差为蒙特卡洛统计类（固有）。UI 层另有 26 项冒烟测试（Node DOM 垫片执行全部渲染路径，含分页/自检/管线/三个演示）。

## 7. 设计决策

- **为什么纯 JS 数组不用 Float64Array/BLAS**：单文件零依赖 + 简单数组作为 API 边界（与 @tangent.to/lina 同思路），规模定位在 n≤数百的教学/验证负载；算法选型偏向无条件稳定（Jacobi/Householder）而非速度。
- **为什么确定性随机（mulberry32）**：一切蒙特卡洛类验证必须可复现——同种子同序列是检查项之一。
- **为什么 1024 = 16×16×4**：指令集需要完备且可枚举；4 变体覆盖执行语义的三个正交维度（批/融合/原地），全部携带"与 base 逐位一致"的降级契约。
- **为什么 verified 是 810 条**：诚实优先——只标记真有参考实现且通过不变量自检的指令；其余 214 条规格已定义（语义+不变量+世界最优参考），作为路线图。已验证覆盖 **16 族代表算子的 base，以及三大通用执行变体引擎规模化覆盖的实例**：
  - **通用批处理引擎（v1.1.4，v1.1.7 扩面）**：`batched` 变体 **242 个**（沿 batch 维逐位一致，单一 `batched` 调度器 + `BATCH_SIG` 签名表；v1.1.7 新增 `args` 可变参数类并扩至全谱 14 族算子：TENSOR/LINALG/NUMER/PROB/INFO/METRIC/SYS/FWD/BWD/NORM/ATTEN/SAMPLE/DATA/RL）；
  - **通用原地引擎（v1.1.5，v1.1.8 扩面）**：`inplace` 变体 **73 个**（70 引擎实例 + 3 具名内核；v1.3.0 第四轮扩面 53→70）。原地覆盖输入、返回值与 out-of-place 逐位一致；v1.1.8 将 `INPLACE_SIG` 扩至全谱（17→43），引擎统一为「首参 dst 写回」：elem（逐元素标量，extra 可选标量参数）/ vec（整张量形状守恒，extra 可选，如映射类）/ pair / triple / args（多输入：其余参数经 extra 传入，如残差加、层归一化、谱归一化、温度采样、梯度裁剪、Mixup、权重衰减、Dropout）；
  - **通用 Epilogue 融合引擎（v1.1.6，v1.1.7/v1.1.9 扩面）**：`fused` 变体 **240 个**（224 个引擎实例 + 16 个具名代表内核；v1.1.9/v1.2.0 持续对齐 `FUSE_SIG` 与 `BATCH_SIG` 键集，通用引擎测试覆盖全部融合算子）。引擎锚定 **cuBLASLt / CUTLASS 的 GEMM epilogue 融合范式**：算子输出不物化中间张量，单遍就地施加逐元素尾算子，硬不变量 `fused ≡ post ∘ op`（≤1e-15）；v1.1.7 将 `FUSE_SIG` 扩至全谱（尾算子统一 `Math.abs` 保证域安全），全部 183 条新样本经沙盒逐条验证（无异常 + 输出全有限）；
  - 具名原地内核 3 个（fill / copy / normalize_l2，真正原地无中间数组）。
  - 剩余 spec 214 条主要是系统语义系（SYS 10 条）/种子复现/字符串分词等诚实保留项（详见 ARCHITECTURE 甄别说明），以及 JS 单线程下无可验证语义的 `fence`（内存屏障在单线程运行时是恒等操作，无残差可测）。

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

## 9. 致谢

站在巨人肩上：Householder · Jacobi · Cholesky · Dekker · Knuth · Dempster · Rabiner · Pearl · Lauritzen · Bellman · Kahan · Box–Muller · Lloyd · Breiman · Rumelhart · Hestenes–Stiefel · Watkins–Dayan · Kingma–Ba · Loshchilov–Hutter · Vaswani · Dao · Press · Su · Ainslie · Schulman · Arimoto–Blahut，以及 scipy / ml.js / @tangent.to/lina 开源生态。

---

**作者：晨星** ✦ 天亮前最后还亮着的那颗。
