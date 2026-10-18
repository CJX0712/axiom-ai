# 更新日志

## [1.1.7] - 2026-10-19

### 三大引擎规模化扩面（Engine Scale-Out）
- **目标**：把 batched / fused 两个通用引擎从"16 族代表算子"扩到**全谱算子**——签名表驱动，只增数据不改引擎代码
- `batched()` 与 `_applySig()` 新增 `args` 可变参数类：`f.apply(null, x)` 展平调用，覆盖创建型/多参数型算子（tensorCreate/zeros/reshape/gather/scatter、selfAttention/multiHead、jacobian/vjp/jvp、binomial 等）
- `BATCH_SIG` **67 → 159 条**（新增 92 条，覆盖 TENSOR/LINALG/NUMER/PROB/INFO/METRIC/SYS/FWD/BWD/NORM/ATTEN/SAMPLE/DATA/RL 共 14 族）；`FUSE_SIG` **49 → 140 条**（新增 91 条，尾算子统一 `Math.abs` 保证 log/sqrt 域安全；`DATA.label_encode` 因输出含字符串而诚实排除）
- **样本质量闭环**：183 条新签名的全部样本先经沙盒逐条验证（引擎执行无异常 + 输出全有限，剔除 67 个失败候选），再由生成器整块写入，杜绝"幽灵样本"
- `variant.batched` 聚合检查的朴素参照路径补齐 `args` 分支（`s.fn.apply(null, x)`），与引擎调度严格对称；`variant.fused` 经 `_applySig` 自动获得 args 支持
- `gen-registry.js` 零改动：签名表扩面后自动标记对应变体 verified（impl='batched'/'fused'）
- 指标：verified **407 → 589 / 1024**（+182）；batched 层 **67 → 159**；fused 层 **65 → 155**（139 引擎 + 16 具名）；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 511.9 KB
- 诚实说明：FUSE_SIG 中 1 个键（`ATTEN.qk_dot.fused`）被 v1.1.3 具名内核 `fused_attn_weights`（QK∘scale∘掩码∘softmax 单趟注意力权重）按"具名优先"规则遮蔽，注册表标记 139 而非 140——具名实现硬不变量更强，属预期行为

## [1.1.6] - 2026-10-18

### 通用 Epilogue 融合引擎（Generic Epilogue Fusion Engine）
- 建造**单一 `fused` 调度器 + `FUSE_SIG` 签名表**（49 个非代表算子的 fused 变体），与 `BATCH_SIG` 同构复用 cls/sample，仅多一个逐元素尾算子 `post`
- **世界级范式锚定**：cuBLASLt / CUTLASS 的 GEMM epilogue 融合 —— 算子输出不物化中间张量，单遍「就地」施加逐元素尾算子（单次分配，省去一次全量分配与一趟遍历）
- 新增助手：`_applySig`（单样本按 cls 施加算子）、`_epilogue`（就地单遍尾算子）、`_mapPost`（参照实现，纯函数映射会物化中间张量）
- 硬不变量：`fused ≡ post ∘ op`（≤1e-15）。代表融合对：GEMM∘ReLU（LINALG.matmul）、log-softmax（FWD.softmax）、log-sigmoid、方差∘sqrt→标准差（PROB.variance）、熵∘exp→困惑度（INFO.entropy）、log|det|（LINALG.det，高斯对数似然项）、梯度范数∘倒数→自适应步长（OPTIM.grad_norm）、散度∘sqrt（Hellinger 型）、expm1↔log1p 互逆尾算子、温度 softmax∘log
- 不变量 +0（仍为 178 核心）：`variant.fused` 聚合检查扩展为「遍历 FUSE_SIG 断言 ≡ 纯组合」＋原有 16 族具名代表内核，带"至少覆盖 40 个融合样本"守卫
- `gen-registry.js` 由 `FUSE_SIG` 驱动 fused 变体标记 verified（键格式 `GROUP.op.fused`），与 BATCH_SIG / INPLACE_SIG 三者对称
- 指标：verified **358 → 407 / 1024**；fused 层 **16 → 65**；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 494.0 KB

## [1.1.5] - 2026-10-18

