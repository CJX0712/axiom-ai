# 更新日志

## [1.3.1] - 2026-10-19

### 核心不变量扩容第五批（226 → 238）+ 修复 HMM 后向递推缺陷
- **🐛 真实缺陷修复**：`hmmForwardBackward` 的 β 递推索引错误——原为 `beta[T-2-t2]`，在每轮 `unshift` 后发生位移，导致 β_t 与后验概率错误。新增不变量 `Σ_s α_t(s)β_t(s) = P(O) 对全部 t 恒定`（Rabiner 1989 前后向一致性）当场捕获：修复前残差 **0.146**，修复后 **1.39e-17**。已改为取当前 `beta[0]`（即上一轮 unshift 进来的 β_{t+1}）
- **新增 12 项**（核心不变量 **226 → 238**，无头测试 236 → 248 项）：
  - **度量界**：`auc` 完美分离 = 1、完全逆序 = 0（精确 0）；`r2` 完全拟合 = 1（精确 0）
  - **数值稳定**：`logsumexp` 平移不变 LSE(x+c) = LSE(x)+c 且 1000 量级不溢出
  - **图模型**：`hmm` 前后向一致性（见上）；`eligibilityTrace` e_t = (γλ)^t 且 λ=0 退化为首项 one-hot（2.8e-17）
  - **强化学习**：`monteCarloReturn` 确定 MDP 折扣回报 ≡ 解析 Σγᵗr（6.3e-14）；`ppoClip` 截断目标恒为未裁剪目标的**悲观下界** L ≤ r·A，且越界处界精确生效 + 信任域幅值界
  - **统计/信息论**：`sampleStats` 标准正态 kurt ≈ 3、skew ≈ 0（6e4 样本，残差 0.011）；`channelCapacity` BSC 容量 = 1 − H₂(p)（bits，Arimoto–Blahut ≡ 解析，5.6e-17）
  - **结构无损**：`tensorGather`/`tensorScatter` 往返恒等；`bucketize` 桶数 = k、长度差 ≤ 1、拼接无损（精确 0）；`metropolisSample` 经验分布 → 目标分布（细致平衡，6e4 迭代残差 0.0032）
- **文档修正**：`channelCapacity` 头部注释单位由 nat 更正为 **bits**（返回值 `I / Math.LN2`，与 BSC 解析值 1−H₂(p) 吻合）
- 指标：verified **810/1024 不变**；核心不变量 **226 → 238/238**；无头 **248/248** · UI 冒烟 **26/26**；axiom.html 563.5 KB

## [1.3.0] - 2026-10-19

### 通用原地引擎第四轮扩面（INPLACE_SIG 53 → 70，verified 793 → 810）
- **自动化候选发掘**：新写候选探测器，从已验证的 `BATCH_SIG` 样本出发，对每个 spec `inplace` 算子自动检验「形状守恒 + 输出全有限 + 与 out-of-place 逐位一致」，200 条 spec 中筛出可原地化的非平凡算子（184 条被诚实排除：**75 条输出标量**（reduce/范数/行列式/秩类，天然不可原地）、**47 条含函数参数**（优化器 f/grad）、**62 条形状变换**（reshape/slice/flatten/concat/池化/采样类，输出形状 ≠ 输入形状）、14 条无批样本的系统语义系）
- **新增 17 条原地签名**（沙盒逐条验证，diff=0 且输出全有限）：
  - `LINALG.matmul`（方阵乘，pair）· `FWD.linear`（方阵权，triple）· `FWD.embedding_lookup`（pair）· `FWD.conv1d`（k=1 核，pair）
  - `INFO.surprisal` / `INFO.bits`（elem 逐元素）· `OPTIM.grad_clip`（pair）· `BWD.grad_layernorm`（triple）· `BWD.stop_grad` / `BWD.detach`（vec，语义即恒等透传）
  - `ATTEN.rope`（triple）· `ATTEN.mqa`（triple）· `ATTEN.gqa`（args）· `SAMPLE.topk` / `SAMPLE.topp`（pair）· `DATA.dedup`（vec）· `TENSOR.stack`（vec）
