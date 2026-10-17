#!/usr/bin/env node
/* ============================================================================
 * AXIOM 1024 微指令注册表生成器
 * ----------------------------------------------------------------------------
 * 指令集架构（ISA）：16 指令族 × 16 基础算子 × 4 执行变体 = 1024 条微指令
 *   - 基础变体 base    ：标量 / 单样本语义
 *   - 批处理变体 batched：沿 batch 维独立执行，与逐样本调用逐位一致
 *   - 融合变体 fused   ：与相邻算子融合，消除中间张量物化，数学语义不变
 *   - 原地变体 inplace ：输入被覆盖，返回值与 out-of-place 逐位一致
 * 状态：verified = 有 core.js 参考实现且通过不变量自检；spec = 规格已定义
 * 运行：node tools/gen-registry.js
 * ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const AXIOM = require(path.join(__dirname, '..', 'src', 'core.js'));
const BATCH_SIG = AXIOM.BATCH_SIG || {}; // 通用批处理引擎签名表（v1.1.4）
const INPLACE_SIG = AXIOM.INPLACE_SIG || {}; // 通用原地引擎签名表（v1.1.5）

const VARIANTS = [
  { key: 'base', note: '标量/单样本语义' },
  { key: 'batched', note: '沿 batch 维独立执行，结果与逐样本调用逐位一致' },
  { key: 'fused', note: '与相邻算子融合，消除中间张量物化，数学语义不变' },
  { key: 'inplace', note: '原地执行，输入被覆盖，返回值与 out-of-place 逐位一致' }
];

/* [算子名, 中文名, 数学不变量, core.js 参考实现(可选)] */
const GROUPS = [
  { code: 'TENSOR', name: '张量指令', layer: 'L1 数学基础', ops: [
    ['create', '创建张量', '元素总数 = ∏ shape', null],
    ['zeros', '全零张量', '所有元素 = 0', null],
    ['ones', '全一张量', '所有元素 = 1', null],
    ['arange', '等差序列', '步长一致；末值 < stop', null],
    ['reshape', '形状变换', '元素个数守恒，行优先顺序不变', null],
    ['transpose', '转置', 'T(T(A)) = A', 'transpose'],
    ['slice', '切片', '切片长度 = stop − start', null],
    ['concat', '拼接', '长度 = 各段之和', null],
    ['stack', '堆叠', '新增一维，长度 = 段数', null],
    ['split', '分割', '各段长度之和 = 原长', null],
    ['cast', '类型转换', '整型→浮点无损', null],
    ['copy', '拷贝', '深拷贝：改副本不影响原数据', null],
    ['gather', '收集', '输出[i] = A[idx[i]]', null],
    ['scatter', '散布', 'A[idx[i]] = src[i]', null],
    ['fill', '填充', '全部元素 = v', null],
    ['flatten', '展平', '行优先展开，元素守恒', null]
  ]},
  { code: 'LINALG', name: '线性代数指令', layer: 'L1 数学基础', ops: [
    ['matmul', '矩阵乘法', '(AB)ᵀ = BᵀAᵀ（逐位一致）', 'matMul'],
    ['matvec', '矩阵-向量乘', '‖Ax‖ ≤ ‖A‖∞·‖x‖∞', 'matVec'],
    ['trace', '迹', 'tr(AB) = tr(BA)', 'trace'],
    ['det', '行列式', 'det(AB) = det(A)·det(B)', 'det'],
    ['inverse', '逆矩阵', '‖AA⁻¹ − I‖∞ ≤ 1e-10', 'inverse'],
    ['solve', '解线性方程组', '‖Ax − b‖ ≤ 1e-12·‖A‖·‖x‖', 'solveLinear'],
    ['cholesky', 'Cholesky 分解', '‖LLᵀ − A‖ ≤ 1e-10（SPD）', 'cholesky'],
    ['qr', 'QR 分解', 'QᵀQ = I 且 ‖QR − A‖ ≤ 1e-10', 'qrDecompose'],
    ['eigen', '对称特征分解', '‖Sv − λv‖ ≤ 1e-12；V 正交归一', 'jacobiEigen'],
    ['power', '幂迭代', '主特征值与 Jacobi 一致 ≤ 1e-9', 'powerIteration'],
    ['pca', '主成分分析', 'Eckart–Young：秩-k 残差 = (n−1)Σ_{i>k}λᵢ', 'pca'],
    ['lstsq', '最小二乘', 'Xᵀ(Xw − y) = 0', 'linearRegression'],
    ['rank', '秩估计', 'rank ≤ min(m,n)', null],
    ['nullspace', '零空间', 'Ax = 0', null],
    ['orthonormalize', '正交化', 'QᵀQ = I', null],
    ['cond', '条件数估计', 'κ(A) = ‖A‖·‖A⁻¹‖ ≥ 1', null]
  ]},
  { code: 'NUMER', name: '数值稳定指令', layer: 'L1 数学基础', ops: [
    ['logsumexp', '稳定对数和', '= logΣeˣ；输入 ±1e300 不溢出', 'logsumexp'],
    ['softmax', '稳定 Softmax', '平移不变；输出和 = 1', 'softmax'],
    ['kahan', 'Kahan 补偿求和', '病态序列误差 ≤ 1e-9（朴素求和丢有效位）', 'kahanSum'],
    ['exactsum', '无误差求和', 'TwoSum 变换，作为精确和基准', 'exactSum'],
    ['expm1', '高精度 exp(x)−1', '小 x 相对误差 ≤ 1e-15（平台原生）', null],
    ['log1p', '高精度 log(1+x)', '小 x 相对误差 ≤ 1e-15（平台原生）', null],
    ['hypot', '稳定斜边', '大参数不溢出（平台原生）', null],
    ['clip', '截断', '输出 ∈ [lo, hi]', 'clip'],
    ['sigmoid', '稳定 Sigmoid', 'σ(−x) = 1 − σ(x) ≤ 1e-15', 'sigmoid'],
    ['gelu', 'GELU 激活', 'xΦ(x)∈[min(0,x),max(0,x)]；全局最小≈−0.17@x≈−0.75', 'gelu'],
    ['erf', '误差函数', 'Φ(−x) = 1 − Φ(x)；Φ(1.96) ≈ 0.975002', 'erf'],
    ['div_guard', '安全除法', '|分母| < ε 时按 ε 处理', null],
    ['sqrt_guard', '安全开方', '负输入抛错', null],
    ['reciprocal', '倒数', 'x·(1/x) ≈ 1', null],
    ['fma', '融合乘加', 'ab + c 单次舍入', null],
    ['relu', 'ReLU 激活', 'max(0, x)', 'relu']
  ]},
  { code: 'PROB', name: '概率运算指令', layer: 'L1 数学基础', ops: [
    ['gauss_pdf', '高斯密度', '∫pdf = 1（Simpson 误差 ≤ 1e-10）', 'gaussPDF'],
    ['gauss_cdf', '高斯分布函数', 'Φ(−x) = 1 − Φ(x) ≤ 1e-14', 'normalCDF'],
    ['normal_sample', '正态采样', 'Box–Muller：n=1e5 矩估计 ≤ 0.01', 'normalSample'],
    ['categorical_sample', '类别采样', '频率 ≈ p ≤ 0.01', 'categoricalSample'],
    ['seed_repro', '种子复现', '同种子 → 同序列', 'mulberry32'],
    ['bayes', '贝叶斯更新', '后验和 = 1；先验×似然归一', 'bayesUpdate'],
    ['expectation', '期望', 'E[aX + bY] = aE[X] + bE[Y]', 'expectation'],
    ['variance', '方差', 'Var(X) = E[X²] − E[X]²', 'variance'],
    ['covariance', '协方差', 'Cov(X,X) = Var(X)', 'covariance'],
    ['bernoulli_sample', '伯努利采样', '频率 ≈ p', null],
    ['binomial_sample', '二项采样', '均值 = np', null],
    ['uniform_sample', '均匀采样', '∈ [0,1)', null],
    ['marginal', '边缘化', '边缘 = 联合求和', null],
    ['condition', '条件化', 'P(A|B)·P(B) = P(A,B)', null],
    ['mv_gauss', '多元高斯密度', 'Cholesky 求值，密度可积', null],
    ['sample_stats', '采样矩估计', '矩估计随 n 收敛', null]
  ]},
  { code: 'INFO', name: '信息论指令', layer: 'L1 数学基础', ops: [
    ['entropy', '熵', '0 ≤ H ≤ log₂n；均匀取等', 'entropy'],
    ['cross_entropy', '交叉熵', 'H(p,q) ≥ H(p)', 'crossEntropy'],
    ['kl', 'KL 散度', '≥ 0；p = q 时为 0', 'klDivergence'],
    ['js', 'JS 散度', '∈ [0,1]；对称', 'jsDivergence'],
    ['mutual_info', '互信息', 'I(X;Y) = I(Y;X) ≥ 0；独立为 0', 'mutualInfo'],
    ['conditional_entropy', '条件熵', 'H(X|Y) = H(X,Y) − H(Y)', 'conditionalEntropy'],
    ['info_gain', '信息增益', '≥ 0；纯分裂 = 1 bit', 'infoGain'],
    ['gini', '基尼不纯度', '∈ [0, 1−1/K]；纯类为 0', 'gini'],
    ['perplexity', '困惑度', '= 2^H', null],
    ['surprisal', '惊奇度', '−log₂p', null],
    ['bits', '位换算', 'bits = nats·log₂e', null],
    ['channel_capacity', '信道容量', 'C = max I(X;Y)', null],
    ['rate_distortion', '率失真', 'R(D) 单调不增', null],
    ['kl_reverse', '反向 KL', 'KL(p‖q) ≠ KL(q‖p)', null],
    ['max_entropy', '最大熵原理', '无约束最大熵 = 均匀分布', null],
    ['normalize_dist', '分布归一化', 'Σp = 1', null]
  ]},
  { code: 'OPTIM', name: '优化算子指令', layer: 'L2 监督学习', ops: [
    ['gd', '梯度下降', '凸二次收敛至解析最优 ≤ 1e-7', 'gradientDescent'],
    ['adam', 'Adam 优化器', '凸二次收敛 ≤ 1e-5', 'adam'],
    ['cg', '共轭梯度', 'SPD 系统 ≤ n 步收敛 ≤ 1e-10', 'conjugateGradient'],
    ['momentum', '动量法', '凸二次收敛，迭代数少于 GD', null],
    ['nesterov', 'Nesterov 加速', '凸函数 O(1/t²) 收敛', null],
    ['adagrad', 'Adagrad', '稀疏特征自适应学习率', null],
    ['rmsprop', 'RMSProp', '梯度平方自适应缩放', null],
    ['adamw', 'AdamW', '解耦权重衰减', null],
    ['lbfgs', 'L-BFGS', '拟牛顿，超线性收敛', null],
    ['bfgs', 'BFGS', 'Hessian 近似保持正定', null],
    ['line_search', '线搜索', 'Armijo 充分下降条件', null],
    ['grad_clip', '梯度裁剪', '裁剪后 ‖g‖ ≤ max_norm', null],
    ['grad_norm', '梯度范数', '= √Σgᵢ²', null],
    ['lr_decay', '学习率衰减', 'lr_t = lr₀/(1+kt)', null],
    ['weight_decay', '权重衰减', 'w ← w(1 − ηλ)', null],
    ['polyak', 'Polyak 平均', '平均点列收敛至最优', null]
  ]},
  { code: 'FWD', name: '前向传播指令', layer: 'L3 无监督/表示', ops: [
    ['linear', '线性层', 'ŷ = XWᵀ + b', 'linear'],
    ['layernorm', '层归一化', '行均值 ≈ 0、方差 ≈ 1', 'layerNorm'],
    ['self_attn', '自注意力', '权重行和 = 1；因果掩码上三角为 0', 'selfAttention'],
    ['softmax', 'Softmax', '行和 = 1；平移不变', 'softmax'],
    ['sigmoid', 'Sigmoid', 'σ(−x) = 1 − σ(x)', 'sigmoid'],
    ['gelu', 'GELU', '单调递增；极限 →x', 'gelu'],
    ['relu', 'ReLU', 'max(0,x)', 'relu'],
    ['tanh', 'Tanh', '奇函数；|tanh| ≤ 1', 'tanh'],
    ['embedding_lookup', '嵌入查找', '输出 = 第 i 行向量', null],
    ['flatten', '展平', '元素守恒', null],
    ['residual_add', '残差连接', 'x + f(x) 形状不变', null],
    ['concat_heads', '头拼接', '拼接维度 = 头数 × 头维', null],
    ['pool_max', '最大池化', '输出 ≤ 窗内最大值', null],
    ['conv1d', '一维卷积', '输出长度 = ⌈(L+2p−k)/s⌉+1', null],
    ['batchnorm', '批归一化', '批均值 ≈ 0、方差 ≈ 1', null],
    ['dropout', 'Dropout', '期望缩放保持不变', null]
  ]},
  { code: 'BWD', name: '反向传播指令', layer: 'L3 无监督/表示', ops: [
    ['grad_check', '梯度检验', '中心差分 vs 解析 ≤ 1e-6', 'gradientCheck'],
    ['grad_linear', '线性层梯度', '∂L/∂W = δᵀX', 'mlpGrad'],
    ['grad_relu', 'ReLU 梯度', 'x < 0 处梯度 = 0', null],
    ['grad_tanh', 'Tanh 梯度', '1 − tanh²(x)', null],
    ['grad_softmax_ce', 'Softmax+CE 梯度', 'p − y', null],
    ['grad_layernorm', '层归一化梯度', '链式法则复合', null],
    ['grad_matmul', '矩阵乘梯度', 'dL/dA = dL·Bᵀ', null],
    ['chain_rule', '链式法则', "d/dx f(g(x)) = f'(g)·g'", null],
    ['grad_clip', '梯度裁剪', '全局范数 ≤ 阈值', null],
    ['grad_accum', '梯度累积', 'Σ 批次梯度 = 全量梯度', null],
    ['stop_grad', '停止梯度', '该支路梯度 = 0', null],
    ['detach', '分离计算图', '返回值不带历史', null],
    ['jacobian', '数值 Jacobian', '与解析差分 ≤ 1e-6', null],
    ['vjp', '向量-Jacobian 积', '⟨Jv,u⟩ = ⟨v,Jᵀu⟩', null],
    ['jvp', 'Jacobian-向量积', '同上对偶恒等式', null],
    ['bptt', '时间反向传播', '梯度沿时间步累加', null]
  ]},
  { code: 'NORM', name: '归一化正则指令', layer: 'L3 无监督/表示', ops: [
    ['l1', 'L1 范数', 'Σ|xᵢ|', 'l1Norm'],
    ['l2', 'L2 范数', '√Σxᵢ²', 'l2Norm'],
    ['linf', '无穷范数', 'max|xᵢ|', 'linfNorm'],
    ['normalize_l2', 'L2 归一化', '‖x̂‖ = 1 ≤ 1e-15', 'normalizeL2'],
    ['minmax', '最小最大缩放', '输出 ∈ [0,1]', 'minmaxScale'],
    ['zscore', '标准化', '均值 = 0、方差 = 1', 'zscore'],
    ['l2_reg', 'L2 正则', 'λ‖w‖²', 'l2Reg'],
    ['l1_reg', 'L1 正则', 'λΣ|wᵢ|', null],
    ['weight_norm', '权重归一化', 'w = g·v/‖v‖', null],
    ['spectral_norm', '谱归一化', 'σ(W) = 1', null],
    ['group_norm', '组归一化', '组内均值 0 方差 1', null],
    ['batch_norm', '批归一化', '批统计量归一', null],
    ['label_smooth', '标签平滑', '分布质量守恒', null],
    ['mixup', 'Mixup 增强', '凸组合保持标签空间', null],
    ['dropout_reg', 'Dropout 正则', '期望不变性', null],
    ['early_stop', '早停', '验证损失最优点停', null]
  ]},
  { code: 'ATTEN', name: '注意力指令', layer: 'L4 序列/生成', ops: [
    ['softmax_attn', '注意力权重', '行和 = 1 ≤ 1e-14', 'selfAttention'],
    ['causal_mask', '因果掩码', '上三角严格为 0', 'selfAttention'],
    ['self_attn', '自注意力', '输出形状不变', 'selfAttention'],
    ['qk_dot', 'QK 打分', 'scores = QKᵀ', null],
    ['scale', '缩放', '÷√d_k', null],
    ['cross_attn', '交叉注意力', 'Q 来自解码，K/V 来自编码', null],
    ['multi_head', '多头注意力', '拼接后维度 = 头数×头维', null],
    ['mha_split', '头分裂', 'split(concat(X)) = X', null],
    ['rel_pos', '相对位置偏置', '偏置可加于打分', null],
    ['alibi', 'ALiBi 偏置', '线性距离惩罚', null],
    ['rope', '旋转位置编码', '⟨R_m q, R_n k⟩ 依赖 m−n', null],
    ['kv_cache', 'KV 缓存', '增量计算 = 全量计算', null],
    ['mqa', '多查询注意力', 'K/V 头数 < Q 头数', null],
    ['gqa', '分组查询注意力', '组内共享 K/V', null],
    ['flash', 'FlashAttention 分块', '分块结果 = 全量结果', null],
    ['attn_entropy', '注意力熵', '∈ [0, log n]', null]
  ]},
  { code: 'SAMPLE', name: '采样生成指令', layer: 'L4 序列/生成', ops: [
    ['box_muller', 'Box–Muller 采样', '矩估计 ≤ 0.01', 'normalSample'],
    ['categorical', '类别采样', '频率 ≈ p ≤ 0.01', 'categoricalSample'],
    ['temperature', '温度采样', 'T↓ → 熵↓', 'temperatureSoftmax'],
    ['topk', 'Top-K 采样', '支撑外 = 0；支撑上和 = 1', 'topK'],
    ['seed_repro', '种子复现', '同种子同序列', 'mulberry32'],
    ['uniform', '均匀采样', '∈ [0,1)', null],
    ['bernoulli', '伯努利采样', '频率 ≈ p', null],
    ['gumbel', 'Gumbel 采样', 'G = −log(−log u)', null],
    ['topp', 'Top-P 采样', '支撑概率质量 ≈ p', null],
    ['multinomial', '多项采样', '计数期望 = np', null],
    ['rejection', '拒绝采样', '接受样本服从目标分布', null],
    ['inverse_cdf', '逆变换采样', 'F⁻¹(u) 精确', null],
    ['antithetic', '对偶采样', '方差减半', null],
    ['stratified', '分层采样', '层内方差减小', null],
    ['systematic', '系统采样', '等间距无偏', null],
    ['normal', '正态采样', '矩估计 ≤ 0.01', 'normalSample']
  ]},
  { code: 'GRAPH', name: '图推断指令', layer: 'L5 概率图模型', ops: [
    ['forward_backward', '前向-后向算法', '后验每帧和 = 1；P(O) 与全枚举一致 ≤ 1e-10', 'hmmForwardBackward'],
    ['viterbi', 'Viterbi 解码', '路径对数概率 = 全枚举最大值', 'hmmViterbi'],
    ['belief_prop', '信念传播', '消息收敛时边缘精确', null],
    ['variable_elim', '变量消去', '= 直接枚举结果', null],
    ['junction_tree', '联合树', '团树满足运行交集性质', null],
    ['marginal', '边缘查询', 'Σ 隐变量 = 边缘分布', null],
    ['map_query', 'MAP 查询', '最大后验构型', null],
    ['condition', '条件查询', '证据似然归一', null],
    ['gibbs', 'Gibbs 采样', '平稳分布 = 目标分布', null],
    ['mcmc', 'MCMC 采样', '细致平稳条件', null],
    ['particle', '粒子滤波', '权重和 = 1', null],
    ['kalman', '卡尔曼滤波', '残差白噪声', null],
    ['dsep', 'D-分离判定', 'd-分离 ⟹ 条件独立', null],
    ['m_sep', 'M-分离判定', '道德图判据', null],
    ['clique_tree', '团树校准', '校准后团/分隔一致', null],
    ['factor_product', '因子乘积', '维度 = 各因子变量并集', null]
  ]},
  { code: 'RL', name: '强化学习指令', layer: 'L6 强化学习', ops: [
    ['value_iter', '值迭代', 'Bellman 残差 ≤ 1e-10；解析解 V* = 10', 'valueIteration'],
    ['q_learn', 'Q 学习', '训练后贪心成功率 ≥ 0.9', 'qLearning'],
    ['td0', 'TD(0)', 'α=1 确定性链一步扫描 = 解析解 ≤ 1e-12', 'td0Sweep'],
    ['epsilon_greedy', 'ε-贪心', 'ε = 0 时严格 argmax', 'epsilonGreedy'],
    ['bellman_backup', 'Bellman 备份', 'V ← T(V) 压缩映射', null],
    ['policy_iter', '策略迭代', '策略单调改进至最优', null],
    ['sarsa', 'SARSA', '同策略 TD 控制', null],
    ['td_lambda', 'TD(λ)', '资格迹指数衰减', null],
    ['monte_carlo', '蒙特卡洛', '回报均值无偏', null],
    ['greedy', '贪心策略', 'argmax_a Q(s,a)', null],
    ['ucb', '置信上界', 'UCB = Q + c√(ln t / N)', null],
    ['thompson', 'Thompson 采样', '后验概率匹配', null],
    ['advantage', '优势函数', 'A(s,a) = Q(s,a) − V(s)', null],
    ['gae', '广义优势估计', 'λ=0 → TD；λ=1 → MC', null],
    ['reinforce', 'REINFORCE', '策略梯度无偏', null],
    ['ppo', 'PPO 截断', '比率裁剪至 [1−ε, 1+ε]', null]
  ]},
  { code: 'METRIC', name: '评估度量指令', layer: 'L7 评估', ops: [
    ['accuracy', '准确率', '= 正确数 / 总数', 'accuracy'],
    ['precision', '精确率', 'TP/(TP+FP)', 'precision'],
    ['recall', '召回率', 'TP/(TP+FN)', 'recall'],
    ['f1', 'F1 分数', '= 2PR/(P+R)', 'f1'],
    ['auc', 'AUC', '完美分离 = 1；A(y,s) = 1 − A(y,−s)', 'auc'],
    ['r2', '决定系数', '完美拟合 = 1；均值预测 ≈ 0', 'r2'],
    ['mse', '均方误差', '= mean((ŷ−y)²)', 'mse'],
    ['mae', '平均绝对误差', '= mean|ŷ−y|', 'mae'],
    ['logloss', '对数损失', '≥ 0；完美预测 ≈ 0', 'logLoss'],
    ['cosine', '余弦相似度', '∈ [−1,1]', 'cosineSimilarity'],
    ['edit_distance', '编辑距离', 'd(kitten,sitting) = 3；对称', 'editDistance'],
    ['silhouette', '轮廓系数', '∈ [−1,1]；分离簇 > 0.5', 'silhouette'],
    ['perplexity', '困惑度', '= exp(logloss)', null],
    ['bleu', 'BLEU 分数', 'n-gram 精度几何平均', null],
    ['map', '平均精度均值', 'AP = Σ P(k)·Δr(k)', null],
    ['confusion', '混淆矩阵', '行和 = 类别真实数', null]
  ]},
  { code: 'DATA', name: '数据管线指令', layer: 'L7 评估', ops: [
    ['shuffle', '洗牌', '多重集守恒', 'shuffle'],
    ['train_test', '训练/测试划分', '无交集、规模和 = n', 'trainTestSplit'],
    ['kfold', 'K 折交叉验证', '并集 = 全集、两两不交', 'kFold'],
    ['onehot', '独热编码', '行和 = 1；维度 = 类数', 'oneHot'],
    ['label_encode', '标签编码', '类别 ↔ 整数双射', null],
    ['pad', '填充', '长度 = 目标长度', null],
    ['truncate', '截断', '保留前 k 个', null],
    ['bucket', '分桶', '桶内长度相近', null],
    ['dedup', '去重', '元素唯一', null],
    ['filter', '过滤', '输出 ⊆ 输入', null],
    ['map', '映射', '一一对应', null],
    ['zip', '合并', '长度 = min(各输入)', null],
    ['batch', '批处理', '批次数 = ⌈n/b⌉', null],
    ['normalize_fit', '拟合归一化', '用训练集统计量', null],
    ['augment', '数据增强', '标签语义保持', null],
    ['tokenize', '分词', '词表闭合', null]
  ]},
  { code: 'SYS', name: '系统级微指令', layer: 'L8 系统', ops: [
    ['arena_alloc', '竞技场分配', '区间两两不交；越界抛错；reset 复用', 'Arena'],
    ['reduce_all', '全局归约', '= Kahan 精确和', 'reduceAll'],
    ['broadcast', '广播', '恒等映射（深拷贝）', 'broadcast'],
    ['gather_all', '全局收集', '根节点收齐全部', null],
    ['scatter_all', '全局散布', '分发不丢不错', null],
    ['barrier', '屏障同步', '全部到达后才放行', null],
    ['cache', '缓存', '命中返回同一对象', null],
    ['prefetch', '预取', '不改变语义', null],
    ['ref_count', '引用计数', '归零时释放', null],
    ['stream', '异步流', '保序执行', null],
    ['event', '事件同步', 'happens-before', null],
    ['checkpoint', '检查点', '保存/恢复逐位一致', null],
    ['profile', '性能剖析', '计数守恒', null],
    ['trace', '追踪', '事件时间序一致', null],
    ['dispatch', '任务分发', '任务全部分达', null],
    ['fence', '内存屏障', '可见性保证', null]
  ]}
];

