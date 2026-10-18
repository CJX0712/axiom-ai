# AXIOM 架构与指令集规范

## 1. 十层分解

AXIOM 将"世界顶级 AI"分解为 10 个系统层。下层为上层提供**可验证原语**，上层由下层组合而成：

```
┌────────────────────────────────────────────────────────┐
│ L9  组合应用层    推理编排 / 训练编排（由 L1–L8 组合）  │
├────────────────────────────────────────────────────────┤
│ L8  系统运行时    arena / reduce / broadcast / 同步原语 │ 16/64 verified
├────────────────────────────────────────────────────────┤
│ L7  评估与数据    metrics / split / fold / encode       │ 34/128 verified
├────────────────────────────────────────────────────────┤
│ L6  强化学习      Bellman / VI / TD / Q-Learning / GAE  │ 17/64 verified
├────────────────────────────────────────────────────────┤
│ L5  概率图模型    前向-后向 / Viterbi / BP / VE / D-分离 │ 17/64 verified
├────────────────────────────────────────────────────────┤
│ L4  序列与生成    attention / flash / rope / sampling   │ 34/128 verified
├────────────────────────────────────────────────────────┤
│ L3  表示学习      forward / backward / normalize        │ 52/192 verified
├────────────────────────────────────────────────────────┤
│ L2  监督学习      optimizers（10 种，全部收敛验证）      │ 17/64 verified
├────────────────────────────────────────────────────────┤
│ L1  数学基础      tensor / linalg / numer / prob / info │ 87/320 verified
├────────────────────────────────────────────────────────┤
│ L10 微指令层      16 族 × 16 算子 × 4 变体 = 1024 条    │ 589/1024 verified
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
  "status": "verified",
  "impl": "tensorCreate"
}
```

  字段   约束  
 --- --- 
  `id`   `L10.NNNN`，N ∈ [1,1024]，连续唯一  
  `variant`   ∈ {`base`, `batched`, `fused`, `inplace`}  
  `status`   `verified` ⟺ 存在 `core.js` 参考实现且通过不变量自检；base / batched / fused / inplace 变体均可 verified（batched：沿 batch 维逐位一致；fused：与相邻算子融合输出等于顺序组合；inplace：原地执行逐位一致）  
  `impl`   `core.js` 导出函数名；verified 项必须真实存在（注册表断言校验）  

### 执行变体契约

  变体   语义   降级契约  
 --- --- --- 
  `base`   标量 / 单样本   —  
  `batched`   沿 batch 维独立执行   与逐样本调用**逐位一致**  
  `fused`   与相邻算子融合，消除中间张量物化   数学语义不变（通用 Epilogue 融合引擎 v1.1.6 / v1.1.7 扩面：`fused()` 调度器 + `FUSE_SIG` 签名表 139 个引擎实例，单遍就地尾算子，锚定 cuBLASLt epilogue）  
  `inplace`   原地执行，输入被覆盖   返回值与 out-of-place **逐位一致**（通用原地引擎 v1.1.5：`inplace()` 调度器 + `INPLACE_SIG` 签名表，覆盖 elem/vec 两类原地兼容算子）  

> v1.1.7 引擎规模化扩面：`BATCH_SIG`（67→159）与 `FUSE_SIG`（49→140）扩至全谱 14 族算子，新增 `args` 可变参数类（`f.apply(null, x)` 展平调用）；183 条新签名样本全部经沙盒逐条验证（无异常 + 输出全有限）。

## 3. 指令族目录（16 族 × 16 算子）

  族   名称   层   verified   代表算子  
 --- --- --- --- --- 
  TENSOR   张量指令   L1   16/16   create/reshape/transpose/slice/gather  
  LINALG   线性代数指令   L1   16/16   matmul/cholesky/qr/eigen/pca/rank/nullspace/cond  
  NUMER   数值稳定指令   L1   16/16   logsumexp/softmax/kahan/fma(Dekker)/gelu  
  PROB   概率运算指令   L1   16/16   gauss_pdf/mv_gauss/bayes/sample_stats  
  INFO   信息论指令   L1   16/16   entropy/kl/channel_capacity(AB)/max_entropy  
  OPTIM   优化算子指令   L2   16/16   gd/adam/cg/momentum/nesterov/adamw/line_search  
  FWD   前向传播指令   L3   16/16   linear/layernorm/self_attn/batchnorm/conv1d  
  BWD   反向传播指令   L3   16/16   grad_check/grad_matmul/vjp/jvp/bptt  
  NORM   归一化正则指令   L3   16/16   l1/l2/zscore/spectral_norm/group_norm/mixup  
  ATTEN   注意力指令   L4   16/16   flash/rope/alibi/mqa/gqa/kv_cache  
  SAMPLE   采样生成指令   L4   16/16   box_muller/topp/rejection/antithetic/stratified  
  GRAPH   图推断指令   L5   16/16   forward_backward/viterbi/variable_elim/dsep/particle  
  RL   强化学习指令   L6   16/16   value_iter/q_learn/sarsa/gae/ppo/thompson  
  METRIC   评估度量指令   L7   16/16   accuracy/auc/bleu/map/confusion  
  DATA   数据管线指令   L7   16/16   shuffle/kfold/onehot/normalize_fit/tokenize  
  SYS   系统级微指令   L8   15/16   arena/reduce/broadcast/checkpoint/dispatch  

