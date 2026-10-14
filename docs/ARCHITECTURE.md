# AXIOM 架构与指令集规范

## 1. 十层分解

AXIOM 将"世界顶级 AI"分解为 10 个系统层。下层为上层提供**可验证原语**，上层由下层组合而成：

```
┌────────────────────────────────────────────────────────┐
│ L9  组合应用层    推理编排 / 训练编排（由 L1–L8 组合）  │
├────────────────────────────────────────────────────────┤
│ L8  系统运行时    arena / reduce / broadcast / 同步原语 │ 64 条
├────────────────────────────────────────────────────────┤
│ L7  评估与数据    metrics / split / fold / encode       │ 128 条
├────────────────────────────────────────────────────────┤
│ L6  强化学习      Bellman / VI / TD / Q-Learning        │ 64 条
├────────────────────────────────────────────────────────┤
│ L5  概率图模型    forward-backward / Viterbi / BP       │ 64 条
├────────────────────────────────────────────────────────┤
│ L4  序列与生成    attention / sampling                  │ 128 条
├────────────────────────────────────────────────────────┤
│ L3  表示学习      forward / backward / normalize        │ 192 条
├────────────────────────────────────────────────────────┤
│ L2  监督学习      optimizers                            │ 64 条
├────────────────────────────────────────────────────────┤
│ L1  数学基础      tensor / linalg / numer / prob / info │ 320 条
├────────────────────────────────────────────────────────┤
│ L10 微指令层      16 族 × 16 算子 × 4 变体 = 1024 条    │
└────────────────────────────────────────────────────────┘
```

## 2. 微指令格式（L10）

每条微指令是一个不可变记录：

```json
{
  "id": "L10.0001",
  "layer": 10,
  "group": "TENSOR",
  "groupName": "张量指令",
  "op": "create",
  "opZh": "创建张量",
  "variant": "base",
  "name": "create.base",
  "semantics": "创建张量（标量/单样本语义）",
  "invariant": "元素总数 = ∏ shape",
  "status": "spec",
  "impl": null
}
```

| 字段 | 约束 |
|---|---|
| `id` | `L10.NNNN`，N ∈ [1,1024]，连续唯一 |
| `variant` | ∈ {`base`, `batched`, `fused`, `inplace`} |
| `status` | `verified` ⟺ 存在 `core.js` 参考实现且通过不变量自检；仅 `base` 变体可 verified |
| `impl` | `core.js` 导出函数名；verified 项必须真实存在 |

### 执行变体契约

| 变体 | 语义 | 降级契约 |
|---|---|---|
| `base` | 标量 / 单样本 | — |
| `batched` | 沿 batch 维独立执行 | 与逐样本调用**逐位一致** |
| `fused` | 与相邻算子融合，消除中间张量物化 | 数学语义不变 |
| `inplace` | 原地执行，输入被覆盖 | 返回值与 out-of-place **逐位一致** |

## 3. 指令族目录（16 族 × 16 算子）

| 族 | 名称 | 层 | 代表算子 |
|---|---|---|---|
| TENSOR | 张量指令 | L1 | create/reshape/transpose/slice/gather |
| LINALG | 线性代数指令 | L1 | matmul/cholesky/qr/eigen/pca/solve |
| NUMER | 数值稳定指令 | L1 | logsumexp/softmax/kahan/gelu/erf |
| PROB | 概率运算指令 | L1 | gauss_pdf/gauss_cdf/bayes/expectation |
| INFO | 信息论指令 | L1 | entropy/kl/js/mutual_info/info_gain |
| OPTIM | 优化算子指令 | L2 | gd/adam/cg/momentum/lbfgs |
| FWD | 前向传播指令 | L3 | linear/layernorm/self_attn/gelu |
| BWD | 反向传播指令 | L3 | grad_check/grad_linear/jacobian/vjp |
| NORM | 归一化正则指令 | L3 | l1/l2/zscore/minmax/l2_reg |
| ATTEN | 注意力指令 | L4 | softmax_attn/causal_mask/self_attn/rope |
| SAMPLE | 采样生成指令 | L4 | box_muller/categorical/temperature/topk |
| GRAPH | 图推断指令 | L5 | forward_backward/viterbi/belief_prop |
| RL | 强化学习指令 | L6 | value_iter/q_learn/td0/epsilon_greedy |
| METRIC | 评估度量指令 | L7 | accuracy/precision/recall/auc/r2 |
| DATA | 数据管线指令 | L7 | shuffle/train_test/kfold/onehot |
| SYS | 系统级微指令 | L8 | arena_alloc/reduce_all/broadcast |

完整 1024 条见 `src/registry.js` 或运行 `node -e "console.table(require('./src/registry.js'))"`。

## 4. 核心 API 面（core.js）

```
linalg    matMul matVec transpose trace det inverse solveLinear cholesky qrDecompose
          jacobiEigen powerIteration pca
numer     logsumexp softmax sigmoid gelu erf normalCDF kahanSum exactSum clip
prob      gaussPDF expectation variance covariance normalSample categoricalSample bayesUpdate
info      entropy crossEntropy klDivergence jsDivergence mutualInfo conditionalEntropy gini infoGain
optim     gradientDescent adam conjugateGradient
models    linearRegression logisticRegression kmeans gmmEM knn decisionTree
          mlpTrain gradientCheck
dl        linear layerNorm selfAttention
graph     hmmForwardBackward hmmViterbi
rl        valueIteration td0Sweep qLearning epsilonGreedy
metric    accuracy precision recall f1 auc mse mae r2 logLoss cosineSimilarity editDistance silhouette
data      l1Norm l2Norm linfNorm normalizeL2 minmaxScale zscore l2Reg temperatureSoftmax topK
          shuffle trainTestSplit kFold oneHot
sys       Arena reduceAll broadcast
selftest  runChecks() → { total, passed, results[] }
```

## 5. 扩展指令集

新增一条微指令的流程：

1. 在 `tools/gen-registry.js` 对应族的 `ops` 数组中追加 `[算子名, 中文名, 不变量, impl]`
2. 在 `src/core.js` 实现该算子（若声称 verified）
3. `node tools/gen-registry.js && node test/run.js` —— 注册表断言会校验总数/唯一性/每族 64/impl 真实存在
4. 在 `src/core.js` 的 checks 表中追加不变量检查