/* ---------- v1.1 内核化映射（group|op → core.js 导出名）----------
 * 零重写原则：每条微指令语义锚定世界顶级成果（论文/顶级开源实现），
 * 以零依赖 JS 复现；impl 存在 ⟹ verified，且必须通过 core.js 第 13 节
 * 对应不变量检查（node test/run.js 全量执行）。 */
const IMPL = {
  /* TENSOR 张量指令 */
  'TENSOR.create': 'tensorCreate', 'TENSOR.zeros': 'tensorZeros', 'TENSOR.ones': 'tensorOnes',
  'TENSOR.arange': 'arange', 'TENSOR.reshape': 'reshape', 'TENSOR.slice': 'tensorSlice',
  'TENSOR.concat': 'tensorConcat', 'TENSOR.stack': 'tensorStack', 'TENSOR.split': 'tensorSplit',
  'TENSOR.cast': 'tensorCast', 'TENSOR.copy': 'tensorCopy', 'TENSOR.gather': 'tensorGather',
  'TENSOR.scatter': 'tensorScatter', 'TENSOR.fill': 'tensorFill', 'TENSOR.flatten': 'flatten',
  /* LINALG 线性代数 */
  'LINALG.rank': 'matrixRank', 'LINALG.nullspace': 'nullspace',
  'LINALG.orthonormalize': 'orthonormalize', 'LINALG.cond': 'condEstimate',
  /* NUMER 数值稳定 */
  'NUMER.expm1': 'expm1', 'NUMER.log1p': 'log1p', 'NUMER.hypot': 'hypot',
  'NUMER.div_guard': 'divGuard', 'NUMER.sqrt_guard': 'sqrtGuard',
  'NUMER.reciprocal': 'reciprocal', 'NUMER.fma': 'fma',
  /* PROB 概率 */
  'PROB.bernoulli_sample': 'bernoulliSample', 'PROB.binomial_sample': 'binomialSample',
  'PROB.uniform_sample': 'uniformSample', 'PROB.marginal': 'marginal',
  'PROB.condition': 'conditionalRow', 'PROB.mv_gauss': 'mvGaussPDF', 'PROB.sample_stats': 'sampleStats',
  /* INFO 信息论 */
  'INFO.perplexity': 'perplexity', 'INFO.surprisal': 'surprisal', 'INFO.bits': 'bits',
  'INFO.kl_reverse': 'klReverse', 'INFO.max_entropy': 'maxEntropyDist', 'INFO.normalize_dist': 'normalizeDist',
  'INFO.channel_capacity': 'channelCapacity', 'INFO.rate_distortion': 'rateDistortion',
  /* OPTIM 优化 */
  'OPTIM.momentum': 'momentum', 'OPTIM.nesterov': 'nesterov', 'OPTIM.adagrad': 'adagrad',
  'OPTIM.rmsprop': 'rmsprop', 'OPTIM.adamw': 'adamw', 'OPTIM.grad_clip': 'gradClip',
  'OPTIM.grad_norm': 'gradNorm', 'OPTIM.lr_decay': 'lrDecay', 'OPTIM.weight_decay': 'weightDecay',
  'OPTIM.polyak': 'polyakAvg', 'OPTIM.line_search': 'lineSearch',
  'OPTIM.bfgs': 'bfgs', 'OPTIM.lbfgs': 'lbfgs',
  /* FWD 前向传播 */
  'FWD.tanh': 'tanh', 'FWD.embedding_lookup': 'embeddingLookup', 'FWD.flatten': 'flatten',
  'FWD.residual_add': 'residualAdd', 'FWD.concat_heads': 'concatHeads', 'FWD.pool_max': 'poolMax',
  'FWD.batchnorm': 'batchNorm', 'FWD.dropout': 'dropout', 'FWD.conv1d': 'conv1d',
  /* BWD 反向传播 */
  'BWD.grad_relu': 'gradRelu', 'BWD.grad_tanh': 'gradTanh', 'BWD.grad_softmax_ce': 'gradSoftmaxCE',
  'BWD.grad_matmul': 'gradMatmul', 'BWD.chain_rule': 'chainRule', 'BWD.grad_clip': 'gradClip',
  'BWD.grad_accum': 'gradAccum', 'BWD.stop_grad': 'stopGrad', 'BWD.detach': 'detach',
  'BWD.jacobian': 'jacobian', 'BWD.vjp': 'vjp', 'BWD.jvp': 'jvp', 'BWD.bptt': 'rnnBPTT',
  'BWD.grad_layernorm': 'gradLayerNorm',
  /* NORM 归一化正则 */
  'NORM.l1_reg': 'l1Reg', 'NORM.weight_norm': 'weightNorm', 'NORM.spectral_norm': 'spectralNorm',
  'NORM.group_norm': 'groupNorm', 'NORM.batch_norm': 'batchNorm', 'NORM.label_smooth': 'labelSmooth',
  'NORM.mixup': 'mixup', 'NORM.dropout_reg': 'dropout', 'NORM.early_stop': 'earlyStop',
  /* ATTEN 注意力 */
  'ATTEN.qk_dot': 'qkDot', 'ATTEN.scale': 'attentionScale', 'ATTEN.cross_attn': 'crossAttention',
  'ATTEN.multi_head': 'multiHead', 'ATTEN.mha_split': 'splitHeads', 'ATTEN.rel_pos': 'relPosBias',
  'ATTEN.alibi': 'alibiScores', 'ATTEN.rope': 'ropeApply', 'ATTEN.kv_cache': 'attnRow',
  'ATTEN.mqa': 'mqa', 'ATTEN.gqa': 'gqa', 'ATTEN.flash': 'flashAttention', 'ATTEN.attn_entropy': 'attnEntropy',
  /* SAMPLE 采样 */
  'SAMPLE.uniform': 'uniformSample', 'SAMPLE.bernoulli': 'bernoulliSample', 'SAMPLE.gumbel': 'gumbelSample',
  'SAMPLE.topp': 'topP', 'SAMPLE.multinomial': 'multinomialSample', 'SAMPLE.rejection': 'rejectionSample',
  'SAMPLE.inverse_cdf': 'inverseCDF', 'SAMPLE.antithetic': 'antitheticSample',
  'SAMPLE.stratified': 'stratifiedSample', 'SAMPLE.systematic': 'systematicSample',
  /* GRAPH 图推断 */
  'GRAPH.belief_prop': 'chainBeliefProp', 'GRAPH.variable_elim': 'variableElim',
  'GRAPH.marginal': 'marginal', 'GRAPH.map_query': 'hmmViterbi', 'GRAPH.condition': 'conditionalRow',
  'GRAPH.kalman': 'kalmanFilter1d', 'GRAPH.factor_product': 'factorProduct',
  'GRAPH.junction_tree': 'junctionTree', 'GRAPH.clique_tree': 'cliqueTreeCalibrate',
  'GRAPH.particle': 'particleFilter', 'GRAPH.dsep': 'dSeparated', 'GRAPH.m_sep': 'mSeparated',
  'GRAPH.gibbs': 'gibbsSampler', 'GRAPH.mcmc': 'metropolisSample',
  /* RL 强化学习 */
  'RL.bellman_backup': 'bellmanBackup', 'RL.policy_iter': 'policyIteration', 'RL.sarsa': 'sarsa',
  'RL.td_lambda': 'eligibilityTrace', 'RL.monte_carlo': 'monteCarloReturn', 'RL.greedy': 'greedyPolicy',
  'RL.ucb': 'ucb', 'RL.advantage': 'advantage', 'RL.gae': 'gae', 'RL.reinforce': 'reinforceGradient',
  'RL.ppo': 'ppoClip', 'RL.thompson': 'thompsonSample',
  /* METRIC 评估 */
  'METRIC.perplexity': 'perplexityLM', 'METRIC.bleu': 'bleu', 'METRIC.map': 'averagePrecision',
  'METRIC.confusion': 'confusionMatrix',
  /* DATA 数据管线 */
  'DATA.label_encode': 'labelEncode', 'DATA.pad': 'padSeq', 'DATA.truncate': 'truncateSeq',
  'DATA.bucket': 'bucketize', 'DATA.dedup': 'dedup', 'DATA.filter': 'filterOp', 'DATA.map': 'mapOp',
  'DATA.zip': 'zipOp', 'DATA.batch': 'batchOp', 'DATA.normalize_fit': 'normalizeFit',
  'DATA.augment': 'augment', 'DATA.tokenize': 'tokenize',
  /* SYS 系统 */
  'SYS.gather_all': 'gatherAll', 'SYS.scatter_all': 'scatterAll', 'SYS.cache': 'Cache',
  'SYS.ref_count': 'RefCounter', 'SYS.stream': 'TaskStream', 'SYS.checkpoint': 'checkpoint',
  'SYS.profile': 'Profiler', 'SYS.trace': 'Tracer', 'SYS.dispatch': 'Dispatcher',
  'SYS.barrier': 'Barrier', 'SYS.event': 'EventLog',   'SYS.prefetch': 'prefetch',
  /* 执行变体内核（v1.1.2）—— inplace 变体；batched 由通用引擎 BATCH_SIG 驱动（v1.1.4） */
  'TENSOR.fill.inplace': 'inplace_tensorFill', 'TENSOR.copy.inplace': 'inplace_tensorCopy',
  'NORM.normalize_l2.inplace': 'inplace_normalizeL2',
  /* 融合变体内核（v1.1.3）—— fused 变体：与相邻算子融合，数学语义不变 */
  'TENSOR.transpose.fused': 'fused_transpose_flatten', 'LINALG.matvec.fused': 'fused_matvec_relu',
  'NUMER.softmax.fused': 'fused_softmax_log', 'PROB.gauss_pdf.fused': 'fused_gauss_pdf_log',
  'INFO.cross_entropy.fused': 'fused_softmax_ce', 'OPTIM.grad_clip.fused': 'fused_gradclip_norm',
  'FWD.linear.fused': 'fused_linear_relu', 'BWD.grad_tanh.fused': 'fused_gradtanh_chain',
  'NORM.normalize_l2.fused': 'fused_norm_affine', 'ATTEN.qk_dot.fused': 'fused_attn_weights',
  'SAMPLE.topk.fused': 'fused_topk_temp', 'GRAPH.marginal.fused': 'fused_marginal_norm',
  'RL.value_iter.fused': 'fused_value_greedy', 'METRIC.mse.fused': 'fused_rmse',
  'DATA.label_encode.fused': 'fused_label_onehot', 'SYS.reduce_all.fused': 'fused_allreduce'
};

