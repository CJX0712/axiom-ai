# AXIOM 验证报告（VERIFICATION）

> 本文件由 `node tools/gen-verification.js` 从真实运行结果生成，请勿手改。
> 运行方式：`node test/run.js`（Node 22 实测，零依赖，确定性种子，可复现）
> 结果：**核心不变量 341/341 PASS · 注册表完整性 10/10 PASS · 总计 351/351 全绿**

## 1. 核心不变量全表（实测残差）

残差列为 `node test/run.js` 真实输出；容差为该项设计的验收阈值。

| 状态 | 检查项（不变量） | 实测残差 | 容差 |
|---|---|---|---|
| ✅ | matmul：(AB)ᵀ = BᵀAᵀ（逐位一致） | 0 | 0 |
| ✅ | cholesky：‖LLᵀ − A‖∞ ≤ 1e-10 | 2.22e-16 | 1.00e-10 |
| ✅ | qr：QᵀQ = I 且 ‖QR − A‖ ≤ 1e-10 | 8.88e-16 | 1.00e-10 |
| ✅ | jacobi：‖Sv − λv‖ ≤ 1e-12 且特征向量正交归一 | 7.11e-15 | 1.00e-12 |
| ✅ | jacobi：Σλ = tr(A)（谱不变量） | 1.42e-14 | 1.00e-10 |
| ✅ | power：主特征值与 Jacobi 一致 ≤ 1e-9 | 2.56e-14 | 1.00e-9 |
| ✅ | solve：‖Ax − b‖ ≤ 1e-12·‖A‖‖x‖ | 5.05e-17 | 1.00e-12 |
| ✅ | inverse：‖AA⁻¹ − I‖∞ ≤ 1e-10 | 2.22e-16 | 1.00e-10 |
| ✅ | det：det(AB) = det(A)·det(B) | 0 | 1.00e-12 |
| ✅ | trace：tr(AB) = tr(BA) | 0 | 1.00e-12 |
| ✅ | pca：Eckart–Young 秩-k 重构残差 = (n−1)Σ_{i>k}λᵢ | 4.96e-16 | 1.00e-8 |
| ✅ | pca：特征向量正交归一（VᵀV = I） | 1.11e-15 | 1.00e-12 |
| ✅ | gmm：EM 对数似然单调不减 | 1.41e-14 | 1.00e-8 |
| ✅ | logistic：交叉熵损失单调不增 | 0 | 1.00e-9 |
| ✅ | linreg：正规方程残差 Xᵀ(y − Xŵ) ≈ 0 | 8.74e-16 | 1.00e-8 |
| ✅ | mlp：梯度检验 maxRelErr ≤ 1e-6（中心差分 vs 解析） | 5.01e-10 | 1.00e-6 |
| ✅ | kmeans：SSE 逐轮单调不增 | 0 | 1.00e-9 |
| ✅ | knn：k=1 训练集误差为 0 | 0 | 0 |
| ✅ | tree：CART 根节点 Gini 下降 > 0 且训练准确率 100% | 0 | 1.00e-9 |
| ✅ | logsumexp：= logΣeˣ 且 ±1e300 不溢出 | 0 | 1.00e-12 |
| ✅ | softmax：平移不变（+1000 后逐元素一致） | 4.36e-15 | 1.00e-12 |
| ✅ | sigmoid：σ(−x) = 1 − σ(x) | 1.39e-16 | 1.00e-15 |
| ✅ | gelu：xΦ(x)∈[min(0,x),max(0,x)]；全局最小≈−0.16997@x≈−0.75；gelu(0)=0；gelu(6)≈6 | 1.84e-6 | 1.00e-5 |
| ✅ | kahan：病态序列（1e16,1,1,−1e16）精确和=2，朴素和=0 | 0 | 1.00e-9 |
| ✅ | gaussPDF：∫pdf = 1（Simpson 10 万区间） | 3.45e-14 | 1.00e-10 |
| ✅ | normalCDF：Φ(−x)=1−Φ(x)；Φ(1.96)≈0.975002；Φ(0)=0.5 | 6.90e-8 | 1.00e-5 |
| ✅ | normalSample：Box–Muller n=1e5 矩估计（|mean|≤0.01, |σ−1|≤0.01） | 2.33e-3 | 1.00e-2 |
| ✅ | categoricalSample：频率 ≈ p（n=2e4，max≤0.01） | 6.30e-3 | 1.00e-2 |
| ✅ | bayes：后验和=1；先验[.5,.5]×似然[.9,.1]=[.9,.1] | 0 | 1.00e-15 |
| ✅ | entropy：0≤H≤log₂n；均匀取等；确定分布为 0 | 0 | 1.00e-15 |
| ✅ | crossEntropy：H(p,q) ≥ H(p)，p=q 时取等 | 0 | 1.00e-15 |
| ✅ | kl：p=q 为 0；kl([.5,.5]‖[.25,.75])=0.20751874964 | 1.39e-16 | 1.00e-12 |
| ✅ | js：对称且 ∈[0,1] | 0 | 1.00e-15 |
| ✅ | mutualInfo：独立为 0；完全相关 = H(X) | 0 | 1.00e-12 |
| ✅ | conditionalEntropy：H(X|Y) = H(X,Y) − H(Y) | 0 | 1.00e-12 |
| ✅ | infoGain：纯分裂 = 1 bit；恒 ≥ −1e-15 | 0 | 1.00e-12 |
| ✅ | gini：[0,0,1,1]=0.5；纯类为 0 | 0 | 1.00e-15 |
| ✅ | gd：凸二次收敛至解析最优 ≤ 1e-7 | 5.55e-15 | 1.00e-7 |
| ✅ | adam：凸二次收敛至解析最优 ≤ 1e-5 | 0 | 1.00e-5 |
| ✅ | cg：SPD 系统 ≤ n 步收敛，残差 ≤ 1e-10 | 1.07e-16 | 1.00e-10 |
| ✅ | layernorm：行均值≈0、方差≈1 | 1.93e-6 | 1.00e-4 |
| ✅ | attention：权重行和=1；因果掩码上三角严格为 0 | 0 | 1.00e-14 |
| ✅ | temperature：T 下降 → 熵下降 | 0 | 1.00e-12 |
| ✅ | topk：支撑外严格为 0；支撑上归一化和=1 | 0 | 1.00e-15 |
| ✅ | hmm：前向-后验每帧和=1；P(O) 与 256 路径全枚举一致 | 1.93e-16 | 1.00e-10 |
| ✅ | hmm：Viterbi 路径 = 全枚举最优路径 | 0 | 1.00e-9 |
| ✅ | valueIteration：Bellman 残差 ≤ 1e-10；解析解 V(s)=10·γ^max(0,n−2−s) | 8.20e-13 | 1.00e-8 |
| ✅ | td0：α=1 确定性链一步后向扫描 = 解析解 γ^d | 1.11e-16 | 1.00e-12 |
| ✅ | qLearning：训练后贪心策略到达目标率 ≥ 0.9 | 0 | 1.00e-1 |
| ✅ | epsilonGreedy：ε=0 时严格取 argmax | 0 | 0 |
| ✅ | classification metrics：accuracy/precision/recall/f1 公式一致 | 0 | 1.00e-15 |
| ✅ | auc：完美分离=1；A(y,s)=1−A(y,−s) | 0 | 1.00e-15 |
| ✅ | r2：完美拟合=1；均值预测≈0 | 0 | 1.00e-12 |
| ✅ | cosine：cos(x,x)=1；正交基精确为 0；|cos|≤1 | 1.11e-16 | 1.00e-15 |
| ✅ | editDistance：d(kitten,sitting)=3；对称；d("",abc)=3 | 0 | 0 |
| ✅ | silhouette：∈[−1,1]；分离簇 > 0.5 | 0 | 1.00e-15 |
| ✅ | shuffle：多重集守恒且非恒等 | 0 | 0 |
| ✅ | trainTestSplit：规模和、无交集 | 0 | 0 |
| ✅ | kFold：并集=全集、两两不交 | 0 | 0 |
| ✅ | oneHot：行和=1、维度=类数 | 0 | 0 |
| ✅ | arena：分配区间两两不交；越界抛错；reset 复用 | 0 | 0 |
| ✅ | reduceAll：= Kahan 精确和（朴素求和损失全部有效位） | 0 | 1.00e-9 |
| ✅ | broadcast：恒等映射（深拷贝） | 0 | 0 |
| ✅ | mulberry32：同种子 → 同序列（可复现） | 0 | 0 |
| ✅ | tensor.create：元素总数 = ∏ shape | 0 | 0 |
| ✅ | tensor.zeros/ones：全部元素 = 0 / 1 | 0 | 0 |
| ✅ | tensor.arange：步长一致；末值 < stop | 0 | 0 |
| ✅ | tensor.reshape：元素守恒，行优先顺序不变 | 0 | 0 |
| ✅ | tensor.transpose：T(T(A)) = A | 0 | 0 |
| ✅ | tensor.slice/concat/stack/split：长度语义精确 | 0 | 0 |
| ✅ | tensor.cast/copy/gather/scatter/fill：语义精确 | 0 | 0 |
| ✅ | tensor.flatten：行优先展开，元素守恒 | 0 | 0 |
| ✅ | numer.expm1/log1p：小 x 相对误差 ≤ 1e-15（优于朴素 exp−1） | 8.27e-18 | 1.00e-15 |
| ✅ | numer.hypot：大参数不溢出；hypot(3,4) = 5 | 0 | 0 |
| ✅ | numer.div_guard：|分母| < ε 时按 ε 处理，结果有限 | 0 | 0 |
| ✅ | numer.sqrt_guard：负输入抛错 | 0 | 0 |
| ✅ | numer.reciprocal：x·(1/x) ≈ 1 | 0 | 1.00e-15 |
| ✅ | numer.fma：Dekker 单次舍入（朴素双舍入失败案例精确复原） | 1.02e-16 | 1.00e-13 |
| ✅ | prob.bernoulli：频率 ≈ p（n=2e4） | 1.60e-3 | 1.00e-2 |
| ✅ | prob.binomial：均值 = np（trials=5000） | 5.20e-2 | 8.00e-2 |
| ✅ | prob.uniform：∈ [0,1)；均值 ≈ 0.5；同种子同序列 | 1.71e-5 | 1.00e-2 |
| ✅ | prob.marginal/condition：边缘 = 联合求和；P(A|B)·P(B) = P(A,B) | 5.55e-17 | 1.00e-15 |
| ✅ | prob.mv_gauss：2D Simpson ∫pdf = 1；峰值为 1/(2π|Σ|^½)；对称 | 1.04e-7 | 1.00e-6 |
| ✅ | info.perplexity/surprisal/bits：公式一致 | 0 | 1.00e-15 |
| ✅ | info.kl_reverse：KL(p‖q) ≠ KL(q‖p)（非对称性） | 0 | 1.00e-12 |
| ✅ | info.max_entropy：均匀分布熵最大（n=3 网格暴力验证） | -1.40e-2 | 1.00e-12 |
| ✅ | info.normalize_dist：Σp = 1 且比例守恒 | 0 | 1.00e-15 |
| ✅ | optim.momentum：凸二次收敛至解析最优 ≤ 1e-8 | 2.22e-16 | 1.00e-8 |
| ✅ | optim.nesterov：凸二次收敛至解析最优 ≤ 1e-8 | 0 | 1.00e-8 |
| ✅ | optim.rmsprop：凸二次收敛至解析最优 ≤ 1e-3（小 lr 抑制振荡） | 0 | 1.00e-3 |
| ✅ | optim.adagrad：凸二次收敛至解析最优 ≤ 1e-3 | 1.11e-16 | 1.00e-3 |
| ✅ | optim.adamw：λ=0 退化为 Adam（凸二次收敛 ≤ 1e-5） | 0 | 1.00e-5 |
| ✅ | optim.adamw：零梯度步 = 解耦衰减 w(1−lr·λ)（精确） | 0 | 0 |
| ✅ | optim.grad_clip：裁剪后 ‖g‖ = max_norm 且方向保持 | 0 | 1.00e-15 |
| ✅ | optim.grad_norm/lr_decay/weight_decay/polyak：公式精确 | 0 | 0 |
| ✅ | optim.polyak：GD 迭代平均收敛至解析最优 | 3.75e-14 | 1.00e-8 |
| ✅ | fwd.tanh：奇函数；|tanh| ≤ 1 | 0 | 1.00e-16 |
| ✅ | fwd.embedding_lookup：输出 = 第 i 行向量（深拷贝隔离） | 0 | 0 |
| ✅ | fwd.residual_add：x + f(x) 逐元素且形状不变 | 0 | 0 |
| ✅ | fwd.split/concat_heads：split(concat(X)) = X 逐位一致 | 0 | 0 |
| ✅ | fwd.pool_max：输出 = 窗内最大值 | 0 | 0 |
| ✅ | fwd.batchnorm：批均值 ≈ 0、批方差 ≈ 1 | 9.71e-17 | 1.00e-9 |
| ✅ | fwd.dropout：期望不变性（2e4 种子平均 ≈ x）；同种子同掩码 | 4.27e-3 | 4.00e-2 |
| ✅ | fwd.conv1d：输出长度 = ⌈(L+2p−k)/s⌉+1；差分核精确 | 0 | 0 |
| ✅ | bwd.grad_relu/grad_tanh：与中心差分一致 ≤ 1e-6 | 8.23e-11 | 1.00e-6 |
| ✅ | bwd.grad_softmax_ce：= p − y 且梯度和 = 0 | 1.04e-16 | 1.00e-15 |
| ✅ | bwd.grad_matmul：dL/dA = dL·Bᵀ（数值差分验证） | 5.37e-10 | 1.00e-6 |
| ✅ | bwd.chain_rule：d/dx f(g(x)) = f′(g(x))·g′(x)（差分验证） | 4.34e-11 | 1.00e-6 |
| ✅ | bwd.jacobian：数值 Jacobian 与解析一致 ≤ 1e-5 | 2.47e-10 | 1.00e-5 |
| ✅ | bwd.vjp/jvp：对偶恒等式 ⟨Jv,u⟩ = ⟨v,Jᵀu⟩ ≤ 1e-8 | 0 | 1.00e-8 |
| ✅ | bwd.grad_accum：Σ 批次梯度 = 全量梯度 ≤ 1e-10 | 3.55e-15 | 1.00e-10 |
| ✅ | bwd.bptt：时间反向传播梯度 = 中心差分 ≤ 1e-6 | 3.40e-11 | 1.00e-6 |
| ✅ | bwd.stop_grad/detach：返回深拷贝，原值隔离 | 0 | 0 |
| ✅ | norm.l1_reg/label_smooth/mixup：公式精确 | 0 | 0 |
| ✅ | norm.weight_norm：‖g·v/‖v‖‖ = g | 4.44e-16 | 1.00e-12 |
| ✅ | norm.spectral_norm：幂迭代归一后 σ(W) ≈ 1 | 4.44e-16 | 1.00e-6 |
| ✅ | norm.group_norm：组内均值 0、方差 1 | 0 | 1.00e-8 |
| ✅ | norm.early_stop：best = argmin；stopIndex = best + patience | 0 | 0 |
| ✅ | atten.qk_dot/scale：scores = QKᵀ/√d（手工基准） | 0 | 1.00e-15 |
| ✅ | atten.cross_attn：权重行和 = 1；形状 = [Tq][dv] | 0 | 1.00e-14 |
| ✅ | atten.multi_head：H=1 等价自注意力；逐头独立重算一致 ≤ 1e-12 | 0 | 1.00e-12 |
| ✅ | atten.rope：⟨R_m q, R_n k⟩ 只依赖 m−n | 1.11e-16 | 1.00e-12 |
| ✅ | atten.kv_cache：增量单步 = 全量重算 ≤ 1e-12 | 0 | 1.00e-12 |
| ✅ | atten.mqa/gqa：K/V 共享语义与分组语义一致 ≤ 1e-12 | 0 | 1.00e-12 |
| ✅ | atten.rel_pos/alibi：偏置可加；惩罚随距离线性 | 0 | 1.00e-15 |
| ✅ | atten.attn_entropy：∈ [0, log n]；均匀行 = log n | 0 | 1.00e-15 |
| ✅ | atten.flash：分块在线 softmax = 全量自注意力（chunk=1/2/3/7） | 1.67e-16 | 1.00e-12 |
| ✅ | sample.gumbel：G = −log(−log u)；均值 ≈ γ（n=2e4） | 8.24e-3 | 2.00e-2 |
| ✅ | sample.topp：最小支撑；质量 ≈ cutoff；归一化和 = 1 | 0 | 1.00e-15 |
| ✅ | sample.multinomial：计数和 = n（精确）；频率 ≈ p ≤ 0.03 | 9.75e-4 | 3.00e-2 |
| ✅ | sample.rejection：接受率 = 1/M；分箱频率 ≈ 目标密度积分 | 6.85e-3 | 1.00e-2 |
| ✅ | sample.inverse_cdf：F(F⁻¹(u)) = u（指数分布 λ=1.5） | 1.11e-16 | 1.00e-9 |
| ✅ | sample.antithetic：对偶负相关（解析精确）；方差缩减 | 0 | 0 |
| ✅ | sample.stratified：样本落入对应层；均值 ≈ 0.5 | 4.10e-6 | 5.00e-3 |
| ✅ | sample.systematic：等间距 1/n；起点 ∈ [0, 1/n) | 9.37e-17 | 1.00e-15 |
| ✅ | graph.belief_prop：链式 BP = 前向-后向（P(O) 与逐帧后验一致） | 0 | 1.00e-12 |
| ✅ | graph.variable_elim：= 2⁸ 路径全枚举 ≤ 1e-12 | 3.96e-16 | 1.00e-12 |
| ✅ | graph.factor_product：维度 = 变量并集；取值精确 ≤ 1e-15 | 0 | 1.00e-15 |
| ✅ | graph.junction_tree/clique_tree：RIP 判定；校准一致 | 0 | 1.00e-12 |
| ✅ | graph.kalman：稳态方差 = Riccati 解析解 ≤ 1e-9 | 0 | 1.00e-9 |
| ✅ | graph.dsep：路径枚举 = 联合分布暴力条件独立检验 | 0 | 0 |
| ✅ | graph.m_sep：道德图判据 = D-分离判定（菱形 BN 全枚举） | 0 | 0 |
| ✅ | graph.particle：权重和 = 1；后验均值 ≈ 前向-后向（n=2000） | 1.10e-1 | 1.50e-1 |
| ✅ | rl.bellman_backup：压缩映射 ‖T(V)−T(V′)‖ ≤ γ‖V−V′‖ | -1.69e+0 | 1.00e-12 |
| ✅ | rl.policy_iter：收敛至值迭代最优解；V 逐轮单调不减 | 5.35e-13 | 1.00e-8 |
| ✅ | rl.sarsa：训练后贪心策略到达目标率 ≥ 0.9 | 0 | 1.00e-1 |
| ✅ | rl.td_lambda：资格迹 = (γλ)^t（精确） | 3.47e-18 | 1.00e-12 |
| ✅ | rl.monte_carlo：随机策略回报均值 = 策略评估解（无偏） | 1.31e-2 | 5.00e-2 |
| ✅ | rl.ucb：未拉臂优先；同计数取高值；加分项可翻转排序 | 0 | 0 |
| ✅ | rl.gae：λ=0 → TD 残差；λ=1 → 蒙特卡洛优势（精确） | 4.44e-16 | 1.00e-12 |
| ✅ | rl.reinforce：策略梯度估计无偏（E[∇] = 解析值 ≤ 0.02） | 3.81e-4 | 2.00e-2 |
| ✅ | rl.ppo：截断目标公式精确（三种区间） | 0 | 0 |
| ✅ | rl.thompson：Beta(2,3) 后验频率 ≈ α/(α+β)（n=4000） | 2.68e-3 | 2.00e-2 |
| ✅ | metric.perplexity：= exp(logloss)（精确） | 0 | 1.00e-15 |
| ✅ | metric.bleu：已知值 0.5976；自译 = 1；短译 BP < 1 | 0 | 1.00e-12 |
| ✅ | metric.map：AP = Σ P(k)·Δr(k)（手工基准） | 0 | 1.00e-15 |
| ✅ | metric.confusion：行和 = 类别真实数；对角线 = 正确数 | 0 | 0 |
| ✅ | data.label_encode/pad/truncate/bucket/dedup：结构不变量 | 0 | 0 |
| ✅ | data.filter/map/zip/batch/tokenize：语义精确 | 0 | 0 |
| ✅ | data.normalize_fit：测试集用训练集统计量（防泄漏） | 0 | 1.00e-12 |
| ✅ | data.augment：保形状、同种子可复现、值被扰动 | 0 | 0 |
| ✅ | sys.gather/scatter/cache/ref_count：集合语义精确 | 0 | 0 |
| ✅ | sys.stream/checkpoint/profile/trace/dispatch/barrier：系统语义 | 0 | 0 |
| ✅ | sys.prefetch：深拷贝，无语义改变 | 0 | 0 |
| ✅ | linalg.rank/nullspace：秩精确；零空间维数 = 列数−秩；基满足 Ax = 0 | 0 | 1.00e-12 |
| ✅ | linalg.orthonormalize/cond：QᵀQ = I；κ(diag(1,10)) = 10；κ ≥ 1 | 5.28e-16 | 1.00e-9 |
| ✅ | prob.sample_stats：方差 = E[X²]−E[X]²（精确）；矩估计收敛 | 3.76e-2 | 1.00e-1 |
| ✅ | info.channel_capacity：BSC(0.1) 容量 = 1−H(ε) = 0.531 bits；≥ 网格暴力解 | 1.11e-16 | 1.00e-6 |
| ✅ | optim.line_search：Armijo 充分下降成立；GD+线搜索收敛至解析最优 | 2.59e-8 | 1.00e-6 |
| ✅ | optim.bfgs：凸二次 ≤30 步收敛 ≤1e-8；H 近似 SPD；H ≈ A⁻¹（相对 Frobenius） | 1.51e-3 | 1.00e-2 |
| ✅ | optim.lbfgs：两循环递归凸二次 ≤30 步收敛 ≤1e-8；内存 ≤ m | 5.81e-13 | 1.00e-2 |
| ✅ | bwd.grad_layernorm：解析梯度 = 数值 Jacobian ≤ 1e-6 | 7.74e-11 | 1.00e-6 |
| ✅ | graph.gibbs：平稳分布 = 解析解 [0.6, 0.4]（n=4e4） | 2.05e-4 | 2.00e-2 |
| ✅ | graph.mcmc：Metropolis 经验分布 ≈ 目标分布（n=4e4） | 3.95e-3 | 2.00e-2 |
| ✅ | info.rate_distortion：R(D) = ½log₂(σ²/D)；已知值；单调不增 | 0 | 1.00e-12 |
| ✅ | variant.batched：通用批处理引擎 — batched 路径 ≡ 逐样本朴素路径（全族批兼容算子，逐位一致） | 0 | 1.00e-15 |
| ✅ | variant.inplace：通用原地引擎 — inplace 路径 ≡ out-of-place（全族原地兼容算子，逐位一致） | 0 | 1.00e-15 |
| ✅ | variant.fused：通用 Epilogue 融合引擎 — fused ≡ post ∘ op（不物化中间张量）＋16 族代表算子融合 | 0 | 1.00e-15 |
| ✅ | trace：幂迹谱定理 tr(A²) = Σλᵢ² | 1.07e-14 | 1.00e-9 |
| ✅ | eigen：重构 A = Σλᵢ·vᵢvᵢᵀ（最强分解一致性，行存储） | 1.78e-15 | 1.00e-10 |
| ✅ | binomial：样本方差 ≈ np(1−p)（解析 n=10, p=0.5） | 8.95e-3 | 8.00e-2 |
| ✅ | gumbel：样本方差 ≈ π²/6（解析） | 4.35e-2 | 6.00e-2 |
| ✅ | editDistance：三角不等式 d(a,c) ≤ d(a,b) + d(b,c) | 0 | 0 |
| ✅ | conv1d：线性性 conv(αx+βy) = α·conv(x) + β·conv(y) | 0 | 1.00e-12 |
| ✅ | rope：复合律 R_n(R_m x) = R_{m+n} x（旋转角可加） | 2.22e-16 | 1.00e-12 |
| ✅ | qkDot：√d 缩放有效性（未缩放方差 ≈ d 倍） | 0 | 2.00e+1 |
| ✅ | batchnorm：通道独立（改列 0 不影响列 1 输出） | 0 | 0 |
| ✅ | kFold：折规模均衡（max−min ≤ 1） | 0 | 0 |
| ✅ | td0：γ=0 退化为立即结构（V 恰一处 = 1，其余 = 0） | 0 | 0 |
| ✅ | dropout：非零元素 = x/(1−p)（缩放精确） | 0 | 0 |
| ✅ | jacobi：谱不变量 Πλᵢ = det(A) | 3.55e-15 | 1.00e-9 |
| ✅ | linreg：含截距残差和 = 0（估计无偏性） | 3.55e-15 | 1.00e-9 |
| ✅ | gmm：责任度每行和 = 1 且混合权重和 = 1（结构不变量） | 0 | 1.00e-12 |
| ✅ | kmeans：每点分配给最近中心（分配最优性） | 0 | 0 |
| ✅ | attention：因果掩码首行 = one-hot（只能看自己） | 0 | 1.00e-12 |
| ✅ | hmm：前向终态 α_T 求和 = P(O)（对数域一致） | 2.78e-17 | 1.00e-10 |
| ✅ | valueIteration：V 逐轮单调不减（压缩映射迭代性质） | 0 | 0 |
| ✅ | kl：KL(p‖q) ≥ 0（Gibbs 不等式，四组网格） | 0 | 1.00e-12 |
| ✅ | js：JS = ½KL(p‖m) + ½KL(q‖m)（恒等式） | 0 | 1.00e-12 |
| ✅ | mutualInfo：I(X;Y) ≤ min(H(X), H(Y)) | 0 | 1.00e-12 |
| ✅ | rope：旋转保范数 ‖R_m x‖ = ‖x‖ | 8.88e-16 | 1.00e-12 |
| ✅ | grad_accum：累加交换律（顺序无关） | 0 | 1.00e-12 |
| ✅ | matmul：结合律 (AB)C = A(BC)（逐位一致） | 0 | 1.00e-12 |
| ✅ | inverse：对合性 (A⁻¹)⁻¹ = A | 2.22e-16 | 1.00e-12 |
| ✅ | solve：x ≡ A⁻¹b（与逆矩阵路径逐位一致） | 2.78e-17 | 1.00e-12 |
| ✅ | det：转置不变 det(Aᵀ) = det(A) 且 det(I) = 1 精确 | 0 | 0 |
| ✅ | cholesky：L 严格下三角且对角元 > 0 | 0 | 0 |
| ✅ | qr：R 严格上三角（下三角全零） | 0 | 0 |
| ✅ | softmax：归一化和 = 1 且 ±1e300 数值稳定 | 1.11e-16 | 1.00e-12 |
| ✅ | sigmoid：σ(0) = 0.5 精确；值域 ⊆ (0,1)；严格单调 | 0 | 0 |
| ✅ | gd：凸二次损失逐帧单调不增 | 0 | 0 |
| ✅ | layernorm：仿射不变 LN(αx+β) = LN(x)（eps→0 极限） | 4.03e-13 | 1.00e-9 |
| ✅ | temperature：T→0⁺ 趋于 argmax one-hot；T→∞ 趋于均匀 | 3.33e-7 | 1.00e-6 |
| ✅ | gaussPDF：峰值 = 1/(σ√2π)（解析精确） | 0 | 1.00e-15 |
| ✅ | condEstimate：κ₂(A) = λmax/λmin（对称正定谱定义，与 Jacobi 解析解一致） | 6.66e-16 | 1.00e-9 |
| ✅ | policyEval：迭代策略评估 ≡ 解析解 V = (I−γP_π)⁻¹ r_π（线性方程组交叉验证） | 8.86e-13 | 1.00e-11 |
| ✅ | flashAttention：分块大小无关 — chunk=1/2/T ≡ 朴素 selfAttention（在线 softmax 逐位一致） | 1.11e-16 | 1.00e-12 |
| ✅ | orthonormalize：Gram–Schmidt 正交归一 QᵀQ = I | 2.22e-16 | 1.00e-12 |
| ✅ | hmmViterbi：DP 最优路径对数概率 ≡ 暴力枚举 2ᵀ 路径最大值 | 0 | 1.00e-12 |
| ✅ | matrixRank：秩-零度定理 rank(A) + dim N(A) = n | 0 | 0 |
| ✅ | spectralNorm：谱归一化后主奇异值 = 1（Miyato 2018，幂迭代复算） | 1.55e-15 | 1.00e-9 |
| ✅ | topP：核采样支撑最小性 — 累计 ≥ cutoff 且去尾元素即 < cutoff | 0 | 0 |
| ✅ | gae：λ=0 退化为 TD 残差 δ_t；λ=1 退化为 Monte-Carlo 优势（端点恒等式） | 0 | 1.00e-12 |
| ✅ | kalmanFilter1d：卡尔曼增益收敛 ≡ Riccati 解析不动点（一维稳态解） | 0 | 1.00e-10 |
| ✅ | bleu：自比对 BLEU(ref, ref) = 1（上界精确，简短惩罚 = 1） | 0 | 1.00e-12 |
| ✅ | decisionTree：无剪枝训练准确率 = 1（CART 叶纯度，Gini 收敛到 0） | 0 | 0 |
| ✅ | auc：完美分离 AUC = 1、完全逆序 AUC = 0（Mann–Whitney 秩法端点精确） | 0 | 0 |
| ✅ | r2：完全拟合 R² = 1（残差平方和 = 0，上界精确） | 0 | 1.00e-15 |
| ✅ | logsumexp：平移不变 LSE(x+c) = LSE(x)+c 且 1000 量级不溢出（数值稳定） | 0 | 1.00e-12 |
| ✅ | hmm：前后向一致性 Σα_t(s)β_t(s) = P(O) 对全部 t 恒定（Rabiner 1989；v1.3.1 修复 β 递推索引后成立） | 1.39e-17 | 1.00e-12 |
| ✅ | eligibilityTrace：e_t = (γλ)^t（解析）且 λ=0 退化为首项 one-hot | 2.78e-17 | 1.00e-12 |
| ✅ | monteCarloReturn：确定 MDP 折扣回报 ≡ 解析 Σγᵗr（无偏性） | 6.31e-14 | 1.00e-10 |
| ✅ | ppoClip：截断目标恒为未裁剪目标的悲观下界 L ≤ r·A，且越界处界精确生效（信任域） | 0 | 1.00e-15 |
| ✅ | sampleStats：标准正态样本 kurtosis ≈ 3、skew ≈ 0（四阶矩解析） | 1.13e-2 | 1.50e-1 |
| ✅ | channelCapacity：BSC 容量 = 1 − H₂(p)（bits，Arimoto–Blahut 迭代 ≡ 解析） | 5.55e-17 | 1.00e-9 |
| ✅ | tensorGather/Scatter：往返恒等 scatter(a, idx, gather(a, idx)) = a | 0 | 0 |
| ✅ | metropolisSample：经验分布 → 目标分布（MCMC 细致平衡，6e4 迭代） | 3.16e-3 | 2.00e-2 |
| ✅ | bucketize：桶数 = k、各桶长度差 ≤ 1、拼接无损（划分结构不变量） | 0 | 0 |
| ✅ | softmax：归一化和 = 1 且平移不变（x+c 逐元素一致） | 1.08e-14 | 1.00e-13 |
| ✅ | gelu：gelu(0)=0 · 大正数渐近 gelu(x)→x · 导数 gelu′(0)=0.5（梯度检验） | 1.11e-16 | 1.00e-4 |
| ✅ | layerNorm：逐行均值 = 0（仿射/平移精确消除） | 0 | 1.00e-13 |
| ✅ | batchNorm：逐特征列均值 = 0（精确） | 0 | 1.00e-13 |
| ✅ | crossEntropy：crossEntropy(p,p)=entropy(p) 且 Gibbs 不等式 CE(p,q)≥H(p) | 0 | 1.00e-13 |
| ✅ | fused_softmax_log：exp(out) ≡ softmax（log-softmax 单趟 vs 组合） | 2.78e-17 | 1.00e-15 |
| ✅ | fused_softmax_ce：fused ≡ crossEntropy(one-hot, softmax(logits))（稳定软max+CE vs 组合） | 8.88e-16 | 1.00e-13 |
| ✅ | fused_gauss_pdf_log：exp(out) ≡ gaussPDF（log-PDF 单趟 vs 组合） | 2.78e-17 | 1.00e-15 |
| ✅ | fused_transpose_flatten：out ≡ flatten(transpose)（行主序，消除中间 2D 张量） | 0 | 1.00e-15 |
| ✅ | ucb：未探索臂（count=0 → ∞）优先 · 同值低 count 优先 · 同 count 高 value 优先 | 0 | 1.00e-15 |
| ✅ | silhouette：取值 ∈ [-1,1] 且单簇聚类 → 全 0 | 0 | 1.00e-15 |
| ✅ | earlyStop：best = min(valHistory) · bestIndex = argmin · stopIndex ∈ [bestIndex, len-1] | 0 | 1.00e-15 |
| ✅ | thompsonSample：Beta(α,β) 样本经验均值 ≡ α/(α+β)（蒙特卡洛 vs 解析一阶矩） | 3.00e-3 | 2.00e-2 |
| ✅ | lrDecay：lr₀/(1+kt) 随 t 单调不增、且 lr(0)=lr₀（学习率衰减单调性） | 0 | 0 |
| ✅ | weightDecay：闭式 w·(1−lr·λ)（L2 惩罚梯度步，无偏缩放） | 0 | 0 |
| ✅ | polyakAvg：指数/窗口平均 = 算术平均（Polyak–Ruppert 平均） | 0 | 0 |
| ✅ | splitHeads / concatHeads：多头分拆-拼接往返恒等（d 整除 H） | 0 | 0 |
| ✅ | dropout：反向缩放 1/(1−p) 保持期望（p=0 恒等 + 蒙特卡洛均值→x） | 2.36e-2 | 8.00e-2 |
| ✅ | conv1d：等价于 im2col Toeplitz 矩阵-向量乘法（stride=1, pad=0） | 0 | 0 |
| ✅ | weightNorm：重新参数化后范数 ‖w‖ = |g|（方向保留、幅度由 g 控制） | 0 | 0 |
| ✅ | ropeApply：旋转位置编码保持范数（2×2 旋转矩阵正交） | 0 | 1.00e-12 |
| ✅ | groupNorm：逐组（group）内归一化后均值 = 0（与 layerNorm 同构） | 1.11e-16 | 1.00e-12 |
| ✅ | labelSmooth：平滑后仍为合法分布（和 = 1）且 eps=0 退化为 one-hot | 0 | 0 |
| ✅ | mixup：端点 λ=0→x₂、λ=1→x₁、且 mixup(x,x,λ)=x（凸组合恒等式） | 0 | 0 |
| ✅ | mqa：输出形状守恒（H×T×d）且第 h 头 ≡ selfAttention(Qₕ,K,V)（定义一致性） | 0 | 0 |
| ✅ | gqa：分组查询注意力输出形状守恒（H×T×d） | 0 | 0 |
| ✅ | gradientDescent：凸二次函数 history 单调不增（f=½‖x‖²） | 0 | 1.00e-12 |
| ✅ | adamw：λ=0 时逐位退化为 adam（解耦衰减恒等式） | 4.76e-22 | 1.00e-12 |
| ✅ | kmeans：Lloyd SSE 单调不增（收敛性） | 0 | 1.00e-9 |
| ✅ | gmmEM：对数似然单调不减（1D 强分离数据，协方差远离奇异→正则不影响，机器精度级） | 0 | 1.00e-10 |
| ✅ | gmmEM：责任度每行 Σ=1（概率归一） | 0 | 1.00e-12 |
| ✅ | valueIteration：Bellman 残差 → 0（动态规划收敛） | 8.35e-14 | 1.00e-9 |
| ✅ | crossAttention：输出形状守恒（m×dv） | 0 | 0 |
| ✅ | residualAdd：fx = 全 0 时退化为恒等（残差流基线） | 0 | 0 |
| ✅ | multiHead：causal=true 时注意力权重上三角（j>i）严格 = 0（因果掩码） | 0 | 1.00e-15 |
| ✅ | lbfgs：凸二次目标收敛到全局最优（f(x)→0, ‖g‖→0） | 0 | 1.00e-8 |
| ✅ | gradClip：输出梯度范数 ≤ maxNorm（当原范数超界时恰为 maxNorm） | 0 | 1.00e-12 |
| ✅ | gmmEM：混合权重 Σ=1（概率单纯形） | 0 | 1.00e-12 |
| ✅ | knn：1-NN 在训练点上自返（查询点距离为 0 必命中自身） | 0 | 0 |
| ✅ | conjugateGradient：解 Ax=b 残差 → 0 | 2.02e-16 | 1.00e-9 |
| ✅ | conjugateGradient ≡ solveLinear（闭式对照） | 2.22e-16 | 1.00e-9 |
| ✅ | bfgs：凸二次收敛到全局最优（‖∇f(x*)‖ → 0） | 7.10e-9 | 1.00e-6 |
| ✅ | linearRegression：残差 ⊥ X（正规方程 Xᵀr = 0） | 1.32e-14 | 1.00e-8 |
| ✅ | linearRegression：predict ≡ 闭式 Xw | 4.44e-16 | 1.00e-9 |
| ✅ | logisticRegression：收敛到驻点（‖∇L/n‖ → 0） | 2.65e-3 | 1.00e-2 |
| ✅ | logisticRegression：predictProba ∈ [0,1]（sigmoid 值域闭区间） | 0 | 1.00e-12 |
| ✅ | lineSearch：Armijo 充分下降 f(x+αd) ≤ f(x)+c1·α·∇f·d | 0 | 1.00e-12 |
| ✅ | wolfeLineSearch：强 Wolfe（Armijo + 曲率）双条件满足 | 0 | 1.00e-10 |
| ✅ | gibbsSampler：平稳分布 ≈ 解析 π（πP=π，多 seed 稳健） | 4.83e-3 | 2.00e-2 |
| ✅ | infoGain ≥ 0（ID3 信息增益非负） | 0 | 1.00e-12 |
| ✅ | infoGain ≤ entropy(parent)（增益上界 = 父熵） | 0 | 1.00e-12 |
| ✅ | gini：纯 → 0 · 平衡2类 → 0.5 · 均匀3类 → 2/3 | 1.11e-16 | 1.00e-12 |
| ✅ | variableElim ≡ chainBeliefProp ≡ hmmForwardBackward：P(O) 似然逐位一致（概率图精确推断，对数/指数） | 5.20e-18 | 1.00e-12 |
| ✅ | ripCheck：团树运行交集性质（RIP）结构判定正确性（满足/违反二例） | 0 | 0 |
| ✅ | gumbelSample：Gumbel CDF 恒等 exp(−exp(−g)) = u（极值分布解析） | 5.55e-17 | 1.00e-12 |
| ✅ | inverseCDF：F(F⁻¹(u)) = u（uniform CDF 反函数恒等） | 2.22e-16 | 1.00e-12 |
| ✅ | rejectionSample：接受率 ≤ 1 且 uniform 目标经验均值 → 0.5（多 seed 稳健） | 1.16e-2 | 5.00e-2 |
| ✅ | antitheticSample：对偶变量负相关 corr(u, 1−u) = −1 精确 | 2.22e-16 | 1.00e-12 |
| ✅ | policyIteration ≡ valueIteration：最优值函数逐位一致（最优 V 唯一） | 5.35e-13 | 1.00e-9 |
| ✅ | reinforceGradient：Σ∇logπ·R = 0（对数概率梯度零均值恒等） | 4.44e-16 | 1.00e-12 |
| ✅ | mSeparated ≡ dSeparated：d-分离判据跨算法一致（多查询） | 0 | 0 |
| ✅ | orthonormalize：Gram 矩阵 Q·Qᵀ = I（修正 Gram–Schmidt 正交归一） | 3.33e-16 | 1.00e-12 |
| ✅ | nullspace：A·v = 0 且 rank + nullity = n（秩-零度定理） | 0 | 1.00e-10 |
| ✅ | condEstimate：正交矩阵 κ = 1；对角阵 κ = σmax/σmin（端点/解析） | 4.00e-15 | 1.00e-6 |
| ✅ | averagePrecision：全相关排前 = 1；全不相关 = 0（端点精确） | 0 | 1.00e-15 |
| ✅ | confusionMatrix：元素和 = N；对角和 = 正确数（结构不变量） | 0 | 1.00e-12 |
| ✅ | svd：A = U·Σ·Vᵀ 重构 + σᵢ = √λᵢ(AᵀA)（独立谱交叉）+ UᵀU = VᵀV = I | 6.66e-16 | 1.00e-8 |
| ✅ | svd：等范数列边界（ζ=0，Hestenes 旋转根 ±1）—— 解析奇异值 4/2/2 + σᵢ = √λᵢ(AᵀA) + UᵀU = I + 重构 | 4.44e-16 | 1.00e-9 |
| ✅ | lu：A = L·U 重构 + L 单位下三角 / U 上三角（结构精确，Doolittle 无主元） | 1.54e-16 | 1.00e-9 |
| ✅ | fft：Cooley–Tukey radix-2 ≡ 朴素 O(n²) DFT（参照实现 vs 主实现） | 1.73e-14 | 1.00e-9 |
| ✅ | pageRank：幂迭代 ≡ 直接线性求解 (I − αP)π = (1−α)·1/n（两条独立路径） | 5.55e-17 | 1.00e-9 |
| ✅ | dijkstra：最短路径 ≡ Bellman–Ford（参照实现 vs 主实现，含不可达节点） | 0 | 1.00e-12 |
| ✅ | sliceSample：目标保真 E[均值]=0、E[方差]=1（12 seed 稳健，标准正态目标） | 3.31e-3 | 2.00e-2 |
| ✅ | newton：求根 x³ − 2x − 5 = 0，|f(x*)| = 0（解析根 ≈ 2.094551482） | 8.88e-16 | 1.00e-12 |
| ✅ | rk4：dx/dt = λx ≡ 解析解 x(T) = x₀·e^{λT}（λ = −1, T = 1, h = 0.005） | 1.92e-12 | 1.00e-8 |
| ✅ | heapSort：二叉堆 push/pop 序 ≡ Array.sort 升序（200 元素，显式比较器） | 0 | 0 |
| ✅ | dijkstraHeap：堆优先队列 ≡ Bellman–Ford ≡ 线性扫描 Dijkstra（含不可达 ∞） | 0 | 1.00e-12 |
| ✅ | aStar：可采纳欧氏启发下最优距离 ≡ Dijkstra（10 个 6×6 网格） | 0 | 1.00e-12 |
| ✅ | aStar：欧氏启发严格剪枝（扩展节点数 < h≡0 一致代价搜索） | 0 | 0 |
| ✅ | fftConvolve：FFT 循环卷积 ≡ 朴素 O(n²)（卷积定理，n=16） | 4.44e-16 | 1.00e-9 |
| ✅ | csr：稀疏 matVec ≡ 稠密 matVec + 转置 ≡ 稠密 transpose（结构守恒） | 0 | 1.00e-12 |
| ✅ | mst：Prim ≡ Kruskal ≡ 暴力枚举生成树（12 小图全枚举 + 连通大图边数 n−1） | 1.78e-15 | 1.00e-9 |
| ✅ | bisect：括号二分根 ≡ Newton 根（x³−2x−5 = 0 于 [2,3]，|f(x*)|=0） | 3.55e-15 | 1.00e-12 |
| ✅ | kadane：最大子数组和 ≡ 暴力枚举 O(n²)（20 实例整数精确） | 0 | 0 |
| ✅ | qrEigenvalues：QR 迭代 + Wilkinson 位移 ≡ Jacobi（8 个 6×6 随机对称阵，两条独立路径）+ 重根/2×2/1×1 退化用例 | 1.27e-14 | 1.00e-9 |
| ✅ | qrEigenvalues：tr(A) = Σλᵢ（谱不变量，QR 迭代相似变换保迹） | 1.15e-14 | 1.00e-9 |
| ✅ | maxFlow：Edmonds–Karp = 最小割（max-flow = min-cut 定理，暴力枚举 2^(n−2) 个割） | 0 | 1.00e-9 |
| ✅ | maxFlow：Dinic ≡ Edmonds–Karp（层次图多路增广 vs BFS 增广，跨算法一致） | 0 | 1.00e-12 |
| ✅ | scc：Tarjan ≡ Kosaraju（15 个随机有向图，强连通分量划分逐分量一致） | 0 | 0 |
| ✅ | kahnTopo：所有边前向 + 全节点覆盖 + 有环返回 null（结构不变量，15 个 DAG + 环图） | 0 | 0 |
| ✅ | kuhnMatching：König 定理 最大匹配 = 最小顶点覆盖（12 个随机二部图，暴力枚举 2^8）+ 匹配合法性 | 0 | 0 |
| ✅ | bluesteinFFT：任意长度 FFT（Bluestein 卷积定理，非 2 的幂）≡ 朴素 O(n²) DFT + 2 的幂 ≡ radix-2 | 1.69e-14 | 1.00e-9 |
| ✅ | adaptiveMetropolis：Haario 协方差自适应 —— 三目标（N(0,1) / 2D 相关高斯 ρ=0.8 / Gamma(k=3)）经验矩 ≡ 解析（20 seed 稳健） | 1.04e-2 | 6.00e-2 |
| ✅ | hmcSample：Hamiltonian MC（leapfrog）经验矩 ≡ 解析（1D 标准正态 + 2D 相关高斯 ρ=0.8，20 seed 稳健） | 1.16e-2 | 6.00e-2 |
| ✅ | hmcSample：leapfrog 能量误差 E|ΔH| 有界（可逆·保体积 ⇒ 20 seed 平均 |ΔH| ≤ 0.1） | 2.87e-2 | 1.00e-1 |
| ✅ | floydWarshall：全源最短路 ≡ 每源 Dijkstra（12 图）+ 负权无负环 ≡ 每源 Bellman–Ford（DAG 负权） | 3.55e-15 | 1.00e-12 |
| ✅ | dsu：并查集（路径压缩 + 按秩合并）连通分量 ≡ BFS（15 图）+ Kruskal-DSU MST ≡ Prim + 分量数守恒 | 0 | 1.00e-12 |
| ✅ | kmpSearch：KMP 匹配位置 ≡ 朴素暴力（随机文本 + 最坏 aⁿb 模式）+ 失败函数 ≡ 暴力最长真前后缀 | 0 | 0 |
| ✅ | gaussLegendre：n 点求积对 ≤2n−1 次多项式精确（∫₋₁¹xᵏ 解析对照，n=6/10）+ ∫cos x = 2sin1 | 5.55e-16 | 1.00e-11 |
| ✅ | strassenMul：Strassen 分治 ≡ 朴素矩阵乘（n = 1/2/4/8/16，两条独立路径） | 6.66e-15 | 1.00e-9 |
| ✅ | mixedRadixFFT：混合基（radix-2/3/5）≡ 朴素 DFT（N=15/45/75/60/90/225/300 + 2 幂 16/32/64） | 3.68e-12 | 1.00e-10 |
| ✅ | nutsSample：NUTS 经验矩 ≡ 解析（1D N(0,1) + 2D 相关高斯 ρ=0.8，12 seed 池化，双平均自适应步长） | 2.40e-2 | 6.00e-2 |
| ✅ | mcmfSSP：最小费用最大流 ≡ SSP+Bellman–Ford ≡ EK（max-flow 值），20 个 DAG（含负费用边） | 0 | 0 |

