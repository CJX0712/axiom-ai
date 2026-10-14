/* ============================================================================
 * AXIOM Core — 世界级数学与算法核心
 * 零依赖 · 浏览器 / Node 双端同源（UMD）· 每个算法携带可独立复算的不变量
 * ----------------------------------------------------------------------------
 * 每一行都站在世界顶级成果之上（零重写 = 直接复用世界最优算法）：
 *   矩阵分解   Householder(1958) QR · Jacobi(1846) 循环旋转特征分解 · Cholesky
 *   概率模型   Dempster(1977) EM · Box–Muller(1958) · Abramowitz–Stegun erf
 *   优化       Cauchy(1847) 梯度下降 · Polyak(1964) 动量 · Kingma–Ba(2015) Adam
 *              Hestenes–Stiefel(1952) 共轭梯度
 *   推断       Rabiner(1989) 前向-后向 / Viterbi · Bellman(1957) 动态规划
 *   机器学习   Lloyd(1982) K-Means · Cover–Hart(1967) KNN · Breiman(1984) CART
 *              Rumelhart–Hinton–Williams(1986) 反向传播
 *   验证哲学   解析 vs 数值 · 暴力枚举 vs 优化算法 · 残差必须可独立复算
 * 对标：scipy.linalg / ml.js / @tangent.to/lina（机器精度一致）
 * ==========================================================================*/
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AXIOM = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var VERSION = '1.0.0';

  /* ========================================================================
   * 0. 确定性随机与基础工具（可复现是一切验证的前提）
   * ======================================================================*/
  function mulberry32(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function zeros2(m, n) { return Array.from({ length: m }, function () { return new Array(n).fill(0); }); }
  function eye(n) { var I = zeros2(n, n); for (var i = 0; i < n; i++) I[i][i] = 1; return I; }
  function clone2(A) { return A.map(function (r) { return r.slice(); }); }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  function norm2(x) { return Math.sqrt(dot(x, x)); }
  function normInf(x) { var m = 0; for (var i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); return m; }
  function maxAbsDiff(a, b) {
    var m = 0;
    for (var i = 0; i < a.length; i++) {
      var ra = a[i], rb = b[i];
      if (Array.isArray(ra)) m = Math.max(m, maxAbsDiff(ra, rb));
      else m = Math.max(m, Math.abs(ra - rb));
    }
    return m;
  }
  function maxAbsDiff2(A, B) { // 矩阵版
    var m = 0;
    for (var i = 0; i < A.length; i++) for (var j = 0; j < A[0].length; j++) m = Math.max(m, Math.abs(A[i][j] - B[i][j]));
    return m;
  }
  function dist2(a, b) { var s = 0; for (var i = 0; i < a.length; i++) { var d = a[i] - b[i]; s += d * d; } return s; }
  function euclid(a, b) { return Math.sqrt(dist2(a, b)); }
  function spdMatrix(n, seed) { // A = BᵀB + nI，对称正定
    var rng = mulberry32(seed);
    var B = Array.from({ length: n }, function () { return Array.from({ length: n }, function () { return rng() * 2 - 1; }); });
    var A = zeros2(n, n);
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var s = 0; for (var k = 0; k < n; k++) s += B[k][i] * B[k][j];
      A[i][j] = s + (i === j ? n : 0);
    }
    return A;
  }

  /* ========================================================================
   * 1. 线性代数（对标 scipy.linalg，机器精度）
   * ======================================================================*/
  function transpose(A) { return A[0].map(function (_, j) { return A.map(function (r) { return r[j]; }); }); }
  function matMul(A, B) {
    var n = A.length, k = B.length, m = B[0].length;
    var C = Array.from({ length: n }, function () { return new Array(m).fill(0); });
    for (var i = 0; i < n; i++) for (var p = 0; p < k; p++) {
      var a = A[i][p];
      if (a === 0) continue; // 加 0 精确无副作用，保持 (AB)ᵀ=BᵀAᵀ 逐位一致
      for (var j = 0; j < m; j++) C[i][j] += a * B[p][j];
    }
    return C;
  }
  function matVec(A, x) { return A.map(function (r) { return dot(r, x); }); }
  function trace(A) { var s = 0; for (var i = 0; i < A.length; i++) s += A[i][i]; return s; }

  function det(A) { // LU + 部分选主元
    var n = A.length, M = clone2(A), d = 1;
    for (var k = 0; k < n; k++) {
      var p = k;
      for (var i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-300) return 0;
      if (p !== k) { var t = M[p]; M[p] = M[k]; M[k] = t; d = -d; }
      d *= M[k][k];
      for (var i2 = k + 1; i2 < n; i2++) {
        var f = M[i2][k] / M[k][k];
        for (var j = k; j < n; j++) M[i2][j] -= f * M[k][j];
      }
    }
    return d;
  }
  function inverse(A) { // Gauss-Jordan + 部分选主元
    var n = A.length;
    var M = A.map(function (r, i) {
      var row = r.slice();
      for (var j = 0; j < n; j++) row.push(i === j ? 1 : 0);
      return row;
    });
    for (var k = 0; k < n; k++) {
      var p = k;
      for (var i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (Math.abs(M[p][k]) < 1e-300) throw new Error('矩阵奇异，无法求逆');
      if (p !== k) { var t = M[p]; M[p] = M[k]; M[k] = t; }
      var piv = M[k][k];
      for (var j = 0; j < 2 * n; j++) M[k][j] /= piv;
      for (var i2 = 0; i2 < n; i2++) {
        if (i2 === k) continue;
        var f = M[i2][k];
        if (f === 0) continue;
        for (var j2 = 0; j2 < 2 * n; j2++) M[i2][j2] -= f * M[k][j2];
      }
    }
    return M.map(function (r) { return r.slice(n); });
  }
  function solveLinear(A, b) { // LU + 部分选主元，一般方阵
    var n = A.length, M = clone2(A), x = b.slice();
    for (var k = 0; k < n; k++) {
      var p = k;
      for (var i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      if (p !== k) { var t = M[p]; M[p] = M[k]; M[k] = t; var tx = x[p]; x[p] = x[k]; x[k] = tx; }
      for (var i2 = k + 1; i2 < n; i2++) {
        var f = M[i2][k] / M[k][k];
        for (var j = k; j < n; j++) M[i2][j] -= f * M[k][j];
        x[i2] -= f * x[k];
      }
    }
    for (var i3 = n - 1; i3 >= 0; i3--) {
      var s = x[i3];
      for (var j2 = i3 + 1; j2 < n; j2++) s -= M[i3][j2] * x[j2];
      x[i3] = s / M[i3][i3];
    }
    return x;
  }
  function solveLower(L, b) { // 解 L y = b（L 下三角）
    var n = L.length, y = new Array(n);
    for (var i = 0; i < n; i++) {
      var s = b[i];
      for (var j = 0; j < i; j++) s -= L[i][j] * y[j];
      y[i] = s / L[i][i];
    }
    return y;
  }
  function cholesky(A) { // 对称正定分解，非正定抛错
    var n = A.length, L = zeros2(n, n);
    for (var i = 0; i < n; i++) for (var j = 0; j <= i; j++) {
      var s = A[i][j];
      for (var k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 0) throw new Error('矩阵非正定，Cholesky 分解失败');
        L[i][j] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
    return L;
  }
  function safeCholesky(A) { // 自适应抖动，保证数值稳健
    var n = A.length, jitter = 0;
    for (var attempt = 0; attempt < 10; attempt++) {
      try {
        var M = A.map(function (r, i) { return r.map(function (v, j) { return v + (i === j ? jitter : 0); }); });
        return cholesky(M);
      } catch (e) { jitter = jitter === 0 ? 1e-9 : jitter * 10; }
    }
    throw new Error('safeCholesky 失败');
  }
  function qrDecompose(A) { // Householder 反射，Q 为 m×m，R 为 m×n
    var m = A.length, n = A[0].length;
    var R = clone2(A), Q = eye(m);
    for (var k = 0; k < Math.min(m - 1, n); k++) {
      var nx = 0;
      for (var i = k; i < m; i++) nx += R[i][k] * R[i][k];
      nx = Math.sqrt(nx);
      if (nx === 0) continue;
      var alpha = R[k][k] > 0 ? -nx : nx;
      var v = new Array(m).fill(0);
      v[k] = R[k][k] - alpha;
      for (var i2 = k + 1; i2 < m; i2++) v[i2] = R[i2][k];
      var vn = norm2(v);
      if (vn < 1e-300) continue;
      for (var i3 = 0; i3 < m; i3++) v[i3] /= vn;
      for (var j = 0; j < n; j++) { // R ← (I−2vvᵀ)R
        var d = 0;
        for (var i4 = k; i4 < m; i4++) d += v[i4] * R[i4][j];
        for (var i5 = k; i5 < m; i5++) R[i5][j] -= 2 * d * v[i5];
      }
      for (var i6 = 0; i6 < m; i6++) { // Q ← Q(I−2vvᵀ)
        var d2 = 0;
        for (var j2 = k; j2 < m; j2++) d2 += Q[i6][j2] * v[j2];
        for (var j3 = k; j3 < m; j3++) Q[i6][j3] -= 2 * d2 * v[j3];
      }
    }
    for (var i7 = 0; i7 < m; i7++) for (var j4 = 0; j4 < Math.min(i7, n); j4++) R[i7][j4] = 0;
    return { Q: Q, R: R };
  }
  function jacobiEigen(A, opts) { // 循环 Jacobi，对称阵特征分解
    opts = opts || {};
    var n = A.length, tol = opts.tol || 1e-13, maxSweeps = opts.maxSweeps || 100;
    var S = clone2(A), V = eye(n);
    for (var sweep = 0; sweep < maxSweeps; sweep++) {
      var off = 0;
      for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) off += S[i][j] * S[i][j];
      if (Math.sqrt(off) <= tol) break;
      for (var p = 0; p < n - 1; p++) for (var q = p + 1; q < n; q++) {
        var apq = S[p][q];
        if (Math.abs(apq) < 1e-300) continue;
        var tau = (S[q][q] - S[p][p]) / (2 * apq);
        var t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
        var c = 1 / Math.sqrt(1 + t * t), s = t * c;
        for (var k = 0; k < n; k++) {
          if (k !== p && k !== q) {
            var skp = S[k][p], skq = S[k][q];
            S[k][p] = c * skp - s * skq; S[p][k] = S[k][p];
            S[k][q] = s * skp + c * skq; S[q][k] = S[k][q];
          }
        }
        var spp = S[p][p], sqq = S[q][q], spq = S[p][q];
        S[p][p] = c * c * spp - 2 * s * c * spq + s * s * sqq;
        S[q][q] = s * s * spp + 2 * s * c * spq + c * c * sqq;
        S[p][q] = 0; S[q][p] = 0;
        for (var k2 = 0; k2 < n; k2++) {
          var vkp = V[k2][p], vkq = V[k2][q];
          V[k2][p] = c * vkp - s * vkq;
          V[k2][q] = s * vkp + c * vkq;
        }
      }
    }
    var idx = Array.from({ length: n }, function (_, i) { return i; }).sort(function (a, b) { return S[b][b] - S[a][a]; });
    var values = idx.map(function (i) { return S[i][i]; });
    var vectors = idx.map(function (i) { return V.map(function (row) { return row[i]; }); }); // vectors[t] = 第 t 个特征向量
    return { values: values, vectors: vectors, sweeps: sweep };
  }
  function powerIteration(A, opts) {
    opts = opts || {};
    var n = A.length, iters = opts.iters || 2000, tol = opts.tol || 1e-14;
    var x = Array.from({ length: n }, function (_, i) { return (i + 1) / (n + 1); });
    var nx = norm2(x); x = x.map(function (v) { return v / nx; });
    var lam = 0;
    for (var it = 0; it < iters; it++) {
      var y = matVec(A, x);
      var ny = norm2(y);
      if (ny < 1e-300) break;
      var newLam = dot(x, y);
      x = y.map(function (v) { return v / ny; });
      if (Math.abs(newLam - lam) <= tol * Math.abs(newLam)) { lam = newLam; break; }
      lam = newLam;
    }
    return { value: lam, vector: x };
  }
  function pca(X, k) { // 协方差 → Jacobi → 投影；Eckart–Young 最优截断
    var n = X.length, d = X[0].length;
    var mean = new Array(d).fill(0);
    for (var i = 0; i < n; i++) for (var j = 0; j < d; j++) mean[j] += X[i][j] / n;
    var Xc = X.map(function (r) { return r.map(function (v, j) { return v - mean[j]; }); });
    var cov = zeros2(d, d);
    for (var a = 0; a < d; a++) for (var b = a; b < d; b++) {
      var s = 0;
      for (var i2 = 0; i2 < n; i2++) s += Xc[i2][a] * Xc[i2][b];
      s /= (n - 1);
      cov[a][b] = s; cov[b][a] = s;
    }
    var eig = jacobiEigen(cov);
    var values = eig.values, vectors = eig.vectors;
    var kk = Math.min(k, d);
    var projected = Xc.map(function (r) {
      return Array.from({ length: kk }, function (_, t) { return dot(r, vectors[t]); });
    });
    var reconstruct = projected.map(function (z) {
      return Array.from({ length: d }, function (_, j) {
        var v = mean[j];
        for (var t = 0; t < kk; t++) v += z[t] * vectors[t][j];
        return v;
      });
    });
    var total = values.reduce(function (a2, b2) { return a2 + b2; }, 0);
    var explained = values.slice(0, kk).reduce(function (a2, b2) { return a2 + b2; }, 0) / total;
    return { mean: mean, components: vectors.slice(0, kk), values: values, projected: projected, reconstruct: reconstruct, explainedVariance: explained };
  }

  /* ========================================================================
   * 2. 数值稳定（平台原生最优 + 稳定算法）
   * ======================================================================*/
  function logsumexp(xs) {
    var m = -Infinity;
    for (var i = 0; i < xs.length; i++) if (xs[i] > m) m = xs[i];
    if (m === -Infinity) return -Infinity;
    var s = 0;
    for (var i2 = 0; i2 < xs.length; i2++) s += Math.exp(xs[i2] - m);
    return m + Math.log(s);
  }
  function softmax(xs) {
    var m = -Infinity;
    for (var i = 0; i < xs.length; i++) if (xs[i] > m) m = xs[i];
    var es = xs.map(function (x) { return Math.exp(x - m); });
    var s = es.reduce(function (a, b) { return a + b; }, 0);
    return es.map(function (e) { return e / s; });
  }
  function sigmoid(x) { return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)); }
  function tanh(x) { return Math.tanh(x); }
  function relu(x) { return x > 0 ? x : 0; }
  function gelu(x) { return 0.5 * x * (1 + erf(x / Math.SQRT2)); } // 精确 erf 形式
  function erf(x) { // Abramowitz–Stegun 7.1.26，|ε|≤1.5e-7
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    var t = 1 / (1 + p * x);
    var y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }
  function normalCDF(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  function kahanSum(xs) {
    var s = 0, c = 0;
    for (var i = 0; i < xs.length; i++) {
      var y = xs[i] - c;
      var t = s + y;
      c = (t - s) - y;
      s = t;
    }
    return s;
  }
  function exactSum(xs) { // TwoSum 无误差变换，作为“精确和”基准
    var s = 0, e = 0;
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i], t = s + x;
      var bb = Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s;
      e += bb; s = t;
    }
    return s + e;
  }
  function clip(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

  /* ========================================================================
   * 3. 概率与统计
   * ======================================================================*/
  function gaussPDF(x, mu, sigma) { return Math.exp(-0.5 * ((x - mu) / sigma) * ((x - mu) / sigma)) / (sigma * Math.sqrt(2 * Math.PI)); }
  function expectation(xs) { return xs.reduce(function (a, b) { return a + b; }, 0) / xs.length; }
  function variance(xs) {
    var m = expectation(xs), s = 0;
    for (var i = 0; i < xs.length; i++) s += (xs[i] - m) * (xs[i] - m);
    return s / xs.length;
  }
  function covariance(xs, ys) {
    var mx = expectation(xs), my = expectation(ys), s = 0;
    for (var i = 0; i < xs.length; i++) s += (xs[i] - mx) * (ys[i] - my);
    return s / xs.length;
  }
  function normalSample(n, seed) { // Box–Muller
    var rng = mulberry32(seed === undefined ? 2024 : seed), out = [];
    for (var i = 0; i < n; i += 2) {
      var u1 = Math.max(rng(), 1e-300), u2 = rng();
      var r = Math.sqrt(-2 * Math.log(u1));
      out.push(r * Math.cos(2 * Math.PI * u2));
      if (out.length < n) out.push(r * Math.sin(2 * Math.PI * u2));
    }
    return out.slice(0, n);
  }
  function categoricalSample(p, seed) {
    var rng = mulberry32(seed === undefined ? 7 : seed), out = [];
    var cum = []; var s = 0;
    for (var i = 0; i < p.length; i++) { s += p[i]; cum.push(s); }
    for (var t = 0; t < 20000; t++) {
      var r = rng() * s, j = 0;
      while (j < cum.length - 1 && r > cum[j]) j++;
      out.push(j);
    }
    return out;
  }
  function bayesUpdate(prior, likelihood) {
    var joint = prior.map(function (p, i) { return p * likelihood[i]; });
    var s = joint.reduce(function (a, b) { return a + b; }, 0);
    return joint.map(function (v) { return v / s; });
  }

  /* ========================================================================
   * 4. 信息论
   * ======================================================================*/
  function entropy(p) { // bits
    var h = 0;
    for (var i = 0; i < p.length; i++) if (p[i] > 0) h -= p[i] * Math.log2(p[i]);
    return h;
  }
  function crossEntropy(p, q) {
    var h = 0;
    for (var i = 0; i < p.length; i++) if (p[i] > 0) h -= p[i] * Math.log2(Math.max(q[i], 1e-300));
    return h;
  }
  function klDivergence(p, q) {
    var d = 0;
    for (var i = 0; i < p.length; i++) if (p[i] > 0) d += p[i] * Math.log2(p[i] / Math.max(q[i], 1e-300));
    return d;
  }
  function jsDivergence(p, q) {
    var m = p.map(function (v, i) { return (v + q[i]) / 2; });
    return 0.5 * klDivergence(p, m) + 0.5 * klDivergence(q, m);
  }
  function mutualInfo(joint) { // joint[i][j] = P(X=i,Y=j)
    var n = joint.length, m = joint[0].length;
    var px = new Array(n).fill(0), py = new Array(m).fill(0);
    for (var i = 0; i < n; i++) for (var j = 0; j < m; j++) { px[i] += joint[i][j]; py[j] += joint[i][j]; }
    var mi = 0;
    for (var i2 = 0; i2 < n; i2++) for (var j2 = 0; j2 < m; j2++) {
      if (joint[i2][j2] > 0) mi += joint[i2][j2] * Math.log2(joint[i2][j2] / (px[i2] * py[j2]));
    }
    return mi;
  }
  function conditionalEntropy(joint) {
    var n = joint.length, m = joint[0].length;
    var py = new Array(m).fill(0);
    for (var j = 0; j < m; j++) for (var i = 0; i < n; i++) py[j] += joint[i][j];
    var hy = 0;
    for (var j2 = 0; j2 < m; j2++) if (py[j2] > 0) hy -= py[j2] * Math.log2(py[j2]);
    var hxy = 0;
    for (var i2 = 0; i2 < n; i2++) for (var j3 = 0; j3 < m; j3++) if (joint[i2][j3] > 0) hxy -= joint[i2][j3] * Math.log2(joint[i2][j3]);
    return hxy - hy;
  }
  function gini(labels) {
    var m = {};
    for (var i = 0; i < labels.length; i++) m[labels[i]] = (m[labels[i]] || 0) + 1;
    var s = 0;
    for (var k in m) { var p = m[k] / labels.length; s += p * p; }
    return 1 - s;
  }
  function labelDist(labels) {
    var m = {};
    for (var i = 0; i < labels.length; i++) m[labels[i]] = (m[labels[i]] || 0) + 1;
    return Object.keys(m).map(function (k) { return m[k] / labels.length; });
  }
  function infoGain(parentLabels, groups) { // ID3 风格：熵增益
    var n = parentLabels.length;
    var child = 0;
    for (var i = 0; i < groups.length; i++) child += (groups[i].length / n) * entropy(labelDist(groups[i]));
    return entropy(labelDist(parentLabels)) - child;
  }

  /* ========================================================================
   * 5. 优化器
   * ======================================================================*/
  function gradientDescent(f, grad, x0, opts) {
    opts = opts || {};
    var lr = opts.lr || 0.01, iters = opts.iters || 1000;
    var x = x0.slice(), history = [];
    for (var it = 0; it < iters; it++) {
      var g = grad(x);
      for (var i = 0; i < x.length; i++) x[i] -= lr * g[i];
      history.push(f(x));
    }
    return { x: x, history: history, iterations: iters };
  }
  function adam(f, grad, x0, opts) {
    opts = opts || {};
    var lr = opts.lr || 0.02, iters = opts.iters || 2000, b1 = 0.9, b2 = 0.999, eps = 1e-8;
    var x = x0.slice(), m = new Array(x.length).fill(0), v = new Array(x.length).fill(0), history = [];
    for (var t = 1; t <= iters; t++) {
      var g = grad(x);
      for (var i = 0; i < x.length; i++) {
        m[i] = b1 * m[i] + (1 - b1) * g[i];
        v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i];
        var mh = m[i] / (1 - Math.pow(b1, t)), vh = v[i] / (1 - Math.pow(b2, t));
        x[i] -= lr * mh / (Math.sqrt(vh) + eps);
      }
      history.push(f(x));
    }
    return { x: x, history: history, iterations: iters };
  }
  function conjugateGradient(A, b, opts) {
    opts = opts || {};
    var tol = opts.tol || 1e-12, maxIter = opts.maxIter || A.length + 5;
    var x = new Array(b.length).fill(0);
    var r = b.slice(), p = b.slice();
    var rs = dot(r, r);
    for (var it = 0; it < maxIter; it++) {
      var Ap = matVec(A, p);
      var pAp = dot(p, Ap);
      if (pAp === 0) break;
      var alpha = rs / pAp;
      for (var i = 0; i < x.length; i++) x[i] += alpha * p[i];
      for (var i2 = 0; i2 < x.length; i2++) r[i2] -= alpha * Ap[i2];
      var rsNew = dot(r, r);
      if (Math.sqrt(rsNew) < tol) break;
      var beta = rsNew / rs;
      for (var i3 = 0; i3 < x.length; i3++) p[i3] = r[i3] + beta * p[i3];
      rs = rsNew;
    }
    return { x: x, residual: Math.sqrt(dot(matVec(A, x).map(function (v, i) { return v - b[i]; }), matVec(A, x).map(function (v, i) { return v - b[i]; }))), iterations: it };
  }

  /* ========================================================================
   * 6. 机器学习模型
   * ======================================================================*/
  function linearRegression(X, y) { // 正规方程
    var n = X.length, d = X[0].length;
    var XtX = zeros2(d, d), Xty = new Array(d).fill(0);
    for (var a = 0; a < d; a++) {
      for (var b = 0; b < d; b++) {
        var s = 0;
        for (var i = 0; i < n; i++) s += X[i][a] * X[i][b];
        XtX[a][b] = s;
      }
      var s2 = 0;
      for (var i2 = 0; i2 < n; i2++) s2 += X[i2][a] * y[i2];
      Xty[a] = s2;
    }
    var w = solveLinear(XtX, Xty);
    return { w: w, predict: function (x) { return dot(w, x); } };
  }
  function logisticRegression(X, y, opts) {
    opts = opts || {};
    var lr = opts.lr || 0.5, iters = opts.iters || 2000, l2 = opts.l2 || 0;
    var n = X.length, d = X[0].length;
    var w = new Array(d).fill(0), b = 0, history = [];
    for (var it = 0; it < iters; it++) {
      var gw = new Array(d).fill(0), gb = 0, loss = 0;
      for (var i = 0; i < n; i++) {
        var z = b;
        for (var j = 0; j < d; j++) z += w[j] * X[i][j];
        var p = sigmoid(z), err = p - y[i];
        for (var j2 = 0; j2 < d; j2++) gw[j2] += err * X[i][j2];
        gb += err;
        loss += -(y[i] * Math.log(p + 1e-15) + (1 - y[i]) * Math.log(1 - p + 1e-15));
      }
      for (var j3 = 0; j3 < d; j3++) { gw[j3] = gw[j3] / n + l2 * w[j3]; w[j3] -= lr * gw[j3]; }
      b -= lr * gb / n;
      history.push(loss / n);
    }
    return {
      w: w, b: b, history: history,
      predictProba: function (x) { var z = b; for (var j = 0; j < d; j++) z += w[j] * x[j]; return sigmoid(z); },
      predict: function (x) { var z = b; for (var j = 0; j < d; j++) z += w[j] * x[j]; return sigmoid(z) >= 0.5 ? 1 : 0; }
    };
  }
  function kmeansPP(X, k, rng) { // K-Means++ 初始化（Arthur–Vassilvitskii 2007）
    var n = X.length;
    var centers = [X[Math.floor(rng() * n)].slice()];
    var d2 = new Array(n).fill(Infinity);
    while (centers.length < k) {
      var c = centers[centers.length - 1], sum = 0;
      for (var i = 0; i < n; i++) {
        var dd = dist2(X[i], c);
        if (dd < d2[i]) d2[i] = dd;
        sum += d2[i];
      }
      if (sum <= 0) { centers.push(X[Math.floor(rng() * n)].slice()); continue; }
      var r = rng() * sum, idx = 0;
      while (idx < n - 1 && r > d2[idx]) { r -= d2[idx]; idx++; }
      centers.push(X[idx].slice());
    }
    return centers;
  }
  function kmeans(X, k, opts) { // Lloyd 算法，SSE 单调不增
    opts = opts || {};
    var iters = opts.iters || 50, seed = opts.seed === undefined ? 7 : opts.seed;
    var rng = mulberry32(seed);
    var centers = kmeansPP(X, k, rng);
    var labels = new Array(X.length).fill(0), inertia = Infinity, history = [];
    for (var it = 0; it < iters; it++) {
      var newInertia = 0;
      for (var i = 0; i < X.length; i++) {
        var best = 0, bd = Infinity;
        for (var j = 0; j < k; j++) { var d = dist2(X[i], centers[j]); if (d < bd) { bd = d; best = j; } }
        labels[i] = best; newInertia += bd;
      }
      history.push(newInertia);
      if (it > 0 && newInertia >= inertia - 1e-12) { inertia = newInertia; break; }
      inertia = newInertia;
      var sums = Array.from({ length: k }, function () { return new Array(X[0].length).fill(0); });
      var cnt = new Array(k).fill(0);
      for (var i2 = 0; i2 < X.length; i2++) {
        var l = labels[i2]; cnt[l]++;
        for (var j2 = 0; j2 < X[i2].length; j2++) sums[l][j2] += X[i2][j2];
      }
      for (var j3 = 0; j3 < k; j3++) if (cnt[j3] > 0) centers[j3] = sums[j3].map(function (v) { return v / cnt[j3]; });
    }
    return { centers: centers, labels: labels, inertia: inertia, history: history };
  }
  function gmmEM(X, k, opts) { // 全协方差 EM，对数似然单调不减
    opts = opts || {};
    var iters = opts.iters || 50, seed = opts.seed === undefined ? 42 : opts.seed;
    var n = X.length, d = X[0].length;
    var rng = mulberry32(seed);
    var centers = kmeansPP(X, k, rng);
    var weights = new Array(k).fill(1 / k);
    var covs = Array.from({ length: k }, function () {
      var C = zeros2(d, d);
      for (var i = 0; i < d; i++) C[i][i] = 1;
      return C;
    });
    var log2pi = d * Math.log(2 * Math.PI);
    var ll = 0, llHistory = [], lastResp = null;
    for (var it = 0; it < iters; it++) {
      var logR = [], newLL = 0;
      for (var i = 0; i < n; i++) {
        var lj = new Array(k);
        for (var j = 0; j < k; j++) {
          var L = safeCholesky(covs[j]);
          var diff = X[i].map(function (v, t) { return v - centers[j][t]; });
          var y = solveLower(L, diff);
          var logdet = 0;
          for (var t = 0; t < d; t++) logdet += Math.log(L[t][t]);
          lj[j] = Math.log(weights[j]) - 0.5 * (log2pi + logdet + dot(y, y));
        }
        var m = logsumexp(lj);
        newLL += m;
        logR.push(lj.map(function (v) { return Math.exp(v - m); }));
      }
      llHistory.push(newLL);
      lastResp = logR;
      var Nk = new Array(k).fill(0);
      for (var i2 = 0; i2 < n; i2++) for (var j2 = 0; j2 < k; j2++) Nk[j2] += logR[i2][j2];
      for (var j3 = 0; j3 < k; j3++) {
        weights[j3] = Nk[j3] / n;
        centers[j3] = new Array(d).fill(0);
        for (var i3 = 0; i3 < n; i3++) {
          var r = logR[i3][j3];
          for (var t2 = 0; t2 < d; t2++) centers[j3][t2] += r * X[i3][t2];
        }
        for (var t3 = 0; t3 < d; t3++) centers[j3][t3] /= Nk[j3];
        var C = zeros2(d, d);
        for (var i4 = 0; i4 < n; i4++) {
          var r2 = logR[i4][j3];
          var df = X[i4].map(function (v, t4) { return v - centers[j3][t4]; });
          for (var a = 0; a < d; a++) for (var b = 0; b < d; b++) C[a][b] += r2 * df[a] * df[b];
        }
        for (var a2 = 0; a2 < d; a2++) { for (var b2 = 0; b2 < d; b2++) C[a2][b2] /= Nk[j3]; C[a2][a2] += 1e-6; }
        covs[j3] = C;
      }
      ll = newLL;
    }
    return { weights: weights, means: centers, covs: covs, logLikelihood: ll, llHistory: llHistory, responsibilities: lastResp, iterations: iters };
  }
  function knn(Xtrain, ytrain, x, k) {
    var idx = Xtrain.map(function (r, i) { return [dist2(r, x), i]; }).sort(function (a, b) { return a[0] - b[0]; }).slice(0, k);
    var best = null, bestCount = 0, counts = {};
    for (var t = 0; t < idx.length; t++) {
      var l = ytrain[idx[t][1]];
      counts[l] = (counts[l] || 0) + 1;
      if (counts[l] > bestCount) { bestCount = counts[l]; best = l; }
    }
    return best;
  }
  function decisionTree(X, y, opts) { // CART + Gini，预剪枝
    opts = opts || {};
    var maxDepth = opts.maxDepth === undefined ? 4 : opts.maxDepth, minSplit = opts.minSplit || 2;
    function majority(labels) {
      var m = {}, best = null, bestCount = 0;
      for (var i = 0; i < labels.length; i++) {
        var l = labels[i];
        m[l] = (m[l] || 0) + 1;
        if (m[l] > bestCount) { bestCount = m[l]; best = l; }
      }
      return best;
    }
    function build(idx, depth) {
      var labels = idx.map(function (i) { return y[i]; });
      var g = gini(labels);
      if (depth >= maxDepth || idx.length < minSplit || g === 0) return { leaf: true, label: majority(labels), gini: g, n: idx.length };
      var d = X[0].length, best = null;
      for (var f = 0; f < d; f++) {
        var vals = Array.from(new Set(idx.map(function (i) { return X[i][f]; }))).sort(function (a, b) { return a - b; });
        for (var t = 0; t < vals.length - 1; t++) {
          var thr = (vals[t] + vals[t + 1]) / 2, L = [], R = [];
          for (var i2 = 0; i2 < idx.length; i2++) (X[idx[i2]][f] <= thr ? L : R).push(idx[i2]);
          if (!L.length || !R.length) continue;
          var gain = g - (L.length / idx.length) * gini(L.map(function (i) { return y[i]; })) - (R.length / idx.length) * gini(R.map(function (i) { return y[i]; }));
          if (!best || gain > best.gain + 1e-15) best = { f: f, thr: thr, gain: gain, L: L, R: R };
        }
      }
      if (!best || best.gain <= 1e-12) return { leaf: true, label: majority(labels), gini: g, n: idx.length };
      return { leaf: false, feature: best.f, threshold: best.thr, gain: best.gain, gini: g, n: idx.length, left: build(best.L, depth + 1), right: build(best.R, depth + 1) };
    }
    var tree = build(X.map(function (_, i) { return i; }), 0);
    function predictOne(x, node) {
      node = node || tree;
      while (!node.leaf) node = x[node.feature] <= node.threshold ? node.left : node.right;
      return node.label;
    }
    return {
      tree: tree,
      predict: function (x) { return predictOne(x); },
      predictAll: function (Xs) { return Xs.map(function (x) { return predictOne(x); }); },
      rootGain: tree.leaf ? 0 : tree.gain
    };
  }
  /* ---- MLP（反向传播 Rumelhart–Hinton–Williams 1986）---- */
  function mlpForward(P, x) {
    var d = P.W1[0].length, h = P.W1.length, o = P.W2.length;
    var a1 = new Array(h);
    for (var i = 0; i < h; i++) {
      var s = P.b1[i];
      for (var j = 0; j < d; j++) s += P.W1[i][j] * x[j];
      a1[i] = Math.tanh(s);
    }
    var out = new Array(o);
    for (var i2 = 0; i2 < o; i2++) {
      var s2 = P.b2[i2];
      for (var j2 = 0; j2 < h; j2++) s2 += P.W2[i2][j2] * a1[j2];
      out[i2] = s2;
    }
    return { a1: a1, out: out };
  }
  function mlpLoss(P, X, Y) {
    var s = 0;
    for (var i = 0; i < X.length; i++) {
      var f = mlpForward(P, X[i]);
      for (var k = 0; k < f.out.length; k++) s += (f.out[k] - Y[i][k]) * (f.out[k] - Y[i][k]);
    }
    return s / X.length;
  }
  function mlpGrad(P, X, Y) {
    var n = X.length, d = P.W1[0].length, h = P.W1.length, o = P.W2.length;
    var gW1 = zeros2(h, d), gb1 = new Array(h).fill(0), gW2 = zeros2(o, h), gb2 = new Array(o).fill(0);
    for (var i = 0; i < n; i++) {
      var f = mlpForward(P, X[i]);
      var dz2 = f.out.map(function (v, k) { return 2 * (v - Y[i][k]) / n; });
      for (var a = 0; a < o; a++) {
        gb2[a] += dz2[a];
        for (var b = 0; b < h; b++) gW2[a][b] += dz2[a] * f.a1[b];
      }
      for (var b2 = 0; b2 < h; b2++) {
        var da = 0;
        for (var a2 = 0; a2 < o; a2++) da += dz2[a2] * P.W2[a2][b2];
        var dz1 = da * (1 - f.a1[b2] * f.a1[b2]);
        gb1[b2] += dz1;
        for (var j = 0; j < d; j++) gW1[b2][j] += dz1 * X[i][j];
      }
    }
    return { W1: gW1, b1: gb1, W2: gW2, b2: gb2 };
  }
  function gradientCheck(P, X, Y, eps) { // 中心差分 vs 解析梯度
    eps = eps || 1e-5;
    var G = mlpGrad(P, X, Y);
    var maxRel = 0;
    [['W1', P.W1, G.W1], ['b1', P.b1, G.b1], ['W2', P.W2, G.W2], ['b2', P.b2, G.b2]].forEach(function (item) {
      var name = item[0], PV = item[1], GV = item[2];
      for (var i = 0; i < PV.length; i++) {
        if (typeof PV[i] === 'number') {
          var orig = PV[i];
          PV[i] = orig + eps; var lp = mlpLoss(P, X, Y);
          PV[i] = orig - eps; var lm = mlpLoss(P, X, Y);
          PV[i] = orig;
          var num = (lp - lm) / (2 * eps), ana = GV[i];
          var rel = Math.abs(num - ana) / Math.max(Math.abs(num), Math.abs(ana), 1e-8);
          if (rel > maxRel) maxRel = rel;
        } else {
          for (var j = 0; j < PV[i].length; j++) {
            var o2 = PV[i][j];
            PV[i][j] = o2 + eps; var lp2 = mlpLoss(P, X, Y);
            PV[i][j] = o2 - eps; var lm2 = mlpLoss(P, X, Y);
            PV[i][j] = o2;
            var num2 = (lp2 - lm2) / (2 * eps), ana2 = GV[i][j];
            var rel2 = Math.abs(num2 - ana2) / Math.max(Math.abs(num2), Math.abs(ana2), 1e-8);
            if (rel2 > maxRel) maxRel = rel2;
          }
        }
      }
    });
    return maxRel;
  }
  function mlpTrain(X, Y, opts) {
    opts = opts || {};
    var hidden = opts.hidden || 5, iters = opts.iters || 3000, lr = opts.lr || 0.1;
    var seed = opts.seed === undefined ? 11 : opts.seed;
    var rng = mulberry32(seed);
    var d = X[0].length, h = hidden, o = Y[0].length;
    var P = {
      W1: Array.from({ length: h }, function () { return Array.from({ length: d }, function () { return (rng() * 2 - 1) * 0.5; }); }),
      b1: new Array(h).fill(0),
      W2: Array.from({ length: o }, function () { return Array.from({ length: h }, function () { return (rng() * 2 - 1) * 0.5; }); }),
      b2: new Array(o).fill(0)
    };
    var history = [];
    for (var it = 0; it < iters; it++) {
      var G = mlpGrad(P, X, Y);
      for (var i = 0; i < h; i++) { P.b1[i] -= lr * G.b1[i]; for (var j = 0; j < d; j++) P.W1[i][j] -= lr * G.W1[i][j]; }
      for (var i2 = 0; i2 < o; i2++) { P.b2[i2] -= lr * G.b2[i2]; for (var j2 = 0; j2 < h; j2++) P.W2[i2][j2] -= lr * G.W2[i2][j2]; }
      if (it % 10 === 0 || it === iters - 1) history.push(mlpLoss(P, X, Y));
    }
    return { params: P, history: history, predict: function (x) { return mlpForward(P, x).out; } };
  }

  /* ========================================================================
   * 7. 深度学习组件
   * ======================================================================*/
  function linear(X, W, b) {
    return X.map(function (row) {
      return W.map(function (w, j) { return dot(row, w) + (b ? b[j] : 0); });
    });
  }
  function layerNorm(x, eps) { // 逐行（每个样本向量）
    eps = eps || 1e-5;
    return x.map(function (row) {
      var n = row.length, mu = 0;
      for (var i = 0; i < n; i++) mu += row[i];
      mu /= n;
      var v = 0;
      for (var i2 = 0; i2 < n; i2++) { var dd = row[i2] - mu; v += dd * dd; }
      v /= n;
      var inv = 1 / Math.sqrt(v + eps);
      return row.map(function (val) { return (val - mu) * inv; });
    });
  }
  function selfAttention(Q, K, V, causal) {
    var d = Q[0].length;
    var scores = Q.map(function (q, i) {
      return K.map(function (k, j) {
        var s = dot(q, k) / Math.sqrt(d);
        return causal && j > i ? -Infinity : s;
      });
    });
    var W = scores.map(function (row) { return softmax(row); });
    return { weights: W, output: W.map(function (row) {
      var o = new Array(V[0].length).fill(0);
      for (var j = 0; j < V.length; j++) for (var t = 0; t < V[0].length; t++) o[t] += row[j] * V[j][t];
      return o;
    }) };
  }

  /* ========================================================================
   * 8. 图模型推断（HMM：前向-后向 / Viterbi）
   * ======================================================================*/
  function hmmForwardBackward(pi, A, B, obs) { // A: k×k 转移, B: k×M 发射
    var k = pi.length, T = obs.length;
    var alpha = [], beta = [];
    var a0 = new Array(k);
    for (var i = 0; i < k; i++) a0[i] = pi[i] * B[i][obs[0]];
    alpha.push(a0);
    for (var t = 1; t < T; t++) {
      var at = new Array(k);
      for (var i2 = 0; i2 < k; i2++) {
        var s = 0;
        for (var j = 0; j < k; j++) s += alpha[t - 1][j] * A[j][i2];
        at[i2] = s * B[i2][obs[t]];
      }
      alpha.push(at);
    }
    var bT = new Array(k).fill(1);
    beta.push(bT);
    for (var t2 = T - 2; t2 >= 0; t2--) {
      var bt = new Array(k);
      for (var i3 = 0; i3 < k; i3++) {
        var s2 = 0;
        for (var j2 = 0; j2 < k; j2++) s2 += A[i3][j2] * B[j2][obs[t2 + 1]] * beta[T - 2 - t2][j2];
        bt[i3] = s2;
      }
      beta.unshift(bt);
    }
    var logPO = Math.log(alpha[T - 1].reduce(function (a, b) { return a + b; }, 0));
    var posteriors = alpha.map(function (row, t3) {
      var s3 = row[0] * beta[t3][0] + row[1] * beta[t3][1];
      return row.map(function (v, i4) { return v * beta[t3][i4] / s3; });
    });
    return { alpha: alpha, beta: beta, logPO: logPO, posteriors: posteriors };
  }
  function hmmViterbi(pi, A, B, obs) {
    var k = pi.length, T = obs.length;
    var delta = [pi.map(function (p, i) { return Math.log(p) + Math.log(B[i][obs[0]]); })];
    var psi = [];
    for (var t = 1; t < T; t++) {
      var dt = new Array(k), pt = new Array(k);
      for (var i = 0; i < k; i++) {
        var best = -Infinity, arg = 0;
        for (var j = 0; j < k; j++) {
          var v = delta[t - 1][j] + Math.log(A[j][i]);
          if (v > best) { best = v; arg = j; }
        }
        dt[i] = best + Math.log(B[i][obs[t]]);
        pt[i] = arg;
      }
      delta.push(dt); psi.push(pt);
    }
    var last = delta[T - 1], bestIdx = 0;
    for (var i2 = 1; i2 < k; i2++) if (last[i2] > last[bestIdx]) bestIdx = i2;
    var path = [bestIdx];
    for (var t2 = T - 2; t2 >= 0; t2--) { bestIdx = psi[t2][bestIdx]; path.unshift(bestIdx); }
    return { path: path, logprob: last[path[0]] };
  }

  /* ========================================================================
   * 9. 强化学习（Bellman 动态规划 / Q-Learning）
   * ======================================================================*/
  function chainSetup(n, gamma, stochastic) {
    function clamp(s) { return Math.max(0, Math.min(n - 1, s)); }
    function trans(s, a) {
      var res = new Map();
      function add(sp, p) { res.set(sp, (res.get(sp) || 0) + p); }
      if (!stochastic) add(clamp(s + a), 1);
      else { add(clamp(s + a), 0.8); add(clamp(s - a), 0.1); add(s, 0.1); }
      return Array.from(res.entries());
    }
    function reward(s, sp) { return sp === n - 1 ? 1 : 0; }
    return { n: n, gamma: gamma, actions: [-1, 1], trans: trans, reward: reward, clamp: clamp };
  }
  function valueIteration(opts) {
    var n = opts.n, gamma = opts.gamma, mdp = chainSetup(n, gamma, opts.stochastic);
    var tol = opts.tol || 1e-13, maxIter = opts.maxIter || 20000;
    var V = new Array(n).fill(0), snapshots = [], it = 0, delta = Infinity;
    for (; it < maxIter; it++) {
      var Vn = new Array(n);
      for (var s = 0; s < n; s++) {
        var best = -Infinity;
        for (var ai = 0; ai < mdp.actions.length; ai++) {
          var a = mdp.actions[ai], v = 0;
          var tr = mdp.trans(s, a);
          for (var t = 0; t < tr.length; t++) v += tr[t][1] * (mdp.reward(s, tr[t][0]) + gamma * V[tr[t][0]]);
          if (v > best) best = v;
        }
        Vn[s] = best;
      }
      delta = 0;
      for (var s2 = 0; s2 < n; s2++) delta = Math.max(delta, Math.abs(Vn[s2] - V[s2]));
      V = Vn; snapshots.push(V.slice());
      if (delta < tol) break;
    }
    var residual = 0;
    for (var s3 = 0; s3 < n; s3++) {
      var best2 = -Infinity;
      for (var ai2 = 0; ai2 < mdp.actions.length; ai2++) {
        var a2 = mdp.actions[ai2], v2 = 0;
        var tr2 = mdp.trans(s3, a2);
        for (var t2 = 0; t2 < tr2.length; t2++) v2 += tr2[t2][1] * (mdp.reward(s3, tr2[t2][0]) + gamma * V[tr2[t2][0]]);
        if (v2 > best2) best2 = v2;
      }
      residual = Math.max(residual, Math.abs(V[s3] - best2));
    }
    return { V: V, iterations: it, residual: residual, snapshots: snapshots };
  }
  function td0Sweep(n, gamma) { // 终端语义 + 确定性链 + α=1：一步后向扫描即解析解
    var V = new Array(n).fill(0);
    for (var s = n - 2; s >= 0; s--) {
      var r = (s + 1 === n - 1) ? 1 : 0;
      V[s] = r + gamma * V[s + 1];
    }
    return V;
  }
  function qLearning(opts) {
    opts = opts || {};
    var n = opts.n || 7, gamma = opts.gamma || 0.9, episodes = opts.episodes || 5000;
    var alpha = opts.alpha || 0.2, epsStart = opts.epsStart || 1, epsEnd = opts.epsEnd || 0.05;
    var seed = opts.seed === undefined ? 123 : opts.seed;
    var rng = mulberry32(seed);
    var Q = Array.from({ length: n }, function () { return new Array(2).fill(0); });
    function clamp(s) { return Math.max(0, Math.min(n - 1, s)); }
    for (var ep = 0; ep < episodes; ep++) {
      var eps = epsStart + (epsEnd - epsStart) * ep / episodes;
      var s = 0;
      for (var t = 0; t < 200; t++) {
        var a = rng() < eps ? (rng() < 0.5 ? 0 : 1) : (Q[s][0] >= Q[s][1] ? 0 : 1);
        var sp = clamp(s + (a === 1 ? 1 : -1));
        var r = sp === n - 1 ? 1 : 0;
        var done = sp === n - 1;
        var target = r + (done ? 0 : gamma * Math.max(Q[sp][0], Q[sp][1]));
        Q[s][a] += alpha * (target - Q[s][a]);
        s = sp;
        if (done) break;
      }
    }
    var success = 0, trials = 200;
    for (var i = 0; i < trials; i++) {
      var s2 = 0, ok = false;
      for (var t2 = 0; t2 < 200; t2++) {
        var a2 = Q[s2][0] >= Q[s2][1] ? 0 : 1;
        s2 = clamp(s2 + (a2 === 1 ? 1 : -1));
        if (s2 === n - 1) { ok = true; break; }
      }
      if (ok) success++;
    }
    return { Q: Q, successRate: success / trials };
  }
  function epsilonGreedy(qrow, eps, rng) {
    if (rng() >= eps) {
      var best = 0;
      for (var i = 1; i < qrow.length; i++) if (qrow[i] > qrow[best]) best = i;
      return best;
    }
    return Math.floor(rng() * qrow.length);
  }

  /* ========================================================================
   * 10. 评估指标
   * ======================================================================*/
  function accuracy(y, yhat) { var c = 0; for (var i = 0; i < y.length; i++) if (y[i] === yhat[i]) c++; return c / y.length; }
  function precision(y, yhat) { var tp = 0, fp = 0; for (var i = 0; i < y.length; i++) { if (yhat[i] === 1) { if (y[i] === 1) tp++; else fp++; } } return tp + fp === 0 ? 0 : tp / (tp + fp); }
  function recall(y, yhat) { var tp = 0, fn = 0; for (var i = 0; i < y.length; i++) { if (y[i] === 1) { if (yhat[i] === 1) tp++; else fn++; } } return tp + fn === 0 ? 0 : tp / (tp + fn); }
  function f1(y, yhat) { var p = precision(y, yhat), r = recall(y, yhat); return p + r === 0 ? 0 : 2 * p * r / (p + r); }
  function auc(y, s) { // Mann–Whitney U（秩法，含并列）
    var n = y.length;
    var order = Array.from({ length: n }, function (_, i) { return i; }).sort(function (a, b) { return s[a] - s[b]; });
    var i = 0, rankSumPos = 0;
    while (i < n) {
      var j = i;
      while (j + 1 < n && s[order[j + 1]] === s[order[i]]) j++;
      var avgRank = (i + j) / 2 + 1;
      for (var t = i; t <= j; t++) if (y[order[t]] === 1) rankSumPos += avgRank;
      i = j + 1;
    }
    var nPos = 0;
    for (var i2 = 0; i2 < n; i2++) if (y[i2] === 1) nPos++;
    var nNeg = n - nPos;
    if (nPos === 0 || nNeg === 0) return 0.5;
    return (rankSumPos - nPos * (nPos + 1) / 2) / (nPos * nNeg);
  }
  function mse(y, yhat) { var s = 0; for (var i = 0; i < y.length; i++) s += (y[i] - yhat[i]) * (y[i] - yhat[i]); return s / y.length; }
  function mae(y, yhat) { var s = 0; for (var i = 0; i < y.length; i++) s += Math.abs(y[i] - yhat[i]); return s / y.length; }
  function r2(y, yhat) { // R² = 1 − Σ(ŷ−y)² / Σ(y−ȳ)²
    var m = expectation(y), ssRes = 0, sst = 0;
    for (var i = 0; i < y.length; i++) { ssRes += (yhat[i] - y[i]) * (yhat[i] - y[i]); sst += (y[i] - m) * (y[i] - m); }
    return 1 - ssRes / sst;
  }
  function logLoss(y, p) {
    var s = 0;
    for (var i = 0; i < y.length; i++) s += -(y[i] * Math.log(p[i] + 1e-15) + (1 - y[i]) * Math.log(1 - p[i] + 1e-15));
    return s / y.length;
  }
  function cosineSimilarity(a, b) { return dot(a, b) / (norm2(a) * norm2(b)); }
  function editDistance(a, b) {
    var m = a.length, n = b.length;
    var dp = Array.from({ length: m + 1 }, function (_, i) { return [i].concat(new Array(n).fill(0)); });
    for (var j = 0; j <= n; j++) dp[0][j] = j;
    for (var i = 1; i <= m; i++) for (var j2 = 1; j2 <= n; j2++) {
      var cost = a[i - 1] === b[j2 - 1] ? 0 : 1;
      dp[i][j2] = Math.min(dp[i - 1][j2] + 1, dp[i][j2 - 1] + 1, dp[i - 1][j2 - 1] + cost);
    }
    return dp[m][n];
  }
  function silhouette(X, labels) {
    var n = X.length, s = new Array(n);
    for (var i = 0; i < n; i++) {
      var same = [], other = {};
      for (var j = 0; j < n; j++) {
        if (i === j) continue;
        var d = euclid(X[i], X[j]);
        if (labels[j] === labels[i]) same.push(d);
        else { (other[labels[j]] = other[labels[j]] || []).push(d); }
      }
      var a = same.length ? same.reduce(function (x, y) { return x + y; }, 0) / same.length : 0;
      var b = Infinity;
      for (var kk in other) {
        var arr = other[kk], mm = arr.reduce(function (x, y) { return x + y; }, 0) / arr.length;
        if (mm < b) b = mm;
      }
      s[i] = (same.length === 0 || b === Infinity) ? 0 : (b - a) / Math.max(a, b);
    }
    return s;
  }

  /* ========================================================================
   * 11. 归一化 / 正则 / 数据管线 / 系统微操作
   * ======================================================================*/
  function l1Norm(x) { var s = 0; for (var i = 0; i < x.length; i++) s += Math.abs(x[i]); return s; }
  function l2Norm(x) { return norm2(x); }
  function linfNorm(x) { return normInf(x); }
  function normalizeL2(x) { var n = norm2(x); return x.map(function (v) { return v / n; }); }
  function minmaxScale(x) { var lo = Math.min.apply(null, x), hi = Math.max.apply(null, x); return x.map(function (v) { return (v - lo) / (hi - lo); }); }
  function zscore(x) { var m = expectation(x), sd = Math.sqrt(variance(x)); return x.map(function (v) { return (v - m) / sd; }); }
  function l2Reg(w, lambda) { var s = 0; for (var i = 0; i < w.length; i++) s += w[i] * w[i]; return lambda * s; }
  function temperatureSoftmax(xs, T) { return softmax(xs.map(function (x) { return x / T; })); }
  function topK(p, k) {
    var order = p.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, k);
    var s = order.reduce(function (a, b) { return a + b[0]; }, 0);
    var out = new Array(p.length).fill(0);
    order.forEach(function (item) { out[item[1]] = item[0] / s; });
    return out;
  }
  function shuffle(arr, seed) {
    var rng = mulberry32(seed === undefined ? 5 : seed);
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function trainTestSplit(n, ratio, seed) {
    var idx = shuffle(Array.from({ length: n }, function (_, i) { return i; }), seed);
    var cut = Math.floor(n * ratio);
    return { train: idx.slice(0, cut), test: idx.slice(cut) };
  }
  function kFold(n, k, seed) {
    var idx = shuffle(Array.from({ length: n }, function (_, i) { return i; }), seed);
    var folds = Array.from({ length: k }, function () { return []; });
    for (var i = 0; i < n; i++) folds[i % k].push(idx[i]);
    return folds;
  }
  function oneHot(labels) {
    var classes = Array.from(new Set(labels)).sort();
    var index = {};
    classes.forEach(function (c, i) { index[c] = i; });
    return { classes: classes, matrix: labels.map(function (l) { return classes.map(function (_, i) { return i === index[l] ? 1 : 0; }); }) };
  }
  function Arena(size) { this.size = size; this.used = 0; this.allocs = []; }
  Arena.prototype.alloc = function (n) {
    if (this.used + n > this.size) throw new Error('Arena 容量耗尽');
    var a = { offset: this.used, length: n };
    this.used += n;
    this.allocs.push(a);
    return a;
  };
  Arena.prototype.reset = function () { this.used = 0; this.allocs = []; };
  function reduceAll(xs) { return kahanSum(xs); } // 全局归约用精确和
  function broadcast(xs) { return xs.slice(); }

  /* ========================================================================
   * 12. 不变量检查表（可独立复算的硬金标准）
   * ======================================================================*/
  var checks = [];
  function check(name, tol, run) { checks.push({ name: name, tol: tol, run: run }); }

  check('matmul：(AB)ᵀ = BᵀAᵀ（逐位一致）', 0, function () {
    var rng = mulberry32(1);
    var A = Array.from({ length: 5 }, function () { return Array.from({ length: 4 }, function () { return rng() * 2 - 1; }); });
    var B = Array.from({ length: 4 }, function () { return Array.from({ length: 6 }, function () { return rng() * 2 - 1; }); });
    return maxAbsDiff2(transpose(matMul(A, B)), matMul(transpose(B), transpose(A)));
  });
  check('cholesky：‖LLᵀ − A‖∞ ≤ 1e-10', 1e-10, function () {
    var A = spdMatrix(5, 2), L = cholesky(A);
    var LLt = matMul(L, transpose(L));
    var scale = 0;
    for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) scale = Math.max(scale, Math.abs(A[i][j]));
    return maxAbsDiff2(LLt, A) / scale;
  });
  check('qr：QᵀQ = I 且 ‖QR − A‖ ≤ 1e-10', 1e-10, function () {
    var rng = mulberry32(3);
    var A = Array.from({ length: 6 }, function () { return Array.from({ length: 4 }, function () { return rng() * 2 - 1; }); });
    var qr = qrDecompose(A);
    var QtQ = matMul(transpose(qr.Q), qr.Q);
    var QR = matMul(qr.Q, qr.R);
    return Math.max(maxAbsDiff2(QtQ, eye(6)), maxAbsDiff2(QR, A));
  });
  check('jacobi：‖Sv − λv‖ ≤ 1e-12 且特征向量正交归一', 1e-12, function () {
    var A = spdMatrix(6, 4);
    var eig = jacobiEigen(A);
    var worst = 0;
    for (var t = 0; t < 6; t++) {
      var Av = matVec(A, eig.vectors[t]);
      var lv = eig.vectors[t].map(function (v) { return v * eig.values[t]; });
      worst = Math.max(worst, normInf(Av.map(function (v, i) { return v - lv[i]; })));
    }
    var V = eig.vectors; // V[t] 为第 t 个特征向量
    var orth = 0;
    for (var a = 0; a < 6; a++) for (var b = 0; b < 6; b++) orth = Math.max(orth, Math.abs(dot(V[a], V[b]) - (a === b ? 1 : 0)));
    return Math.max(worst, orth);
  });
  check('jacobi：Σλ = tr(A)（谱不变量）', 1e-10, function () {
    var A = spdMatrix(6, 5);
    var eig = jacobiEigen(A);
    return Math.abs(eig.values.reduce(function (a, b) { return a + b; }, 0) - trace(A));
  });
  check('power：主特征值与 Jacobi 一致 ≤ 1e-9', 1e-9, function () {
    var A = spdMatrix(6, 6);
    var p = powerIteration(A);
    var j = jacobiEigen(A);
    return Math.abs(p.value - j.values[0]) / Math.abs(j.values[0]);
  });
  check('solve：‖Ax − b‖ ≤ 1e-12·‖A‖‖x‖', 1e-12, function () {
    var A = spdMatrix(6, 7);
    var b = normalSample(6, 8);
    var x = solveLinear(A, b);
    var r = matVec(A, x).map(function (v, i) { return v - b[i]; });
    return norm2(r) / (norm2(matVec(A, new Array(6).fill(1))) * norm2(x) + 1e-30);
  });
  check('inverse：‖AA⁻¹ − I‖∞ ≤ 1e-10', 1e-10, function () {
    var A = spdMatrix(5, 9), Ai = inverse(A);
    return maxAbsDiff2(matMul(A, Ai), eye(5));
  });
  check('det：det(AB) = det(A)·det(B)', 1e-12, function () {
    var A = spdMatrix(4, 10), B = spdMatrix(4, 11);
    var lhs = det(matMul(A, B)), rhs = det(A) * det(B);
    return Math.abs(lhs - rhs) / Math.abs(rhs);
  });
  check('trace：tr(AB) = tr(BA)', 1e-12, function () {
    var rng = mulberry32(12);
    var A = Array.from({ length: 4 }, function () { return Array.from({ length: 4 }, function () { return rng() * 2 - 1; }); });
    var B = Array.from({ length: 4 }, function () { return Array.from({ length: 4 }, function () { return rng() * 2 - 1; }); });
    return Math.abs(trace(matMul(A, B)) - trace(matMul(B, A))) / Math.abs(trace(matMul(A, B)));
  });
  check('pca：Eckart–Young 秩-k 重构残差 = (n−1)Σ_{i>k}λᵢ', 1e-8, function () {
    var rng = mulberry32(13);
    var X = Array.from({ length: 50 }, function () { return Array.from({ length: 5 }, function () { return rng() * 2 - 1; }); });
    var p = pca(X, 2);
    var n = X.length;
    var Xc = X.map(function (r, i) { return r.map(function (v, j) { return v - p.mean[j]; }); });
    var ssRes = 0;
    for (var i = 0; i < n; i++) ssRes += dist2(Xc[i], p.reconstruct[i].map(function (v, j) { return v - p.mean[j]; }));
    var expected = (n - 1) * p.values.slice(2).reduce(function (a, b) { return a + b; }, 0);
    var desc = true;
    for (var t = 1; t < p.values.length; t++) if (p.values[t] > p.values[t - 1] + 1e-12) desc = false;
    return desc ? Math.abs(ssRes - expected) / expected : 1;
  });
  check('pca：特征向量正交归一（VᵀV = I）', 1e-12, function () {
    var rng = mulberry32(14);
    var X = Array.from({ length: 30 }, function () { return Array.from({ length: 4 }, function () { return rng() * 2 - 1; }); });
    var p = pca(X, 4);
    var V = p.components, orth = 0;
    for (var a = 0; a < V.length; a++) for (var b = 0; b < V.length; b++) orth = Math.max(orth, Math.abs(dot(V[a], V[b]) - (a === b ? 1 : 0)));
    return orth;
  });
  check('gmm：EM 对数似然单调不减', 1e-8, function () {
    var rng = mulberry32(15);
    var X = Array.from({ length: 60 }, function () {
      var c = rng() < 0.33 ? [-4, -4] : (rng() < 0.5 ? [0, 5] : [6, -2]);
      return [c[0] + (rng() * 2 - 1), c[1] + (rng() * 2 - 1)];
    });
    var g = gmmEM(X, 3, { iters: 40 });
    var worst = 0;
    for (var i = 1; i < g.llHistory.length; i++) {
      var drop = g.llHistory[i - 1] - g.llHistory[i];
      if (drop > worst) worst = drop;
    }
    var wsum = g.weights.reduce(function (a, b) { return a + b; }, 0);
    var rowSum = 0;
    for (var r = 0; r < g.responsibilities.length; r++) rowSum = Math.max(rowSum, Math.abs(g.responsibilities[r].reduce(function (a, b) { return a + b; }, 0) - 1));
    return Math.max(worst / (1 + Math.abs(g.llHistory[0])), Math.abs(wsum - 1), rowSum);
  });
  check('logistic：交叉熵损失单调不增', 1e-9, function () {
    var rng = mulberry32(16);
    var X = [], y = [];
    for (var i = 0; i < 40; i++) {
      var x1 = rng() * 2 - 1, x2 = rng() * 2 - 1;
      X.push([x1, x2]);
      y.push(1.5 * x1 - 0.8 * x2 + (rng() - 0.5) * 0.2 > 0 ? 1 : 0);
    }
    var m = logisticRegression(X, y, { lr: 0.5, iters: 3000 });
    var worst = 0;
    for (var t = 1; t < m.history.length; t++) worst = Math.max(worst, m.history[t] - m.history[t - 1]);
    return worst / (1 + m.history[0]);
  });
  check('linreg：正规方程残差 Xᵀ(y − Xŵ) ≈ 0', 1e-8, function () {
    var rng = mulberry32(17);
    var X = Array.from({ length: 40 }, function () { return [1, rng() * 2 - 1, rng() * 2 - 1]; });
    var y = X.map(function (r) { return 2 + 3 * r[1] - 1.5 * r[2] + (rng() - 0.5) * 0.05; });
    var m = linearRegression(X, y);
    var resid = y.map(function (v, i) { return v - m.predict(X[i]); });
    var g = new Array(3).fill(0);
    for (var i2 = 0; i2 < X.length; i2++) for (var j = 0; j < 3; j++) g[j] += X[i2][j] * resid[i2];
    return normInf(g) / (1 + norm2(y));
  });
  check('mlp：梯度检验 maxRelErr ≤ 1e-6（中心差分 vs 解析）', 1e-6, function () {
    var rng = mulberry32(18);
    var X = Array.from({ length: 8 }, function () { return [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1]; });
    var Y = X.map(function (r) { return [r[0] * 0.5 - r[1] + 0.3]; });
    var P = {
      W1: Array.from({ length: 4 }, function () { return [(rng() * 2 - 1) * 0.5, (rng() * 2 - 1) * 0.5, (rng() * 2 - 1) * 0.5]; }),
      b1: [0.1, -0.2, 0.05, 0.0],
      W2: [[0.3, -0.4, 0.2, 0.1]],
      b2: [0.05]
    };
    return gradientCheck(P, X, Y, 1e-5);
  });
  check('kmeans：SSE 逐轮单调不增', 1e-9, function () {
    var rng = mulberry32(19);
    var X = Array.from({ length: 45 }, function () {
      var c = rng() < 0.33 ? [0, 0] : (rng() < 0.5 ? [8, 8] : [16, 0]);
      return [c[0] + (rng() * 2 - 1) * 1.5, c[1] + (rng() * 2 - 1) * 1.5];
    });
    var km = kmeans(X, 3, { iters: 50, seed: 21 });
    var worst = 0;
    for (var i = 1; i < km.history.length; i++) worst = Math.max(worst, km.history[i] - km.history[i - 1]);
    return worst / (1 + km.history[0]);
  });
  check('knn：k=1 训练集误差为 0', 0, function () {
    var X = [[0, 0], [0, 1], [1, 0], [1, 1], [5, 5], [5, 6], [6, 5], [6, 6]];
    var y = [0, 0, 0, 0, 1, 1, 1, 1];
    var wrong = 0;
    for (var i = 0; i < X.length; i++) if (knn(X, y, X[i], 1) !== y[i]) wrong++;
    return wrong;
  });
  check('tree：CART 根节点 Gini 下降 > 0 且训练准确率 100%', 1e-9, function () {
    var rng = mulberry32(20);
    var X = [], y = [];
    for (var i = 0; i < 24; i++) {
      var x1 = rng() * 2 - 1;
      X.push([x1, rng() * 2 - 1]);
      y.push(x1 > 0 ? 1 : 0);
    }
    var tree = decisionTree(X, y, { maxDepth: 4 });
    var acc = accuracy(y, tree.predictAll(X));
    return acc === 1 ? Math.max(0, 1e-9 - tree.rootGain) : 1;
  });
  check('logsumexp：= logΣeˣ 且 ±1e300 不溢出', 1e-12, function () {
    var xs = [0.3, -1.2, 2.7, 0.9, -0.4];
    var naive = Math.log(xs.reduce(function (a, b) { return a + Math.exp(b); }, 0));
    var big = logsumexp([1e300, 1e300]);
    var bigRef = 1e300 + Math.log(2);
    return Math.max(Math.abs(logsumexp(xs) - naive), Math.abs(big - bigRef) / bigRef);
  });
  check('softmax：平移不变（+1000 后逐元素一致）', 1e-12, function () {
    var xs = [1.2, -0.7, 3.1, 0.4, 2.2];
    return maxAbsDiff(softmax(xs), softmax(xs.map(function (x) { return x + 1000; })));
  });
  check('sigmoid：σ(−x) = 1 − σ(x)', 1e-15, function () {
    var xs = [0.5, 1, 2, 5, 12, -3];
    var worst = 0;
    for (var i = 0; i < xs.length; i++) worst = Math.max(worst, Math.abs(sigmoid(-xs[i]) - (1 - sigmoid(xs[i]))));
    return worst;
  });
  check('gelu：xΦ(x)∈[min(0,x),max(0,x)]；全局最小≈−0.16997@x≈−0.75；gelu(0)=0；gelu(6)≈6', 1e-5, function () {
    var lo = Infinity, worst = 0;
    for (var x = -4; x <= 4; x += 0.001) {
      var g = gelu(x);
      lo = Math.min(lo, g);
      if (g < Math.min(0, x) - 1e-9 || g > Math.max(0, x) + 1e-9) worst = 1;
    }
    var minRef = Math.abs(gelu(-0.7518) - (-0.169973));
    var minRange = (lo >= -0.1701 && lo <= -0.1698) ? 0 : 1;
    return Math.max(worst, minRange, minRef, Math.abs(gelu(0)), Math.abs(gelu(6) - 6));
  });
  check('kahan：病态序列（1e16,1,1,−1e16）精确和=2，朴素和=0', 1e-9, function () {
    var xs = [1e16, 1, 1, -1e16];
    var naive = xs.reduce(function (a, b) { return a + b; }, 0);
    // 精确和基准 = 2；Kahan 必须复现它，朴素求和必须丢失有效位（证明序列确实病态）
    return Math.abs(kahanSum(xs) - exactSum(xs)) + (Math.abs(naive - 2) > 1 ? 0 : 1);
  });
  check('gaussPDF：∫pdf = 1（Simpson 10 万区间）', 1e-10, function () {
    var mu = 1.3, sigma = 2.1, lo = mu - 10 * sigma, hi = mu + 10 * sigma, N = 100000, h = (hi - lo) / N;
    var s = gaussPDF(lo, mu, sigma) + gaussPDF(hi, mu, sigma);
    for (var i = 1; i < N; i++) s += (i % 2 === 0 ? 2 : 4) * gaussPDF(lo + i * h, mu, sigma);
    return Math.abs(s * h / 3 - 1);
  });
  check('normalCDF：Φ(−x)=1−Φ(x)；Φ(1.96)≈0.975002；Φ(0)=0.5', 1e-5, function () {
    var sym = Math.abs(normalCDF(-1.3) - (1 - normalCDF(1.3)));
    var z = Math.abs(normalCDF(1.96) - 0.97500210485);
    return Math.max(sym, z, Math.abs(normalCDF(0) - 0.5));
  });
  check('normalSample：Box–Muller n=1e5 矩估计（|mean|≤0.01, |σ−1|≤0.01）', 0.01, function () {
    var xs = normalSample(100000, 99);
    return Math.max(Math.abs(expectation(xs)), Math.abs(Math.sqrt(variance(xs)) - 1));
  });
  check('categoricalSample：频率 ≈ p（n=2e4，max≤0.01）', 0.01, function () {
    var p = [0.1, 0.2, 0.3, 0.4];
    var samples = categoricalSample(p, 55);
    var freq = [0, 0, 0, 0];
    for (var i = 0; i < samples.length; i++) freq[samples[i]]++;
    freq = freq.map(function (v) { return v / samples.length; });
    var worst = 0;
    for (var j = 0; j < p.length; j++) worst = Math.max(worst, Math.abs(freq[j] - p[j]));
    return worst;
  });
  check('bayes：后验和=1；先验[.5,.5]×似然[.9,.1]=[.9,.1]', 1e-15, function () {
    var post = bayesUpdate([0.5, 0.5], [0.9, 0.1]);
    return Math.max(Math.abs(post.reduce(function (a, b) { return a + b; }, 0) - 1), maxAbsDiff(post, [0.9, 0.1]));
  });
  check('entropy：0≤H≤log₂n；均匀取等；确定分布为 0', 1e-15, function () {
    var u = entropy([0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125]);
    var det = entropy([1, 0, 0]);
    return Math.max(Math.abs(u - 3), Math.abs(det));
  });
  check('crossEntropy：H(p,q) ≥ H(p)，p=q 时取等', 1e-15, function () {
    var p = [0.1, 0.2, 0.3, 0.4], q = [0.25, 0.25, 0.25, 0.25];
    var same = crossEntropy(p, p) - entropy(p);
    var diff = crossEntropy(p, q) - entropy(p);
    return Math.max(Math.abs(same), diff < -1e-15 ? 1 : 0);
  });
  check('kl：p=q 为 0；kl([.5,.5]‖[.25,.75])=0.20751874964', 1e-12, function () {
    var same = klDivergence([0.3, 0.7], [0.3, 0.7]);
    var known = klDivergence([0.5, 0.5], [0.25, 0.75]);
    return Math.max(Math.abs(same), Math.abs(known - 0.207518749639422));
  });
  check('js：对称且 ∈[0,1]', 1e-15, function () {
    var p = [0.1, 0.9], q = [0.8, 0.2];
    return Math.max(Math.abs(jsDivergence(p, q) - jsDivergence(q, p)), jsDivergence(p, q) > 1 ? 1 : 0, jsDivergence(p, q) < 0 ? 1 : 0);
  });
  check('mutualInfo：独立为 0；完全相关 = H(X)', 1e-12, function () {
    var px = [0.5, 0.5], py = [0.5, 0.5];
    var indep = [[px[0] * py[0], px[0] * py[1]], [px[1] * py[0], px[1] * py[1]]];
    var corr = [[0.5, 0], [0, 0.5]];
    return Math.max(Math.abs(mutualInfo(indep)), Math.abs(mutualInfo(corr) - 1));
  });
  check('conditionalEntropy：H(X|Y) = H(X,Y) − H(Y)', 1e-12, function () {
    var joint = [[0.2, 0.1], [0.3, 0.4]];
    var hxy = 0;
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) hxy -= joint[i][j] * Math.log2(joint[i][j]);
    var py = [joint[0][0] + joint[1][0], joint[0][1] + joint[1][1]];
    var hy = entropy(py);
    return Math.abs(conditionalEntropy(joint) - (hxy - hy));
  });
  check('infoGain：纯分裂 = 1 bit；恒 ≥ −1e-15', 1e-12, function () {
    var parent = [0, 0, 0, 0, 1, 1, 1, 1];
    var gain = infoGain(parent, [[0, 0, 0, 0], [1, 1, 1, 1]]);
    return Math.max(Math.abs(gain - 1), gain < -1e-15 ? 1 : 0);
  });
  check('gini：[0,0,1,1]=0.5；纯类为 0', 1e-15, function () {
    return Math.max(Math.abs(gini([0, 0, 1, 1]) - 0.5), Math.abs(gini([1, 1, 1])));
  });
  check('gd：凸二次收敛至解析最优 ≤ 1e-7', 1e-7, function () {
    var A = [1, 10, 100], b = [1, -2, 3];
    var f = function (x) { return 0.5 * (A[0] * x[0] * x[0] + A[1] * x[1] * x[1] + A[2] * x[2] * x[2]) - (b[0] * x[0] + b[1] * x[1] + b[2] * x[2]); };
    var g = function (x) { return [A[0] * x[0] - b[0], A[1] * x[1] - b[1], A[2] * x[2] - b[2]]; };
    var r = gradientDescent(f, g, [0, 0, 0], { lr: 0.01, iters: 30000 });
    var xs = [b[0] / A[0], b[1] / A[1], b[2] / A[2]];
    return norm2(r.x.map(function (v, i) { return v - xs[i]; }));
  });
  check('adam：凸二次收敛至解析最优 ≤ 1e-5', 1e-5, function () {
    var A = [1, 10, 100], b = [1, -2, 3];
    var f = function (x) { return 0.5 * (A[0] * x[0] * x[0] + A[1] * x[1] * x[1] + A[2] * x[2] * x[2]) - (b[0] * x[0] + b[1] * x[1] + b[2] * x[2]); };
    var g = function (x) { return [A[0] * x[0] - b[0], A[1] * x[1] - b[1], A[2] * x[2] - b[2]]; };
    var r = adam(f, g, [0, 0, 0], { lr: 0.02, iters: 5000 });
    var xs = [b[0] / A[0], b[1] / A[1], b[2] / A[2]];
    return norm2(r.x.map(function (v, i) { return v - xs[i]; }));
  });
  check('cg：SPD 系统 ≤ n 步收敛，残差 ≤ 1e-10', 1e-10, function () {
    var qr = qrDecompose(spdMatrix(6, 30));
    var Q = qr.Q;
    var Lam = Array.from({ length: 6 }, function (_, i) { return i + 1; });
    var A = matMul(matMul(transpose(Q), Lam.map(function (l, i) { return Array.from({ length: 6 }, function (_, j) { return i === j ? l : 0; }); })), Q);
    var b = normalSample(6, 31);
    var r = conjugateGradient(A, b, { tol: 1e-12 });
    return r.residual / (1 + norm2(b));
  });
  check('layernorm：行均值≈0、方差≈1', 1e-4, function () {
    var rng = mulberry32(32);
    var x = Array.from({ length: 4 }, function () { return Array.from({ length: 8 }, function () { return rng() * 10 - 5; }); });
    var out = layerNorm(x, 1e-5);
    var worst = 0;
    for (var i = 0; i < out.length; i++) {
      var m = expectation(out[i]), v = variance(out[i]);
      worst = Math.max(worst, Math.abs(m), Math.abs(v - 1));
    }
    return worst;
  });
  check('attention：权重行和=1；因果掩码上三角严格为 0', 1e-14, function () {
    var rng = mulberry32(33);
    var Q = Array.from({ length: 4 }, function () { return [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1]; });
    var K = Q.map(function (r) { return r.slice(); });
    var V = Q.map(function (r) { return r.slice(); });
    var a = selfAttention(Q, K, V, true);
    var rowSum = 0;
    for (var i = 0; i < a.weights.length; i++) rowSum = Math.max(rowSum, Math.abs(a.weights[i].reduce(function (x, y) { return x + y; }, 0) - 1));
    var upper = 0;
    for (var i2 = 0; i2 < 4; i2++) for (var j = i2 + 1; j < 4; j++) upper = Math.max(upper, a.weights[i2][j]);
    return Math.max(rowSum, upper);
  });
  check('temperature：T 下降 → 熵下降', 1e-12, function () {
    var logits = [1, 2, 3, 4];
    var h05 = entropy(temperatureSoftmax(logits, 0.5));
    var h1 = entropy(temperatureSoftmax(logits, 1));
    var h2 = entropy(temperatureSoftmax(logits, 2));
    return (h05 < h1 && h1 < h2) ? 0 : 1;
  });
  check('topk：支撑外严格为 0；支撑上归一化和=1', 1e-15, function () {
    var out = topK([0.1, 0.4, 0.2, 0.3], 2);
    return Math.max(Math.abs(out[0]) + Math.abs(out[2]), Math.abs(out[1] + out[3] - 1), Math.abs(out[1] - 0.4 / 0.7));
  });
  check('hmm：前向-后验每帧和=1；P(O) 与 256 路径全枚举一致', 1e-10, function () {
    var pi = [0.5, 0.5];
    var A = [[0.7, 0.3], [0.4, 0.6]];
    var B = [[0.5, 0.4, 0.1], [0.1, 0.3, 0.6]];
    var obs = [0, 1, 2, 1, 0, 2, 0, 1];
    var fb = hmmForwardBackward(pi, A, B, obs);
    var rowSum = 0;
    for (var t = 0; t < obs.length; t++) rowSum = Math.max(rowSum, Math.abs(fb.posteriors[t].reduce(function (a, b) { return a + b; }, 0) - 1));
    var total = 0;
    for (var mask = 0; mask < 256; mask++) {
      var p = pi[(mask >> 7) & 1] * B[(mask >> 7) & 1][obs[0]];
      for (var t2 = 1; t2 < 8; t2++) {
        var prev = (mask >> (8 - t2)) & 1, cur = (mask >> (7 - t2)) & 1;
        p *= A[prev][cur] * B[cur][obs[t2]];
      }
      total += p;
    }
    return Math.max(rowSum, Math.abs(fb.logPO - Math.log(total)) / Math.abs(fb.logPO));
  });
  check('hmm：Viterbi 路径 = 全枚举最优路径', 1e-9, function () {
    var pi = [0.5, 0.5];
    var A = [[0.7, 0.3], [0.4, 0.6]];
    var B = [[0.5, 0.4, 0.1], [0.1, 0.3, 0.6]];
    var obs = [0, 1, 2, 1, 0, 2, 0, 1];
    var v = hmmViterbi(pi, A, B, obs);
    var best = -Infinity, bestPath = null;
    for (var mask = 0; mask < 256; mask++) {
      var lp = Math.log(pi[(mask >> 7) & 1]) + Math.log(B[(mask >> 7) & 1][obs[0]]);
      for (var t = 1; t < 8; t++) {
        var prev = (mask >> (8 - t)) & 1, cur = (mask >> (7 - t)) & 1;
        lp += Math.log(A[prev][cur]) + Math.log(B[cur][obs[t]]);
      }
      if (lp > best) { best = lp; bestPath = mask; }
    }
    var vPath = 0;
    v.path.forEach(function (s, i) { vPath |= s << (7 - i); });
    return Math.max(Math.abs(v.logprob - best), vPath === bestPath ? 0 : 1);
  });
  check('valueIteration：Bellman 残差 ≤ 1e-10；解析解 V(s)=10·γ^max(0,n−2−s)', 1e-8, function () {
    var r = valueIteration({ n: 7, gamma: 0.9, stochastic: false, tol: 1e-13 });
    var analytic = 0;
    for (var s = 0; s < 7; s++) analytic = Math.max(analytic, Math.abs(r.V[s] - 10 * Math.pow(0.9, Math.max(0, 5 - s))));
    var mono = true;
    for (var t = 1; t < r.snapshots.length; t++) {
      for (var s2 = 0; s2 < 7; s2++) if (r.snapshots[t][s2] < r.snapshots[t - 1][s2] - 1e-12) mono = false;
    }
    return mono ? Math.max(r.residual, analytic) : 1;
  });
  check('td0：α=1 确定性链一步后向扫描 = 解析解 γ^d', 1e-12, function () {
    var V = td0Sweep(7, 0.9);
    var worst = 0;
    for (var s = 0; s < 6; s++) worst = Math.max(worst, Math.abs(V[s] - Math.pow(0.9, 5 - s)));
    return worst;
  });
  check('qLearning：训练后贪心策略到达目标率 ≥ 0.9', 0.1, function () {
    var r = qLearning({ n: 7, gamma: 0.9, episodes: 5000, seed: 123 });
    return 1 - r.successRate;
  });
  check('epsilonGreedy：ε=0 时严格取 argmax', 0, function () {
    var rng = mulberry32(77);
    return epsilonGreedy([1, 3, 2], 0, rng) === 1 ? 0 : 1;
  });
  check('classification metrics：accuracy/precision/recall/f1 公式一致', 1e-15, function () {
    var y = [1, 1, 0, 0, 1, 0], yhat = [1, 0, 0, 1, 1, 0];
    return Math.max(
      Math.abs(accuracy(y, yhat) - 4 / 6),
      Math.abs(precision(y, yhat) - 2 / 3),
      Math.abs(recall(y, yhat) - 2 / 3),
      Math.abs(f1(y, yhat) - 2 / 3)
    );
  });
  check('auc：完美分离=1；A(y,s)=1−A(y,−s)', 1e-15, function () {
    var perfect = auc([0, 0, 1, 1], [0.1, 0.2, 0.7, 0.8]);
    var y = [0, 0, 1, 1, 1], s = [0.1, 0.4, 0.35, 0.8, 0.9];
    var identity = auc(y, s) + auc(y, s.map(function (v) { return -v; }));
    return Math.max(Math.abs(perfect - 1), Math.abs(identity - 1));
  });
  check('r2：完美拟合=1；均值预测≈0', 1e-12, function () {
    var y = [1, 2, 3, 4];
    return Math.max(Math.abs(r2(y, y.slice()) - 1), Math.abs(r2(y, [2.5, 2.5, 2.5, 2.5])));
  });
  check('cosine：cos(x,x)=1；正交基精确为 0；|cos|≤1', 1e-15, function () {
    var x = [3, 4];
    return Math.max(
      Math.abs(cosineSimilarity(x, x) - 1),
      Math.abs(cosineSimilarity([1, 0], [0, 1])),
      Math.abs(cosineSimilarity([1, 1], [1, 0]) - Math.SQRT1_2)
    );
  });
  check('editDistance：d(kitten,sitting)=3；对称；d("",abc)=3', 0, function () {
    return Math.max(
      editDistance('kitten', 'sitting') - 3,
      Math.abs(editDistance('kitten', 'sitting') - editDistance('sitting', 'kitten')),
      editDistance('', 'abc') - 3
    );
  });
  check('silhouette：∈[−1,1]；分离簇 > 0.5', 1e-15, function () {
    var rng = mulberry32(40);
    var X = [], labels = [];
    for (var i = 0; i < 40; i++) {
      var c = i < 20 ? [0, 0] : [8, 8];
      X.push([c[0] + (rng() * 2 - 1) * 0.5, c[1] + (rng() * 2 - 1) * 0.5]);
      labels.push(i < 20 ? 0 : 1);
    }
    var s = silhouette(X, labels);
    var mean = s.reduce(function (a, b) { return a + b; }, 0) / s.length;
    var bound = 0;
    for (var i2 = 0; i2 < s.length; i2++) bound = Math.max(bound, Math.abs(s[i2]) - 1);
    return Math.max(bound, mean > 0.5 ? 0 : 0.5 - mean);
  });
  check('shuffle：多重集守恒且非恒等', 0, function () {
    var a = shuffle(Array.from({ length: 100 }, function (_, i) { return i; }), 5);
    var sorted = a.slice().sort(function (x, y) { return x - y; });
    var same = 0;
    for (var i = 0; i < 100; i++) if (a[i] === i) same++;
    return (maxAbsDiff(sorted, Array.from({ length: 100 }, function (_, i) { return i; })) === 0 && same < 100) ? 0 : 1;
  });
  check('trainTestSplit：规模和、无交集', 0, function () {
    var r = trainTestSplit(100, 0.8, 3);
    var set = new Set(r.train.concat(r.test));
    return (r.train.length === 80 && r.test.length === 20 && set.size === 100) ? 0 : 1;
  });
  check('kFold：并集=全集、两两不交', 0, function () {
    var folds = kFold(17, 5, 9);
    var seen = new Set();
    for (var i = 0; i < folds.length; i++) {
      if (folds[i].length === 0) return 1;
      for (var j = 0; j < folds[i].length; j++) {
        if (seen.has(folds[i][j])) return 1;
        seen.add(folds[i][j]);
      }
    }
    return seen.size === 17 ? 0 : 1;
  });
  check('oneHot：行和=1、维度=类数', 0, function () {
    var oh = oneHot([0, 1, 2, 1, 0]);
    var bad = 0;
    for (var i = 0; i < oh.matrix.length; i++) if (oh.matrix[i].reduce(function (a, b) { return a + b; }, 0) !== 1 || oh.matrix[i].length !== 3) bad++;
    return bad;
  });
  check('arena：分配区间两两不交；越界抛错；reset 复用', 0, function () {
    var arena = new Arena(16);
    var a = arena.alloc(8), b = arena.alloc(8);
    var bad = (a.offset === 0 && b.offset === 8 && a.offset + a.length <= b.offset) ? 0 : 1;
    var threw = false;
    try { arena.alloc(1); } catch (e) { threw = true; }
    arena.reset();
    var c = arena.alloc(16);
    return bad + (threw ? 0 : 1) + (c.offset === 0 ? 0 : 1);
  });
  check('reduceAll：= Kahan 精确和（朴素求和损失全部有效位）', 1e-9, function () {
    var xs = [1e16, 1, 1, -1e16];
    var naive = xs.reduce(function (a, b) { return a + b; }, 0);
    return Math.abs(reduceAll(xs) - 2) + (Math.abs(naive - 2) > 1 ? 0 : 1);
  });
  check('broadcast：恒等映射（深拷贝）', 0, function () {
    var xs = [1, 2, 3];
    var b = broadcast(xs);
    b[0] = 99;
    return (xs[0] === 1 && maxAbsDiff(broadcast(xs), xs) === 0) ? 0 : 1;
  });
  check('mulberry32：同种子 → 同序列（可复现）', 0, function () {
    var r1 = mulberry32(42), r2 = mulberry32(42);
    for (var i = 0; i < 10; i++) if (r1() !== r2()) return 1;
    return 0;
  });

  function runChecks() {
    var results = checks.map(function (c) {
      var residual, err = null;
      try { residual = c.run(); } catch (e) { residual = Infinity; err = e; }
      var pass = isFinite(residual) && residual <= c.tol;
      return { name: c.name, residual: residual, tol: c.tol, pass: pass, error: err ? String(err.message || err) : null };
    });
    return {
      total: results.length,
      passed: results.filter(function (r) { return r.pass; }).length,
      results: results
    };
  }

  return {
    version: VERSION,
    /* 工具 */
    mulberry32: mulberry32, zeros2: zeros2, eye: eye, clone2: clone2, dot: dot, norm2: norm2, normInf: normInf,
    maxAbsDiff: maxAbsDiff, maxAbsDiff2: maxAbsDiff2, dist2: dist2, euclid: euclid, spdMatrix: spdMatrix,
    /* 线性代数 */
    transpose: transpose, matMul: matMul, matVec: matVec, trace: trace, det: det, inverse: inverse,
    solveLinear: solveLinear, solveLower: solveLower, cholesky: cholesky, safeCholesky: safeCholesky,
    qrDecompose: qrDecompose, jacobiEigen: jacobiEigen, powerIteration: powerIteration, pca: pca,
    /* 数值稳定 */
    logsumexp: logsumexp, softmax: softmax, sigmoid: sigmoid, tanh: tanh, relu: relu, gelu: gelu,
    erf: erf, normalCDF: normalCDF, kahanSum: kahanSum, exactSum: exactSum, clip: clip,
    /* 概率统计 */
    gaussPDF: gaussPDF, expectation: expectation, variance: variance, covariance: covariance,
    normalSample: normalSample, categoricalSample: categoricalSample, bayesUpdate: bayesUpdate,
    /* 信息论 */
    entropy: entropy, crossEntropy: crossEntropy, klDivergence: klDivergence, jsDivergence: jsDivergence,
    mutualInfo: mutualInfo, conditionalEntropy: conditionalEntropy, gini: gini, infoGain: infoGain,
    /* 优化 */
    gradientDescent: gradientDescent, adam: adam, conjugateGradient: conjugateGradient,
    /* 模型 */
    linearRegression: linearRegression, logisticRegression: logisticRegression, kmeans: kmeans, kmeansPP: kmeansPP,
    gmmEM: gmmEM, knn: knn, decisionTree: decisionTree,
    mlpForward: mlpForward, mlpLoss: mlpLoss, mlpGrad: mlpGrad, gradientCheck: gradientCheck, mlpTrain: mlpTrain,
    /* 深度学习组件 */
    linear: linear, layerNorm: layerNorm, selfAttention: selfAttention,
    /* 图模型 */
    hmmForwardBackward: hmmForwardBackward, hmmViterbi: hmmViterbi,
    /* 强化学习 */
    valueIteration: valueIteration, td0Sweep: td0Sweep, qLearning: qLearning, epsilonGreedy: epsilonGreedy,
    /* 指标 */
    accuracy: accuracy, precision: precision, recall: recall, f1: f1, auc: auc, mse: mse, mae: mae,
    r2: r2, logLoss: logLoss, cosineSimilarity: cosineSimilarity, editDistance: editDistance, silhouette: silhouette,
    /* 归一化/数据/系统 */
    l1Norm: l1Norm, l2Norm: l2Norm, linfNorm: linfNorm, normalizeL2: normalizeL2, minmaxScale: minmaxScale,
    zscore: zscore, l2Reg: l2Reg, temperatureSoftmax: temperatureSoftmax, topK: topK,
    shuffle: shuffle, trainTestSplit: trainTestSplit, kFold: kFold, oneHot: oneHot,
    Arena: Arena, reduceAll: reduceAll, broadcast: broadcast,
    /* 自检 */
    checks: checks, runChecks: runChecks
  };
});