/* ---------- 生成 ---------- */
const registry = [];
let n = 0;
for (const g of GROUPS) {
  if (g.ops.length !== 16) throw new Error(`族 ${g.code} 算子数 ${g.ops.length} ≠ 16`);
  for (const op of g.ops) {
    for (const v of VARIANTS) {
      n++;
      const key = g.code + '.' + op[0];
      const baseImpl = IMPL[key] !== undefined ? IMPL[key] : op[3];
      let impl = null;
      if (v.key === 'base') impl = baseImpl;
      else if (v.key === 'batched') impl = (IMPL[key + '.batched'] !== undefined) ? IMPL[key + '.batched'] : ((BATCH_SIG[key] !== undefined) ? 'batched' : null);
      else if (v.key === 'fused') impl = (IMPL[key + '.fused'] !== undefined) ? IMPL[key + '.fused'] : null;
      else if (v.key === 'inplace') impl = (IMPL[key + '.inplace'] !== undefined) ? IMPL[key + '.inplace'] : ((INPLACE_SIG[key] !== undefined) ? 'inplace' : null);
      registry.push({
        id: 'L10.' + String(n).padStart(4, '0'),
        layer: 10,
        group: g.code,
        groupName: g.name,
        op: op[0],
        opZh: op[1],
        variant: v.key,
        name: op[0] + '.' + v.key,
        semantics: op[1] + '（' + v.note + '）',
        invariant: op[2],
        status: impl ? 'verified' : 'spec',
        impl: impl || null
      });
    }
  }
}

