# 更新日志

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