## 2. 注册表完整性（10/10）

| 检查 | 结果 |
|---|---|
| 指令总数 = 1024 | ✅ |
| ID 唯一 | ✅ |
| ID 连续且格式化 | ✅ |
| 每族恰 64 条 | ✅ |
| 每算子恰 4 变体 | ✅ |
| 变体 ∈ {base,batched,fused,inplace} | ✅ |
| 全部含数学不变量 | ✅ |
| verified 项 impl 均为 core.js 真实导出 | ✅ |
| verified 变体限于 {base,batched,fused,inplace} | ✅ |
| verified 数 > 0（当前 811） | ✅ |

## 3. 微指令内核化覆盖（verified = 有 core.js 实现且通过不变量自检）

| 指令族 | verified / 16 |
|---|---|
| ATTEN | 54 / 16 |
| BWD | 55 / 16 |
| DATA | 48 / 16 |
| FWD | 60 / 16 |
| GRAPH | 48 / 16 |
| INFO | 51 / 16 |
| LINALG | 52 / 16 |
| METRIC | 48 / 16 |
| NORM | 58 / 16 |
| NUMER | 58 / 16 |
| OPTIM | 50 / 16 |
| PROB | 47 / 16 |
| RL | 49 / 16 |
| SAMPLE | 50 / 16 |
| SYS | 29 / 16 |
| TENSOR | 54 / 16 |
| **合计** | **811 / 1024** |

## 4. 残差分级说明

| 级别 | 残差量级 | 项数 | 说明 |
|---|---|---|---|
| 精确 0 | = 0 | 192 | 恒等式、枚举判定、结构不变量 |
| 机器精度 | ≤ 1e-14 | 273 | 矩阵分解/恒等式/精确算术 |
| 算法收敛 | 1e-13 ~ 1e-6 | 34 | 迭代算法、逼近公式（erf/A&S、gelu）、梯度检验 |
| 统计估计 | > 1e-6 | 34 | Box–Muller 矩估计、类别采样频率（蒙特卡洛固有） |

## 5. 复现方式

```bash
node test/run.js                  # 全量 351 项，失败退出码 1
node tools/gen-verification.js     # 重新生成本报告
node tools/gen-registry.js         # 重新生成 1024 微指令注册表
```

浏览器内打开 `axiom.html` → 「实时自检」视图 → 「运行全量自检」：同一份 `core.js`，同一批检查。