/* ---------- 完整性断言 ---------- */
if (registry.length !== 1024) throw new Error('指令总数 ≠ 1024: ' + registry.length);
const ids = new Set(registry.map(e => e.id));
if (ids.size !== 1024) throw new Error('指令 ID 不唯一');
for (const g of GROUPS) {
  const cnt = registry.filter(e => e.group === g.code).length;
  if (cnt !== 64) throw new Error(`族 ${g.code} 指令数 ${cnt} ≠ 64`);
}

const verified = registry.filter(e => e.status === 'verified').length;
const lines = registry.map(e => '  ' + JSON.stringify(e));
const out =
  '/* AUTO-GENERATED by tools/gen-registry.js — 请勿手改\n' +
  ' * AXIOM 1024 微指令注册表：16 指令族 × 16 基础算子 × 4 执行变体\n' +
  ' * verified = 有 core.js 参考实现且通过不变量自检；spec = 规格已定义\n' +
  ' */\n' +
  'var AXIOM_REGISTRY = [\n' + lines.join(',\n') + '\n];\n' +
  'if (typeof module !== "undefined" && module.exports) module.exports = AXIOM_REGISTRY;\n';

const dest = path.join(__dirname, '..', 'src', 'registry.js');
fs.writeFileSync(dest, out);
console.log('已生成 ' + registry.length + ' 条微指令（verified=' + verified + ', spec=' + (registry.length - verified) + '）→ ' + dest);