- **诚实边界**：`FWD.pool_max`（窗口=1 恒等）等纯构造性守恒已剔除，不因凑数牺牲语义纯度
- 指标：verified **793 → 810 / 1024**（inplace 56 → 73）；spec **231 → 214**；核心不变量 **226/226**；无头 **236/236** · UI 冒烟 **26/26**；axiom.html 559.6 KB；三表幽灵键 **0**（BATCH 242 / FUSE 239 / INPLACE 70 全部命中真实微指令）

## [1.2.7] - 2026-10-19

### 核心不变量扩容第四批（条件数 / 策略评估解析解 / 分块无关 / 结构定理）
- **新增 12 项**（核心不变量 **214 → 226**，无头测试 224 → 236 项），12/12 一次通过（沙盒预验证全绿）：
  - **数值线性代数**：`condEstimate` κ₂(A) = λmax/λmin（对称正定谱定义，与 Jacobi 解析解一致，残差 6.7e-16）；`orthonormalize` Gram–Schmidt 正交归一 QᵀQ = I（2.2e-16）；`spectralNorm` 谱归一化后主奇异值 = 1（Miyato 2018，幂迭代复算 1.6e-15）；`matrixRank` 秩-零度定理 rank(A) + dim N(A) = n（精确 0）
  - **强化学习解析解**：`policyEval` 迭代策略评估 ≡ 解析解 V = (I−γP_π)⁻¹ r_π（线性方程组交叉验证，8.9e-13）；`gae` λ=0 退化为 TD 残差 δ_t、λ=1 退化为 Monte-Carlo 优势（端点恒等式，精确 0）
  - **注意力与滤波**：`flashAttention` 分块大小无关——chunk=1/2/T ≡ 朴素 selfAttention（在线 softmax 逐位一致，1.1e-16）；`kalmanFilter1d` 卡尔曼增益收敛 ≡ Riccati 解析不动点（一维稳态解，精确 0）
  - **图模型 / NLP / 采样 / 树模型**：`hmmViterbi` DP 最优路径对数概率 ≡ 暴力枚举 2ᵀ 路径最大值（精确 0）；`bleu` 自比对 BLEU(ref, ref) = 1（上界精确）；`topP` 核采样支撑最小性（累计 ≥ cutoff 且去尾即 < cutoff）；`decisionTree` 无剪枝训练准确率 = 1（CART 叶纯度，Gini → 0）
- **文档数字修正**：README 参考文献年份在历次数字批量替换中被误伤（Dao (2142) / Press (2141) / Su (2141) / Ainslie (2143)），已修正为 2022 / 2021 / 2021 / 2023；后续数字同步改用精确锚点替换
- 指标：verified **793/1024 不变**；核心不变量 **214 → 226/226**；无头 **236/236** · UI 冒烟 **26/26**；axiom.html 557.9 KB

## [1.2.6] - 2026-10-19

### 核心不变量扩容第三批（谱定理 / 解析方差 / 结构律 / 复合律）
- **新增 12 项**（核心不变量 **202 → 214**，无头测试 212 → 224 项）：
  - **谱定理**：`trace` tr(A²) = Σλᵢ²（幂迹）；`eigen` 重构 A = Σλᵢ·vᵢvᵢᵀ ≤ 1e-10（最强分解一致性，行存储 vₖ = vectors[k]）
  - **解析方差**：`binomial` 样本方差 ≈ np(1−p)（n=10, p=0.5, 2e4 次）；`gumbel` 样本方差 ≈ π²/6（解析）
  - **度量结构律**：`editDistance` 三角不等式 d(a,c) ≤ d(a,b)+d(b,c)；`conv1d` 线性性 conv(αx+βy) = α·conv(x)+β·conv(y)；`kFold` 折规模 max−min ≤ 1
  - **注意力**：`qkDot` √d 缩放有效性——d=64 时未缩放点积方差 ≈ d 倍（缩放存在的定量证明）；`rope` 复合律 R_n(R_m x) = R_{m+n} x（旋转角可加）
  - **归一化/采样结构**：`batchnorm` 通道独立（改列 0 不影响列 1）；`td0` γ=0 退化结构（V 恰一处 = 1）；`dropout` 非零元素 = x/(1−p)（缩放精确）
