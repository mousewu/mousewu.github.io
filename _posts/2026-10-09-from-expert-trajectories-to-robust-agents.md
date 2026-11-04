---
layout: post
title: "From Expert Trajectories to Robust Agents: What Noise RL Actually Teaches"
title_zh: "从专家轨迹到鲁棒智能体：Noise RL 到底教会了模型什么"
description: "A multi-seed ALFWorld study separating task learning from robustness learning across clean, matched, independent, and coupled-noise reinforcement learning."
description_zh: "一项多随机种子的 ALFWorld 研究，对比 Clean、Matched、Independent 与 Coupled-noise 强化学习，区分任务学习与鲁棒性学习。"
date: 2026-10-09
last_modified_at: 2026-11-04
categories: [Agentic RL, LLM Agents]
topic_en: Agentic RL
topic_zh: 智能体 RL
kicker_en: Agentic RL · Experiment report
kicker_zh: 智能体 RL · 实验报告
reading_time: 18 min read
reading_time_zh: 阅读约 18 分钟
---

<div data-lang-content="en" markdown="1">

> **Updated November 4, 2026.** This post now reports the complete evaluation matrix: four RL methods, three training seeds, five evaluation conditions, 134 held-out tasks, and 32,160 RL evaluation episodes. The central result is sharper than the original single-run story: clean RL learns the task, but noise RL is required to make the policy robust. Independent-noise LOO gives the best overall trade-off, reaching **91.4% matched-noise success** and **82.5% strong-noise success**, while preserving **95.8% clean success**.

## The research question

An LLM agent is not just a set of model weights. Its behavior also depends on the harness around the model: the prompt, tool schema, action parser, environment transition, observation format, context policy, and termination rules.

One ALFWorld interaction turn in this project looks like this:

```text
The model emits one JSON action
              ↓
The harness parses and executes it in ALFWorld
              ↓
The environment returns a text observation
              ↓
The observation enters the context and the model acts again
```

This creates two distinct learning problems:

1. **Task learning:** can the agent complete ALFWorld tasks efficiently?
2. **Robustness learning:** can it still complete them when the harness drops an action or loses an observation?

The experiments below separate these questions. We first use supervised fine-tuning (SFT) to establish a usable policy, then compare clean RL with three noise-aware leave-one-out (LOO) training designs.

## Experimental setup