完整 1024 条规格见 [ISA-1024.md](ISA-1024.md) 或运行 `node -e "console.table(require('./src/registry.js'))"`。

## 4. 核心 API 面（core.js）

```
linalg    matMul matVec transpose trace det inverse solveLinear cholesky qrDecompose
          jacobiEigen powerIteration pca matrixRank nullspace orthonormalize condEstimate
numer     logsumexp softmax sigmoid gelu erf normalCDF kahanSum exactSum fma clip
          divGuard sqrtGuard expm1 log1p hypot
prob      gaussPDF mvGaussPDF expectation variance covariance normalSample categoricalSample
          bayesUpdate uniformSample bernoulliSample binomialSample sampleStats marginal conditionalRow
info      entropy crossEntropy klDivergence jsDivergence mutualInfo conditionalEntropy gini infoGain
          perplexity surprisal bits klReverse maxEntropyDist normalizeDist channelCapacity rateDistortion
optim     gradientDescent adam conjugateGradient momentum nesterov rmsprop adagrad adamw
          gradClip gradNorm lrDecay weightDecay polyakAvg lineSearch wolfeLineSearch bfgs lbfgs
models    linearRegression logisticRegression kmeans gmmEM knn decisionTree
          mlpTrain gradientCheck
dl        linear layerNorm selfAttention embeddingLookup batchNorm groupNorm dropout conv1d
          splitHeads concatHeads poolMax residualAdd
attn      qkDot crossAttention multiHead ropeApply attnRow mqa gqa flashAttention
          relPosBias alibiScores attnEntropy
autodiff  numericJacobian jacobian vjp jvp chainRule gradRelu gradTanh gradSoftmaxCE
          gradMatmul gradAccum rnnForward rnnBPTT gradLayerNorm
graph     hmmForwardBackward hmmViterbi chainBeliefProp variableElim factorProduct sumOut
          junctionTree cliqueTreeCalibrate kalmanFilter1d dSeparated mSeparated particleFilter
          gibbsSampler metropolisSample
rl        valueIteration td0Sweep qLearning epsilonGreedy bellmanBackup policyIteration sarsa
          eligibilityTrace monteCarloReturn greedyPolicy ucb advantage gae reinforceGradient
          ppoClip thompsonSample
metric    accuracy precision recall f1 auc r2 mse mae logLoss cosineSimilarity editDistance
          silhouette perplexityLM bleu averagePrecision confusionMatrix
data      l1Norm l2Norm linfNorm normalizeL2 minmaxScale zscore l2Reg temperatureSoftmax topK
          shuffle trainTestSplit kFold oneHot labelEncode padSeq bucketize dedup normalizeFit
          augment tokenize batchOp zipOp
sys       Arena reduceAll broadcast gatherAll scatterAll Cache RefCounter TaskStream
          checkpoint Profiler Tracer Dispatcher Barrier EventLog prefetch
selftest  runChecks() → { total, passed, results[] }
```

## 5. L9 组合应用层（管线编排）

L9 不新增指令：将 L1–L8 的已验证微指令按序组合为推理/训练管线。控制台「管线编排」视图提供：

- **3 条预设管线**：Softmax 温度采样（temperatureSoftmax → topK）、归一化+激活（zscore → gelu）、注意力打分→熵（softmax → entropy）
- **自定义管线**：从 14 个 vec→vec 算子池中选择、输入任意向量、逐步执行并展示每步的输入/输出张量与所携带的不变量

管线的每一步都由通过不变量自检的微指令驱动——组合层的正确性由构件层的可验证性传递保证。

## 6. 扩展指令集

新增一条微指令的流程：

1. 在 `tools/gen-registry.js` 对应族的 `ops` 数组中追加 `[算子名, 中文名, 不变量, impl]`（或在 `IMPL` 映射中登记）
2. 在 `src/core.js` 实现该算子（若声称 verified）
3. `node tools/gen-registry.js && node test/run.js` —— 注册表断言会校验总数/唯一性/每族 64/impl 真实存在
4. 在 `src/core.js` 第 13 节检查表中追加不变量检查（必须可被独立复算）
5. `node tools/gen-verification.js && node tools/gen-isa-doc.js` —— 文档随实测重生