- **两处检查修正**：① `jacobiEigen` 的 vectors 为行存储（vectors[k] = 第 k 特征向量），重构公式 vₖvₖᵀ 用 vectors[k][i]·vectors[k][j]；② `kFold(10,3)` 规模 4/3/3 差 1 是均衡正确行为，断言 `>1` 计失败
- 指标：verified **793/1024 不变**；核心不变量 **202 → 214/214**；无头 **224/224** · UI 冒烟 **26/26**；axiom.html 558.6 KB

## [1.2.5] - 2026-10-19

### 核心不变量扩容第二批（谱 / 结构 / 收敛 / 不等式 / 恒等式）
- **新增 12 项**（核心不变量 **190 → 202**，无头测试 200 → 212 项），12/12 一次通过：
  - **谱不变量**：`jacobi` Πλᵢ = det(A)
  - **统计学习结构**：`gmm` 责任度每行和=1 且混合权重和=1；`kmeans` 每点分配给最近中心（分配最优性）；`linreg` 含截距残差和=0（估计无偏性）
  - **注意力结构**：`attention` 因果掩码首行 = one-hot（只能看自己）
  - **图模型一致性**：`hmm` 前向终态 α_T 求和 = P(O)（对数域一致）
  - **动态规划性质**：`valueIteration` V 逐轮单调不减（压缩映射迭代性质，snapshots 快照验证）
  - **信息论不等式**：`kl` KL(p‖q) ≥ 0（Gibbs 不等式，四组网格）；`mutualInfo` I(X;Y) ≤ min(H(X),H(Y))
  - **信息论恒等式**：`js` JS = ½KL(p‖m) + ½KL(q‖m)
  - **结构守恒**：`rope` 旋转保范数 ‖R_m x‖ = ‖x‖；`grad_accum` 累加交换律（顺序无关）
- 指标：verified **793/1024 不变**；核心不变量 **190 → 202/202**；无头 **212/212** · UI 冒烟 **26/26**；axiom.html 554.5 KB

## [1.2.4] - 2026-10-19

### 核心不变量扩容（Invariant Expansion）
- **目标**：变体层可做项清零后转向深化——为关键算子补充第二/第三硬不变量（全部可独立复算）
- **新增 12 项**（核心不变量 **178 → 190**，无头测试 188 → 200 项）：
  - `matmul` 结合律 (AB)C = A(BC)；`inverse` 对合性 (A⁻¹)⁻¹ = A；`solve` ≡ A⁻¹b（三条路径互证）
  - `det` 转置不变 + det(I)=1 精确；`cholesky` L 严格下三角结构；`qr` R 严格上三角结构（分解结构不变量）
  - `softmax` 归一化和=1 + ±1e300 数值稳定；`sigmoid` σ(0)=0.5/值域/严格单调；`gaussPDF` 峰值 = 1/(σ√2π)
  - `gd` 凸二次损失逐帧单调不增；`layernorm` 仿射不变 LN(αx+β)=LN(x)（eps→0 极限）；`temperature` T→0⁺ 趋于 argmax one-hot、T→∞ 趋于均匀
- **检查设计教训（2 条过严被修正）**：① `sigmoid(50)` 浮点舍入恰为 1.0（1+e⁻⁵⁰ 不可区分）——值域应测闭区间 [0,1]；② layerNorm 的 eps=1e-5 在仿射放大后占比失衡——仿射不变是 eps→0 的极限性质，检查须用 eps=1e-12 + 容差 1e-9
- 指标：verified **793/1024 不变**（不变量扩容不改变微指令状态）；核心不变量 **178 → 190/190**；无头 **200/200** · UI 冒烟 **26/26**；axiom.html 551.1 KB