### 通用原地引擎（Generic Inplace Engine）
- 建造**单一 `inplace` 调度器 + `INPLACE_SIG` 签名表**，把"原地覆盖输入、返回值与 out-of-place 逐位一致"语义规模化覆盖到全族原地兼容算子（统一取代逐族手写样板）
- 签名表区分两类：`elem`（逐元素标量函数，原地覆盖每元素，如 sigmoid/relu/gelu/erf/reciprocal/expm1/log1p）+ `vec`（整向量/矩阵函数，形状守恒，如 minmax/zscore/grad_relu/grad_tanh/inverse/cholesky）
- 新增 `_writeBack` 递归写回助手：支持 1D 向量与 2D 矩阵原地覆写（矩阵类算子 inverse/cholesky 无需额外分支即可原地落位）
- 不变量 +0（仍为 178 核心）：`variant.inplace` 聚合检查遍历 `INPLACE_SIG`，断言 `inplace` 路径 ≡ out-of-place（残差 ≤ 1e-15），并带"至少覆盖 10 个算子"守卫；保留 3 个具名原地内核（fill/copy/normalize_l2，真正原地无中间数组）
- `gen-registry.js` 由 `INPLACE_SIG` 驱动 inplace 变体标记 verified（键格式 `GROUP.op.inplace`），与 `BATCH_SIG` 驱动 batched 完全对称
- 指标：verified **339 → 358 / 1024**；batched 层 **65 → 67**（附加清理 BATCH_SIG 幽灵键：kahan/exactsum 算子名对齐 + 移除重复的 PROB.normalize_dist）；inplace 层 **3 → 20**；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 487.3 KB
- 文档：README/ARCHITECTURE 徽章与分层计数一致性更新

## [1.1.4] - 2026-10-18

### 通用批处理引擎（Generic Batched Engine）
- 建造**单一 `batched` 调度器 + `BATCH_SIG` 签名表**，把"沿 batch 维逐位一致"语义一次性覆盖到全部 49 个批兼容算子（取代 v1.1.2 的 16 个手写 `batched_*` 函数）
- 签名表区分六类：`vec`（整张量算子，如 softmax/normalizeL2）、`elem`（逐元素标量函数，如 sigmoid/relu/gelu）、`pair`、`triple`、`shared`（共享权/参数，如 linear/epsilon_greedy）、`special`（多返回/对象型，如 selfAttention/oneHot）
- 不变量 +0（仍为 178 核心）：`variant.batched` 聚合检查遍历 `BATCH_SIG`，断言 `batched` 路径 ≡ 逐样本朴素路径（残差 ≤ 1e-15），并带"至少覆盖 60 个算子"守卫
- 覆盖 16 族：TENSOR/NUMER/NORM/FWD/BWD/INFO/PROB/METRIC/LINALG/OPTIM/SYS/ATTEN/GRAPH/RL/DATA/SAMPLE
- `arrMaxDiff` 增强：支持对象型返回值（跳过多态 `predict` 等函数字段），避免误判
- 指标：verified **290 → 339 / 1024**；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 484.5 KB
- 文档：README/ARCHITECTURE 徽章与分层计数一致性更新；gen-registry 由 `BATCH_SIG` 驱动 batched 变体，移除 16 个显式条目

## [1.1.3] - 2026-10-18

### 融合变体内核化（fused variant layer）
- 注册表生成器支持 `fused` 变体标记 verified（键格式 `GROUP.op.fused`）
- 新增 **fused 变体内核**（与相邻算子融合，消除中间张量物化，输出等于顺序组合）：覆盖 16 族代表算子
  TENSOR.transpose∘flatten · LINALG.matvec∘relu · NUMER.softmax∘log(稳定 log-softmax) ·
  PROB.gauss_pdf∘log(稳定 log-PDF) · INFO.cross_entropy∘softmax(稳定 softmax+CE) ·
  OPTIM.grad_clip∘grad_norm · FWD.linear∘relu · BWD.grad_tanh∘上游梯度 ·
  NORM.normalize_l2∘仿射缩放 · ATTEN.qk_dot∘scale∘因果掩码∘softmax(因果注意力权重) ·
  SAMPLE.topk∘temperature · GRAPH.marginal∘normalize · RL.value_iter∘greedy ·
  METRIC.mse∘sqrt(RMSE) · DATA.label_encode∘one_hot · SYS.reduce_all∘broadcast