The base model was `Qwen3-4B-Instruct-2507`. Training used [Slime](https://github.com/THUDM/slime), the environment was [ALFWorld](https://github.com/alfworld/alfworld), and telemetry was recorded with SwanLab.

| Stage | Main configuration |
| --- | --- |
| SFT | 3,553 expert trajectories and 21,335 expert actions; action-only loss; batch size 32; three epochs; peak learning rate `5e-6`; 4×A100 80GB |
| RL | Fully asynchronous LOO/GRPO-style training; eight samples per prompt; 8×A100 80GB, split between actor training and rollout |
| Evaluation | 134 `valid_unseen` tasks × four repeats = 536 episodes per checkpoint-condition cell; temperature 0.8 |
| Replication | Four RL methods × seeds 42, 43, and 44 × five conditions = 60 cells and 32,160 RL episodes |

SFT and RL used the same JSON action representation and online environment protocol. SFT loss was applied only to assistant actions, not to system prompts or environment observations.

### Training methods

- **Clean RL:** no action or observation faults during training.
- **Matched-noise LOO:** samples compared within a group experience the same sampled fault pattern.
- **Independent-noise LOO:** each rollout samples faults independently, so the group comparison averages over harness randomness.
- **Coupled-prompt LOO:** fault coupling is organized at the prompt/group level to control common randomness while retaining noisy interaction.

### Evaluation conditions

| Condition | Faults applied at evaluation |
| --- | --- |
| Clean | No injected faults |
| Action-only | Action dropping only |
| Observation-only | Observation loss only |
| Matched | 15% action drop and 10% observation loss, matching the main training setting |
| Strong | A stronger combined-noise stress test |

The noise is injected during real multi-turn interaction, not by corrupting static labels. The agent must infer whether an action took effect, recover when information is missing, and finish within the interaction budget.

## Stage 1: expert SFT establishes a usable policy

Sparse-reward RL cannot bootstrap reliably if almost every trajectory fails. When every sample in a group receives the same reward, the relative advantages are zero and the optimizer receives no useful comparison signal.

SFT teaches three prerequisites:

1. Emit JSON actions that the harness can parse.
2. Understand ALFWorld actions and observations.
3. Reach enough initial successes for RL to compare good and bad trajectories.

The SFT run completed 333 optimizer updates. Cross-entropy loss fell from **1.174 to 0.018**, with most improvement occurring early.

![ALFWorld SFT loss](/assets/blog/alfworld_sft_loss.png)

Low training loss did not make the agent reliable. Under the final unified evaluation protocol, the SFT checkpoint achieved:

| Clean | Action-only | Observation-only | Matched | Strong |
| ---: | ---: | ---: | ---: | ---: |
| 51.1% | 39.7% | 48.5% | 35.8% | 30.0% |

Most failures exhausted the turn budget rather than crashing on malformed output. SFT had taught the interface and basic behavior, but not a compact or fault-tolerant policy.

## Stage 2: RL learns the task—and noise RL learns recovery

For each task, the policy generated eight rollouts and used a leave-one-out baseline to produce relative advantages. Successful action sequences received positive signal while failed trajectories for the same task acted as controls.

The training curve below is from an early exploratory matched-noise run. It remains useful as an illustration of the learning dynamics, but it is not the source of the multi-seed aggregate results reported later.

![ALFWorld RL effective reward window](/assets/blog/alfworld_rl_reward_effective.png)

The early runs revealed two effects that later repeated across the full experiment:

- RL dramatically shortened successful policies.
- Continuing updates after saturation could destabilize and eventually collapse a strong policy.

One subtle point is that RL `train/loss` should not be read like SFT cross-entropy. Its value depends on relative advantages, importance ratios, clipping, and cancellation between positive and negative samples. Held-out success, non-zero groups, policy drift, gradient norm, and trajectory efficiency are more informative.

## Main result: the complete multi-seed evaluation

The table reports mean success ± standard deviation across three independent RL training seeds. The SFT baseline is a single trained checkpoint and therefore has no across-seed standard deviation.

| Method | Clean | Action-only | Observation-only | Matched | Strong |
| --- | ---: | ---: | ---: | ---: | ---: |
| SFT baseline | 51.12 | 39.74 | 48.51 | 35.82 | 30.04 |
| Clean RL | **97.57 ± 0.49** | 74.32 ± 2.72 | 93.22 ± 0.28 | 68.91 ± 1.55 | 48.07 ± 0.88 |
| Matched-noise LOO | 95.27 ± 0.66 | 92.91 ± 1.17 | 93.03 ± 1.32 | 88.93 ± 0.92 | **82.90 ± 0.54** |
| Independent-noise LOO | 95.77 ± 0.22 | 94.09 ± 0.47 | **94.53 ± 1.03** | **91.36 ± 0.84** | 82.52 ± 1.12 |
| Coupled-prompt LOO | 96.08 ± 0.56 | **94.59 ± 0.49** | 94.40 ± 0.81 | 90.49 ± 0.93 | 81.22 ± 0.78 |

All values are percentages. Bold marks the best RL mean in each evaluation condition.

### Result 1: clean RL learns general task completion

Relative to SFT, clean RL improved success by:

- **+46.45 points** on clean evaluation;
- **+34.58 points** with action drops;
- **+44.71 points** with observation loss;
- **+33.09 points** under matched combined noise;
- **+18.03 points** under strong noise.

So ordinary online RL is already valuable. It turns an imitation policy into a much stronger task-solving policy and transfers part of that gain to conditions it never saw during training.

### Result 2: clean competence is not robust competence

Clean RL reached 97.57% in the clean environment, but fell to 74.32% with action dropping, 68.91% under matched combined noise, and 48.07% under strong noise. Its strong-noise penalty relative to clean performance was **49.50 points**.

Observation loss alone was much less damaging: clean RL retained 93.22%. This identifies **action dropping as the dominant fault** in the current harness. Losing an observation is often recoverable from later state; silently losing a state-changing action can invalidate the agent's assumed world state.

### Result 3: noise RL closes most of the robustness gap

Compared with clean RL, independent-noise LOO changed success by:

| Clean | Action-only | Observation-only | Matched | Strong |
| ---: | ---: | ---: | ---: | ---: |
| −1.80 | **+19.78** | +1.31 | **+22.45** | **+34.45** |

This is the main research result. A small clean-performance cost buys a very large improvement under action faults and combined noise. The effect is not merely better task learning: the training distribution changes the recovery behavior learned by the agent.

### Result 4: independent-noise LOO is the best overall trade-off

| Method | Average over all five conditions | Average over four noisy conditions | Worst condition |
| --- | ---: | ---: | ---: |
| Clean RL | 76.42 | 71.13 | 48.07 |
| Matched-noise LOO | 90.61 | 89.44 | **82.90** |
| Independent-noise LOO | **91.65** | **90.62** | 82.52 |
| Coupled-prompt LOO | 91.36 | 90.17 | 81.22 |

Independent-noise LOO had the best overall and noisy-condition averages. It also beat matched-noise LOO on matched evaluation for every training seed: **+2.61, +2.05, and +2.61 points** for seeds 42, 43, and 44.

A plausible interpretation is that independently sampled faults prevent the group baseline from treating one particular fault realization as part of task identity. The policy must learn behavior that succeeds across fault realizations, rather than specialize to a shared corruption pattern. This is an inference from the experimental design and requires further ablation to establish causality.

Coupled-prompt LOO was competitive and had the best action-only mean, but it did not consistently surpass independent-noise training under matched or strong combined noise. More complicated coupling therefore did not produce a clear aggregate advantage in this setting.

## Robust policies are also more efficient

The improvement did not come from retrying more often. Independent-noise LOO used far fewer generated tokens than SFT:

| Condition | SFT tokens | Independent-noise tokens | Reduction |
| --- | ---: | ---: | ---: |
| Clean | 285.0 | 126.2 | 55.7% |
| Action-only | 355.3 | 155.9 | 56.1% |
| Observation-only | 299.7 | 140.5 | 53.1% |
| Matched | 370.9 | 174.3 | 53.0% |
| Strong | 404.6 | 233.1 | 42.4% |

Mean tool calls show the same pattern. Under matched noise, they fell from **30.6 for SFT** to **14.7 for independent-noise LOO**; under strong noise, from **33.4 to 19.9**.

The robust policy therefore learned **effective recovery**, not brute-force repetition. It usually followed a shorter path and spent extra actions only when the fault condition required them.

## The failure we should not hide: RL can still collapse

The early main run produced a strong middle checkpoint and a useless final checkpoint:

| RL checkpoint | Noisy success |
| --- | ---: |
| `iter_0000049` | 93.8% |
| `iter_0000099` | 97.6% |
| `iter_0000299` | **98.7%** |
| `iter_0000449` | **98.7%** |
| `iter_0000499` | 7.5% |
| `iter_0000699` | 0.0% |

The collapse was a training-dynamics result, not the final multi-seed performance claim. It motivated stricter checkpoint selection and safer later experiments.

Several warning signs aligned:

- Success saturation produced many equal-reward groups and very little useful gradient signal.
- Fully asynchronous rollout created a version gap between generated trajectories and current actor weights.
- With weak policy anchoring, stale negative advantages could push the policy toward shorter but invalid behavior.
- Once every rollout in a group failed, relative advantages became zero and the policy could not recover by itself.

This is why `latest` is not a valid model-selection rule for agentic RL. The final matrix evaluates deliberately selected checkpoints under a fixed protocol.

## What these experiments taught us

### The harness is part of the learning problem

Action syntax, tool schemas, fault injection, error handling, turn limits, and context truncation all change the effective MDP. Training and evaluation must use aligned harness semantics. Otherwise two runs can share the label “ALFWorld” while solving different problems.

### Online reward is not independent evaluation

Training rollouts depend on task sampling, asynchronous policy versions, and random faults. We therefore used held-out `valid_unseen` tasks, fixed sampling settings, four repeats per task, and independently launched inference services.

### Task-level bootstrap and training seeds answer different questions

Bootstrap confidence intervals quantify uncertainty over held-out tasks for one checkpoint. Replicated training seeds measure optimization variability. They are not interchangeable.

The RL results now include three training seeds, but the SFT baseline still comes from one trained checkpoint. Moreover, the small differences among the three noise-RL methods should not be described as statistically significant until we run a **paired task-level hierarchical bootstrap** that preserves both task pairing and seed structure.

### Stopping criteria must be behavioral

For sparse-reward agentic RL, stop or reduce the learning rate when held-out success plateaus, effective groups disappear, policy drift rises, or trajectory behavior changes abruptly. Checkpoint every fixed interval and select using clean plus noisy held-out evaluation.

## Updated conclusions

The full experiment supports a three-stage account of agent learning:

1. **SFT teaches the interface and provides initial successful behavior.**
2. **Clean RL teaches efficient task completion.**
3. **Noise RL teaches robust task completion under an unreliable harness.**

The strongest practical configuration in this study is independent-noise LOO. It retained **95.8% clean success**, achieved **91.4% under matched noise**, and remained above **82% under strong noise**, while using roughly half as many generated tokens as the SFT policy.

The broader lesson is that robustness does not automatically emerge from high clean-task reward. If deployed agents will face dropped actions, missing observations, flaky tools, or ambiguous execution feedback, those failure modes must be represented in the online learning problem—and evaluated independently from ordinary task competence.

## Remaining experiments

Before treating the result as a finished paper claim, the next priorities are:

1. Run a paired hierarchical bootstrap for direct method-to-method comparisons.
2. Train additional SFT seeds, or clearly retain SFT as a fixed initialization baseline.
3. Sweep action-drop and observation-loss rates to estimate robustness curves rather than only five operating points.
4. Ablate group construction while holding the marginal noise distribution fixed.
5. Evaluate transfer to different noise rates, unseen fault types, and at least one additional agent environment.
6. Report compute and wall-clock efficiency alongside success and trajectory length.

## Experiment links

- [SwanLab project overview](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/overview)
- [SFT training curves](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/77110e675af74354bd5d4b08bae801ed/chart)
- [Early RL exploration run](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/1af53b5369cb4bd355d4a727942/chart)
- [Project source code](https://github.com/mousewu/slime-noise-rl)

> **Scope note:** These results use a project-specific ALFWorld text harness, fault injection, checkpoint-selection procedure, and evaluation protocol. They are not standard ALFWorld leaderboard numbers. RL values are means over three training seeds; the SFT baseline is one trained checkpoint. Differences among noise-RL variants require paired hierarchical analysis before being treated as statistically significant.

</div>

<div data-lang-content="zh" markdown="1">

> **更新于 2026 年 11 月 4 日。** 本文现在包含完整实验矩阵：4 种 RL 方法、3 个训练随机种子、5 种评测条件、134 个未见任务，以及 32,160 条 RL 评测轨迹。结论比早期单次实验更清晰：Clean RL 主要学习任务能力，而要让策略真正鲁棒，还需要 Noise RL。Independent-noise LOO 的综合表现最好，在保留 **95.8% clean 成功率**的同时，matched-noise 成功率达到 **91.4%**，strong-noise 成功率达到 **82.5%**。

## 研究问题

LLM 智能体不只是一组模型权重。它的行为还取决于模型周围的 harness：prompt、工具 schema、动作解析器、环境状态转移、观察格式、上下文策略以及终止规则。

在本项目中，一轮 ALFWorld 交互如下：

```text
模型生成一个 JSON 动作
          ↓
Harness 解析动作并在 ALFWorld 中执行
          ↓
环境返回文本观察
          ↓
观察被加入上下文，模型继续行动
```

这实际上包含两个不同的学习问题：

1. **任务学习：** 智能体能否高效完成 ALFWorld 任务？
2. **鲁棒性学习：** 当 harness 丢失动作或观察时，智能体还能否完成任务？

下面的实验将两者分开考察。我们先通过监督微调（SFT）建立可用的初始策略，再将 Clean RL 与三种基于 leave-one-out（LOO）的噪声训练方法进行比较。

## 实验设置

基础模型为 `Qwen3-4B-Instruct-2507`，训练框架使用 [Slime](https://github.com/THUDM/slime)，环境使用 [ALFWorld](https://github.com/alfworld/alfworld)，实验指标记录在 SwanLab 中。

| 阶段 | 主要配置 |
| --- | --- |
| SFT | 3,553 条专家轨迹、21,335 个专家动作；仅对 action 计算 loss；batch size 32；训练 3 个 epoch；峰值学习率 `5e-6`；4×A100 80GB |
| RL | Fully asynchronous LOO/GRPO 风格训练；每个 prompt 采样 8 条轨迹；8×A100 80GB，划分给 actor 训练和 rollout |
| 评测 | 134 个 `valid_unseen` 任务 × 4 次重复，即每个 checkpoint-condition 单元 536 条轨迹；temperature 0.8 |
| 重复实验 | 4 种 RL 方法 × 3 个随机种子（42、43、44）× 5 种条件，共 60 个单元、32,160 条 RL 轨迹 |

SFT 与 RL 使用相同的 JSON 动作表示和在线环境协议。SFT 只在 assistant 动作上计算 loss，不对 system prompt 或环境 observation 计算 loss。

### 训练方法

- **Clean RL：** 训练时不注入动作或观察故障。
- **Matched-noise LOO：** 同一 group 中被比较的样本使用相同的噪声模式。
- **Independent-noise LOO：** 每条 rollout 独立采样噪声，使组内比较对 harness 的随机性进行平均。
- **Coupled-prompt LOO：** 在 prompt/group 层面对故障进行耦合，在保留噪声交互的同时控制共同随机性。

### 评测条件

| 条件 | 评测时注入的故障 |
| --- | --- |
| Clean | 不注入故障 |
| Action-only | 只丢弃 action |
| Observation-only | 只丢失 observation |
| Matched | 15% action drop 与 10% observation loss，与主要训练设置一致 |
| Strong | 更强的组合噪声压力测试 |

噪声是在真实的多轮交互中注入的，而不是简单破坏静态标签。智能体必须判断动作是否真正生效，在状态信息缺失时恢复，并在固定交互预算内完成任务。

## 阶段一：专家 SFT 建立可用策略

如果几乎所有轨迹都失败，稀疏奖励 RL 很难自行启动。当同一 group 内所有样本奖励相同时，相对 advantage 为零，优化器得不到有用的比较信号。

SFT 用于教会模型三个前置能力：

1. 输出 harness 可以解析的 JSON 动作；
2. 理解 ALFWorld 的动作与观察；
3. 将初始成功率提高到 RL 能够比较成功与失败轨迹的范围。

SFT 共完成 333 次优化更新，交叉熵 loss 从 **1.174** 降到 **0.018**，大部分改善发生在训练早期。

![ALFWorld SFT loss](/assets/blog/alfworld_sft_loss.png)

但低训练 loss 并不代表策略已经可靠。在最终统一评测协议下，SFT checkpoint 的成功率为：

| Clean | Action-only | Observation-only | Matched | Strong |
| ---: | ---: | ---: | ---: | ---: |
| 51.1% | 39.7% | 48.5% | 35.8% | 30.0% |

多数失败来自耗尽交互轮数，而不是输出格式错误。SFT 已经教会模型基本接口和操作方式，但策略仍然低效且脆弱。

## 阶段二：RL 学会完成任务，Noise RL 学会故障恢复

对于每个任务，策略生成 8 条 rollout，并使用 leave-one-out baseline 计算相对 advantage。成功动作序列获得正向信号，同一任务中的失败轨迹作为对照。

下图来自早期的 matched-noise 探索实验。它可以说明训练动态，但后文的多随机种子汇总结果并不是从这条曲线计算得出的。

![ALFWorld RL effective reward window](/assets/blog/alfworld_rl_reward_effective.png)

早期实验揭示了两个后来反复出现的现象：

- RL 会显著缩短成功策略；
- 在性能饱和后继续更新，可能使一个很强的策略发生崩溃。

需要注意，RL 的 `train/loss` 不能像 SFT 交叉熵一样理解。它受到相对 advantage、importance ratio、clip，以及正负样本相互抵消的影响。Held-out 成功率、非零 advantage group、策略漂移、梯度范数和轨迹效率更值得关注。

## 主要结果：完整的多随机种子评测

下表给出三个独立 RL 训练随机种子的平均成功率 ± 标准差。SFT baseline 只有一个训练 checkpoint，因此没有跨随机种子的标准差。

| 方法 | Clean | Action-only | Observation-only | Matched | Strong |
| --- | ---: | ---: | ---: | ---: | ---: |
| SFT baseline | 51.12 | 39.74 | 48.51 | 35.82 | 30.04 |
| Clean RL | **97.57 ± 0.49** | 74.32 ± 2.72 | 93.22 ± 0.28 | 68.91 ± 1.55 | 48.07 ± 0.88 |
| Matched-noise LOO | 95.27 ± 0.66 | 92.91 ± 1.17 | 93.03 ± 1.32 | 88.93 ± 0.92 | **82.90 ± 0.54** |
| Independent-noise LOO | 95.77 ± 0.22 | 94.09 ± 0.47 | **94.53 ± 1.03** | **91.36 ± 0.84** | 82.52 ± 1.12 |
| Coupled-prompt LOO | 96.08 ± 0.56 | **94.59 ± 0.49** | 94.40 ± 0.81 | 90.49 ± 0.93 | 81.22 ± 0.78 |

所有数值均为百分比。粗体表示每种评测条件下表现最好的 RL 方法。

### 结果一：Clean RL 学会了通用任务能力

相对于 SFT，Clean RL 的成功率提升为：

- Clean：**+46.45 个百分点**；
- Action-only：**+34.58 个百分点**；
- Observation-only：**+44.71 个百分点**；
- Matched：**+33.09 个百分点**；
- Strong：**+18.03 个百分点**。

因此，普通在线 RL 本身已经很有价值：它将模仿策略变成更强的任务求解策略，并将部分能力迁移到训练时未见的故障条件。

### 结果二：Clean 能力不等于鲁棒能力

Clean RL 在无噪声环境中达到 97.57%，但加入 action drop 后降至 74.32%，matched 组合噪声下降至 68.91%，strong 噪声下仅为 48.07%。Strong 相对 clean 的损失达到 **49.50 个百分点**。

单独丢失 observation 的影响小得多，Clean RL 仍可达到 93.22%。这说明在当前 harness 中，**action drop 是主要故障来源**。丢失一次观察通常可以从后续状态中恢复，而静默丢失一个改变状态的动作，会直接破坏智能体对世界状态的假设。

### 结果三：Noise RL 弥补了大部分鲁棒性差距

Independent-noise LOO 相对 Clean RL 的变化为：

| Clean | Action-only | Observation-only | Matched | Strong |
| ---: | ---: | ---: | ---: | ---: |
| −1.80 | **+19.78** | +1.31 | **+22.45** | **+34.45** |

这是本文最重要的研究结果：只牺牲少量 clean 性能，就能换取 action 故障和组合噪声下的大幅提升。这并不只是任务能力变强，而是训练分布改变了智能体学到的恢复行为。

### 结果四：Independent-noise LOO 的综合权衡最好

| 方法 | 五种条件平均 | 四种噪声条件平均 | 最差条件 |
| --- | ---: | ---: | ---: |
| Clean RL | 76.42 | 71.13 | 48.07 |
| Matched-noise LOO | 90.61 | 89.44 | **82.90** |
| Independent-noise LOO | **91.65** | **90.62** | 82.52 |
| Coupled-prompt LOO | 91.36 | 90.17 | 81.22 |

Independent-noise LOO 在全部条件和噪声条件上的平均值都最高。在 matched 评测中，它对三个训练随机种子都超过 Matched-noise LOO，差值分别为 **+2.61、+2.05 和 +2.61 个百分点**。

一种可能解释是：独立采样故障能够避免 group baseline 将某一次特定噪声实现误认为任务本身的一部分。策略必须学会跨多种故障实现都能成功的行为，而不是适配一个共享的破坏模式。这是根据实验设计得到的推断，仍需进一步消融实验确认因果关系。

Coupled-prompt LOO 同样具有竞争力，并在 action-only 条件下取得最高均值，但在 matched 和 strong 组合噪声下没有稳定超过 Independent-noise。至少在当前设置中，更复杂的耦合没有带来明确的综合优势。

## 鲁棒策略也更加高效

性能提升并不是通过更多重试实现的。Independent-noise LOO 相比 SFT 显著减少了生成 token：

| 条件 | SFT tokens | Independent-noise tokens | 降幅 |
| --- | ---: | ---: | ---: |
| Clean | 285.0 | 126.2 | 55.7% |
| Action-only | 355.3 | 155.9 | 56.1% |
| Observation-only | 299.7 | 140.5 | 53.1% |
| Matched | 370.9 | 174.3 | 53.0% |
| Strong | 404.6 | 233.1 | 42.4% |

工具调用数也呈现相同趋势。在 matched 噪声下，平均工具调用从 SFT 的 **30.6** 降至 Independent-noise LOO 的 **14.7**；strong 噪声下则从 **33.4** 降至 **19.9**。

因此，鲁棒策略学到的是**有效恢复**，而不是暴力重复。它通常选择更短的路径，只在故障确实发生时增加必要动作。

## 不能回避的失败：RL 策略仍可能崩溃

早期主实验中，中间 checkpoint 很强，但最终 checkpoint 完全不可用：

| RL checkpoint | 噪声成功率 |
| --- | ---: |
| `iter_0000049` | 93.8% |
| `iter_0000099` | 97.6% |
| `iter_0000299` | **98.7%** |
| `iter_0000449` | **98.7%** |
| `iter_0000499` | 7.5% |
| `iter_0000699` | 0.0% |

这次崩溃属于训练动态结果，并不是最终多随机种子性能结论。它促使我们采用更严格的 checkpoint 选择和更安全的后续训练设置。

多个预警信号同时出现：

- 成功率饱和后，大量 group 奖励完全相同，有效梯度信号非常少；
- Fully asynchronous rollout 使生成轨迹的策略版本与当前 actor 权重之间存在差距；
- 在策略约束较弱时，陈旧的负 advantage 会将模型推向更短但无效的行为；
- 当 group 内所有 rollout 都失败时，相对 advantage 变为零，策略无法自行恢复。

因此，`latest` 不能作为 agentic RL 的模型选择规则。最终实验矩阵评测的是在固定协议下经过明确选择的 checkpoint。

## 这些实验带来的认识

### Harness 是学习问题的一部分

动作语法、工具 schema、故障注入、错误处理、交互轮数和上下文截断都会改变有效 MDP。训练与评测必须使用一致的 harness 语义，否则两个都叫“ALFWorld”的实验，模型实际解决的可能是不同问题。

### 在线 reward 不是独立评测

训练 rollout 受到任务采样、异步策略版本和随机故障影响。因此我们使用 held-out `valid_unseen` 任务、固定采样参数、每个任务重复 4 次，并为评测独立启动推理服务。

### Task-level bootstrap 与训练随机种子回答不同问题

Bootstrap 置信区间描述单个 checkpoint 在未见任务上的不确定性；多个训练随机种子描述优化过程的波动，两者不能互相替代。

目前 RL 结果已经包含 3 个训练随机种子，但 SFT baseline 仍只有一个训练 checkpoint。此外，在完成保持 task 配对和 seed 层次结构的 **paired task-level hierarchical bootstrap** 之前，不应把三种 Noise RL 方法之间的小差异描述为具有统计显著性。

### 停止训练必须依据行为指标

对于稀疏奖励 agentic RL，当 held-out 成功率停止提升、有效 group 消失、策略漂移上升或轨迹行为突然变化时，应停止训练或降低学习率。需要按固定间隔保存 checkpoint，并同时使用 clean 与 noisy held-out 评测进行选择。

## 更新后的结论

完整实验支持一个三阶段的智能体学习过程：

1. **SFT 教会模型接口并提供初始成功行为；**
2. **Clean RL 教会模型高效完成任务；**
3. **Noise RL 教会模型在不可靠 harness 下鲁棒地完成任务。**

本研究中最实用的配置是 Independent-noise LOO。它保留了 **95.8% clean 成功率**，在 matched 噪声下达到 **91.4%**，在 strong 噪声下仍超过 **82%**，同时生成 token 数约为 SFT 策略的一半。

更广泛的结论是：高 clean reward 不会自动产生鲁棒性。如果实际部署中的智能体会遇到动作丢失、观察缺失、工具不稳定或执行反馈模糊，那么这些故障必须进入在线学习问题，并且必须与普通任务能力分开评测。

## 后续实验

在将这些结果写成完整论文结论之前，下一步应优先完成：

1. 对方法间直接比较执行 paired hierarchical bootstrap；
2. 增加 SFT 随机种子，或明确将 SFT 保留为固定初始化 baseline；
3. 扫描 action-drop 和 observation-loss 概率，得到完整鲁棒性曲线，而不是只比较 5 个工作点；
4. 在保持边际噪声分布不变的前提下，消融 group 构造方法；
5. 测试对不同噪声强度、未见故障类型和至少一个额外智能体环境的迁移；
6. 在成功率和轨迹长度之外，报告计算量与 wall-clock 效率。

## 实验链接

- [SwanLab 项目总览](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/overview)
- [SFT 训练曲线](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/77110e675af74354bd5d4b08bae801ed/chart)
- [早期 RL 探索实验](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/1af53b5369cb4bd355d4a727942/chart)
- [项目源代码](https://github.com/mousewu/slime-noise-rl)

> **适用范围说明：** 这些结果使用项目特定的 ALFWorld 文本 harness、故障注入、checkpoint 选择流程和评测协议，不能视为标准 ALFWorld 排行榜成绩。RL 数值是 3 个训练随机种子的平均值，SFT baseline 只有一个训练 checkpoint。在完成 paired hierarchical analysis 之前，不能将不同 Noise RL 变体之间的差异视为统计显著。

</div>