## [1.2.3] - 2026-10-19

### 最后批次 · BWD/RL 收官（Final Batch）
- **batched +12**（BATCH_SIG 230→242）：`NUMER.sqrt_guard`（elem）、`BWD.grad_clip`（pair，标量 maxNorm）、`BWD.grad_linear`（mlpGrad 参数对象 triple）、`BWD.grad_check`（args 4 参）、`BWD.grad_layernorm`（triple，1D 向量）、`BWD.chain_rule`（args，三函数用自包含字面量 DOUT/INNER/DIN）、`BWD.bptt`（rnnBPTT 标量核）、`RL.value_iter`/`RL.q_learn`/`RL.sarsa`（opts 对象 vec）、`RL.bellman_backup`（pair，MDP 对象）、`RL.policy_iter`（vec，MDP 对象）
- **fused 对齐 +12**（FUSE_SIG 227→239）
- **闭包对象序列化修复**：mdp（chainSetup 返回值）含闭包函数（trans/reward 捕获 stochastic），不可 String() 序列化——改为常量区构造 `MDP3/MDP4 = chainSetup(...)`，签名表引用标识符（与 mulberry32 工厂同模式）。注入器的 `sampleLit` 增加「对象标识符映射优先」分支（FNID.has 检查提前至函数判断前）
- **诚实保留（spec 231 条的构成）**：SYS 系统语义系 10 条（arena/barrier/cache/stream 等——批处理语义不适用于对象 API）、`PROB/SAMPLE.seed_repro`（mulberry32 返回函数，无张量语义）、`DATA.tokenize`（字符串）、`ATTEN.self_attn`/`DATA.onehot`（special 多返回类）、`RL.monte_carlo`（policy 函数参数）
- 指标：verified **770 → 793 / 1024**（+24：batched 230→242 / fused 229→240）；spec **254 → 231**；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 548.6 KB；三表幽灵键 0

## [1.2.2] - 2026-10-19

### 图推断 + 优化器批次（GRAPH & OPTIM Batch）
- **目标**：攻克最后两大族的批处理覆盖——GRAPH 15 条全部 + OPTIM 优化器系 11 条
- **GRAPH 15 条**（HMM 系样本重构）：`forward_backward`/`viterbi`/`belief_prop`/`variable_elim`/`map_query`（统一 pi/A/B/obs 四参结构，v1.1.7 的 E.fb 维度错误根源修复）、`junction_tree`（团树+RIP）、`condition`（条件查询）、`gibbs`/`mcmc`（平稳分布采样）、`particle`（自举滤波）、`kalman`（一维滤波）、`dsep`/`m_sep`（D/M-分离判定，dag 邻接对象）、`clique_tree`（团树校准，因子对象）、`factor_product`（因子乘积）
- **OPTIM 11 条**（修正参数顺序认知）：优化器签名实为 `(f, grad, x0, opts)`——f/grad 在前，v1.1.7 误将 `[fq,gq,{}]` 作 shared 追加至 x0 后导致 x0=函数而 `x0.slice` 炸；改为 args 类 `[FQ, GQ, x0, opts]`。覆盖 gd/adam/momentum/nesterov/adagrad/rmsprop/adamw/lbfgs/bfgs/cg/line_search
- **fused 对齐 +26**（FUSE_SIG 201→227）：新键全部补齐融合条目，通用引擎测试覆盖随之扩展
- 新增常量 `GQ`（凸二次梯度 `[2x₀, 2x₁]`）至签名表字面量区，与 FQ 配对服务优化器系样本
- 指标：verified **718 → 770 / 1024**（+52：batched 204→230 / fused 203→229）；spec **306 → 254**；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 540.3 KB；三表幽灵键 0

## [1.2.1] - 2026-10-19