- 不变量 +1：`variant.fused`（16 族代表算子融合一致性，参照实现 vs 主实现）
- 指标：verified **274 → 290 / 1024**；核心不变量 **177 → 178**；axiom.html 479.3 KB
- 文档：README / ARCHITECTURE 徽章与分层计数一致性更新；路线图标记执行变体层 16 族全覆盖

## [1.1.2] - 2026-10-18

### 执行变体内核化（variant layer）
- 注册表生成器支持 `batched` / `inplace` 变体标记 verified（键格式 `GROUP.op.variant`）
- 新增 **batched 变体内核**（沿 batch 维独立执行，结果与逐样本调用逐位一致）：覆盖 16 族代表算子
  TENSOR.transpose · LINALG.matvec · NUMER.softmax · PROB.gauss_pdf · INFO.entropy ·
  NORM.normalize_l2 · FWD.linear · BWD.grad_relu · METRIC.mse · ATTEN.self_attn ·
  GRAPH.marginal · RL.epsilon_greedy · OPTIM.grad_clip · DATA.onehot · SYS.reduce_all · SAMPLE.categorical
- 新增 **inplace 变体内核**（原地执行，返回值与 out-of-place 逐位一致）：
  TENSOR.fill · TENSOR.copy · NORM.normalize_l2
- 不变量 +2：`variant.batched`（16 族代表算子逐位一致性）· `variant.inplace`
- 指标：verified **255 → 274 / 1024**；核心不变量 **175 → 177**；16 族代表算子 variant 层落地
- 文档：README / ARCHITECTURE 分层计数与徽章一致性更新；补充变体层说明

## [1.1.1] - 2026-10-18

**路线图攻坚：15/16 指令族满核化（16/16），verified 249 → 255/1024，核心不变量 169 → 175 项，185/185 + 26/26 全绿。**

### 新增内核（+6 条 verified 微指令）

- **OPTIM.bfgs**：BFGS 拟牛顿（Broyden–Fletcher–Goldfarb–Shanno 1970）—— 共享强 Wolfe 线搜索（Nocedal–Wright 算法 3.5/3.6 含 zoom），凸二次 7 步收敛至 2e-11，H 近似 SPD 且 H ≈ A⁻¹（相对 Frobenius ≤1e-2）
- **OPTIM.lbfgs**：L-BFGS 两循环递归（Liu–Nocedal 1989）—— 限定内存 m=5 下 13 步收敛至 6e-13
- **BWD.grad_layernorm**：层归一化解析梯度（链式法则复合）—— 数值 Jacobian 交叉验证 ≤1e-6
- **GRAPH.gibbs**：Gibbs 采样平稳分布 —— 2 状态链经验频率 = 解析平稳分布 [0.6, 0.4]（n=4e4）
- **GRAPH.mcmc**：Metropolis 对称提议采样 —— 经验分布 ≈ 目标分布（n=4e4）
- **INFO.rate_distortion**：高斯信源率失真函数 R(D) = ½log₂(σ²/D) —— 已知值精确 + 单调不增

### 修复

- `core.js` VERSION 从 1.0.0 同步至 1.1.1（v1.1.0 时包版本与核心版本不一致）
- ARCHITECTURE.md 层计数与族表同步至 255 实测值

## [1.1.0] - 2026-10-18

**L10 微指令层大规模细化**：verified 93 → 249/1024，核心不变量 64 → 169 项，全部测试全绿（179/179 无头 + 26/26 UI 冒烟）。

### 新增内核（+156 条 verified 微指令）