### 修复批次 · 样本设计误杀修复（Fix Batch）
- **目标**：修复 v1.1.7 因样本括号层级/类型错误被沙盒误杀的算子——语义本身完全兼容批处理，是样本设计缺陷而非能力缺陷
- **根因复盘**（第三次同型错误，教训已固化）：① `hypot`/`div_guard` 的 pair 样本多包一层 batch 括号；② `surprisal`/`bits`/`gumbel` 是标量函数却设了 `vec` 类（应为 `elem` 类，样本为「数组的数组」）；③ `thompson`/`ppo`/`lr_decay` 等 triple 样本同样多包一层；④ `vjp`/`jvp` 的目标函数返回标量会使 `transpose(J)` 炸——改用向量输出函数 `FV`
- **batched +35**（BATCH_SIG 169→204，其中 4 条覆盖旧条目）：NUMER.hypot/div_guard、PROB.bayes/condition/mv_gauss、INFO.surprisal/bits/channel_capacity/rate_distortion/max_entropy、FWD.layernorm（2D 样本）、NORM.spectral_norm/label_smooth/mixup/early_stop、SAMPLE.gumbel/rejection/inverse_cdf、RL.thompson/advantage/gae/reinforce/ppo/ucb/greedy、OPTIM.lr_decay/weight_decay/polyak、BWD.grad_softmax_ce/stop_grad/detach/jacobian/vjp/jvp/grad_accum、ATTEN.cross_attn/kv_cache/flash、DATA.normalize_fit、LINALG.pca（补 k 参）
- **fused 对齐 +35**（FUSE_SIG 166→201）：新 batched 键全部补齐融合条目
- **函数字面量规范落地**：`jacobian`/`vjp`/`jvp`/`rejection`/`inverse_cdf` 的样本函数改为自包含字面量（FQ/FV/GAUSS/UNIF/CDFID，注入第 13 节前常量区），彻底告别 v1.1.9 的闭包序列化问题
- 指标：verified **648 → 718 / 1024**（+70：batched 169→204 / fused 168→203）；spec **376 → 306**；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 531.1 KB；三表幽灵键 0

## [1.2.0] - 2026-10-19

### 变体层扩面 · 消化 spec（Variant Layer Scale-Out）
- **盘点结论**：base 层 255/256 已满（仅 SYS.fence 诚实保留），spec 主体在变体层；本版按「首参写回 / 批维独立 / 尾算子融合」三语义继续消化
- **inplace +10**（INPLACE_SIG 43→53）：`sqrt_guard`（elem）、`grad_softmax_ce`（梯度同形）、`qk_dot`（方阵打分）、`solve`（解向量同 b）、`bayes`（后验同先验）、`reinforce`（策略梯度）、`gae`（优势估计）、`broadcast`（恒等深拷贝）、`scatter`（同形散布）、`weight_norm`（同形缩放）
- **batched +10**（BATCH_SIG 159→169）：`ATTEN.scale`/`ATTEN.alibi`（标量缩放参数，修正 v1.1.7 误用矩阵参数的 NaN 样本）、`ATTEN.rope`（逐 token 旋转）、`ATTEN.mqa`/`ATTEN.gqa`（多头同形输出）、`SAMPLE.topp`（核采样截断同长）、`METRIC.logloss`/`METRIC.perplexity`（逐样本标量）、`DATA.map`（1D 样本 + 映射函数，修正 v1.1.7 二维样本 NaN）、`NORM.weight_norm`
- **fused 对齐 +10**（FUSE_SIG 156→166）：新 batched 键全部补齐融合条目（post 统一 `Math.abs`），通用引擎测试覆盖随之扩展
- **诚实甄别（不计入）**：`eligibilityTrace(T,...)` 的 T 为整数长度、`ppoClip` 为标量级（inplace 首参须为目的地张量）；对象多返回类（`jacobian`/`vjp`/`jvp`/`grad_matmul`/优化器状态等）形状守恒不适用——全部保留 spec
- 指标：verified **618 → 648 / 1024**（+30：inplace 46→56 / batched 159→169 / fused 158→168）；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 520.6 KB；三表幽灵键 0

## [1.1.9] - 2026-10-19

### 融合对齐扩面（FUSE_SIG 全谱对齐 BATCH_SIG）
- **目标**：`FUSE_SIG` 与 `BATCH_SIG` 键集完全对齐——任何可批处理的算子即可融合，两表语义互补
- `FUSE_SIG` **140 → 156 条**（新增 16 条：softmax/linear/grad_tanh/cross_entropy/gauss_pdf/mse/matvec/lstsq/grad_clip/reduce_all/marginal/epsilon_greedy/categorical/topk/transpose/normalize_l2；尾算子统一 `Math.abs`）
- 甄别与剔除：`ATTEN.self_attn`/`DATA.onehot` 为 special 多返回类（无逐 item 融合语义）、`DATA.label_encode` 输出含字符串——诚实排除；16 条候选沙盒 45 个 item 全部通过 `fused ≡ Math.abs ∘ op`（≤1e-15）
- **注册表标记诚实说明**：13 条的 fused 变体按"具名优先"由 v1.1.3 强不变量具名内核接管（如 softmax→`fused_softmax_log`、linear→`fused_linear_relu`、topk→`fused_topk_temp`），净增 verified **+3**（lstsq/epsilon_greedy/categorical）；`FUSE_SIG` 条目仍全部参与 `variant.fused` 通用引擎聚合测试——通用引擎与具名内核双轨覆盖
- 修复：`RL.epsilon_greedy` 的随机源闭包不可跨作用域序列化，改用与 BATCH_SIG 一致的 `mulberry32(99)` 工厂调用（签名表值必须为字面量或作用域内标识符——新增注入铁律）
- 指标：verified **615 → 618 / 1024**；fused 层 **155 → 158**（142 引擎 + 16 具名）；`FUSE_SIG`/`BATCH_SIG` 键集差 = 3（2 special + 1 字符串，全部为诚实排除）；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 516.9 KB

## [1.1.8] - 2026-10-19

### 通用原地引擎规模化扩面（Generic Inplace Engine Scale-Out）
- **目标**：把 `inplace` 引擎从"17 个单输入算子"扩到全谱——引擎统一为「首参 dst 写回」，签名表驱动
- `inplace()` 引擎升级（4 行统一化）：`elem` 类新增可选 `extra` 标量参数（逐元素 `f(x, ...extra)`，如截断 clip(x, lo, hi)）；`vec / pair / triple / args` 统一走「首参 dst 写回 + `s.extra` 传参」，多输入算子（残差加、层归一化、批归一化、组归一化、谱归一化、温度采样、梯度裁剪、相对位置偏置、ALiBi、洗牌、Mixup、权重衰减、Dropout）无需包装函数即可原地化
- `INPLACE_SIG` **17 → 43 条**（新增 26 条，覆盖 NUMER/INFO/TENSOR/SYS/FWD/BWD/NORM/ATTEN/SAMPLE/DATA/OPTIM 共 11 族）
- `variant.inplace` 聚合检查朴素参照路径同步升级（elem+extra / 多输入 apply 分支），覆盖守卫 10 → 25
- **样本质量闭环**：26 条新签名全部经沙盒逐条验证（引擎逻辑复刻 + `inplace ≡ out-of-place` ≤1e-15 + 无异常），26/26 一次通过后生成器整块写入
- 指标：verified **589 → 615 / 1024**（+26）；inplace 层 **20 → 46**（43 引擎 + 3 具名）；核心不变量 **178/178**；无头 **188/188** · UI 冒烟 **26/26**；axiom.html 514.8 KB
- 诚实说明：多输入原地语义为「首参 dst 写回」——`_writeBack` 要求输出与 dst 形状严格一致，形状变化类算子（pad/truncate/gather/zip 等）诚实排除；采样类 refill（uniform/normal 等以 n 为首参）语义不符同样排除

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