- **TENSOR**：create/zeros/ones/arange/reshape/slice/concat/stack/split/cast/copy/gather/scatter/fill/flatten（结构不变量，容差 0）
- **LINALG**：rank（高斯消元）、nullspace（RREF 自由变量基）、orthonormalize（Gram–Schmidt）、cond（幂迭代条件数估计）
- **NUMER**：expm1/log1p/hypot（平台原生）、div_guard、sqrt_guard、reciprocal、**fma（Dekker 分裂单次舍入模拟，朴素双舍入失败案例精确复原）**
- **PROB**：bernoulli/binomial/uniform 采样、marginal、conditionalRow、**mv_gauss（Cholesky 求值，2D Simpson ∫pdf=1）**、sample_stats
- **INFO**：perplexity、surprisal、bits、kl_reverse、max_entropy（网格暴力验证均匀最优）、normalize_dist、**channel_capacity（Arimoto–Blahut 迭代，BSC 解析值 0.531 bits）**
- **OPTIM**：momentum、nesterov、adagrad、rmsprop、adamw（λ=0 退化 Adam + 零梯度步精确解耦衰减）、grad_clip、grad_norm、lr_decay、weight_decay、polyak、**line_search（Armijo 充分下降回溯）**
- **FWD**：tanh、embedding_lookup、flatten、residual_add、split/concat_heads、pool_max、batchnorm、dropout（期望不变性 2e4 种子）、conv1d
- **BWD**：grad_relu、grad_tanh、grad_softmax_ce、grad_matmul、chain_rule、jacobian、**vjp/jvp（对偶恒等式）**、grad_accum、stop_grad、detach、**bptt（RNN 时间反向传播，中心差分 ≤1e-6）**
- **NORM**：l1_reg、weight_norm、spectral_norm（幂迭代）、group_norm、batch_norm、label_smooth、mixup、dropout_reg、early_stop
- **ATTEN**：qk_dot、scale、cross_attn、multi_head（逐头独立重算）、mha_split、rel_pos、alibi、**rope（⟨R_m q, R_n k⟩ 只依赖 m−n）**、kv_cache（增量=全量）、mqa、gqa、**flash（在线 softmax 分块 = 全量，chunk=1/2/3/7）**、attn_entropy
- **SAMPLE**：uniform、bernoulli、gumbel（均值≈γ）、topp（最小支撑）、multinomial、rejection（Beta(2,2) 接受率=1/M）、inverse_cdf、antithetic（解析方差缩减）、stratified、systematic
- **GRAPH**：chain_belief_prop（=前向-后向）、variable_elim（=256 路径枚举）、factor_product/sumOut、junction_tree（RIP 路径判定）、clique_tree_calibrate、kalman（Riccati 稳态解析解）、particle（后验均值≈前向-后向）、**dsep（路径枚举 = 联合分布暴力条件独立）**、m_sep（祖先道德图）
- **RL**：bellman_backup（压缩映射）、policy_iter（=VI 且单调）、sarsa、td_lambda（资格迹 (γλ)^t）、monte_carlo（无偏）、greedy、ucb、advantage、**gae（λ=0→TD、λ=1→MC）**、reinforce（无偏策略梯度）、ppo（截断公式）、thompson（Beta 后验匹配）
- **METRIC**：perplexityLM、bleu（Papineni 2002，已知值 0.5976）、map、confusion
- **DATA**：label_encode、pad、truncate、bucket、dedup、filter、map、zip、batch、normalize_fit（防泄漏）、augment、tokenize
- **SYS**：gather_all、scatter_all、cache、ref_count、stream、checkpoint、profile、trace、dispatch、barrier、event、prefetch

### 新增能力

- **L9 管线编排视图**：由已验证微指令组合执行推理管线（3 预设 + 14 算子自定义池），逐步展示中间张量与不变量
- **文档自动生成**：`tools/gen-verification.js`（验证报告随实测重生）、`tools/gen-isa-doc.js`（1024 条全目录）
- CI 增加 `npm run build` 步骤（单文件 HTML 可复现构建）

### 修复与改进

- `batchNorm`/`groupNorm` 的 `eps=0` 被 `||` 吞没（改用 `undefined` 判定）
- `mqa` 语义修正为「每 Q 头对共享 K/V」
- `mSeparated` 修正为祖先子图道德图判据（Lauritzen 1990）
- `ripCheck` 修正为路径必经判定（原连通性判定无法识别 RIP 违背）
- `monteCarloReturn` 转移分布正确采样 + 移除错误的终止态假设
- `zipOp` 按 min 长度截断
- Kalman 稳态方差解析式修正为 `(−Q+√(Q²+4RQ))/2`
- AdamW 检查改为两条精确不变量（λ=0 退化 + 零梯度解耦衰减）
- `chainSetup` 加入导出（RL API 完整性）

## [1.0.0] - 2026-10-14

首个正式版本：十层架构 × 1024 微指令 × 64 项不变量，verified 93/1024。
