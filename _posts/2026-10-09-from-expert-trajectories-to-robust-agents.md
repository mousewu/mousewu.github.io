---
layout: post
title: "From Expert Trajectories to Robust Agents: SFT and Agentic RL on ALFWorld"
description: "How Qwen3-4B learned shorter and more reliable policies in a noisy text environment—and why training for too long destroyed the policy."
date: 2026-10-09
categories: [Agentic RL, LLM Agents]
reading_time: 14 min read
---

> This post documents an end-to-end agentic reinforcement learning experiment. We first fine-tuned Qwen3-4B-Instruct on expert ALFWorld trajectories, then used matched leave-one-out reinforcement learning to teach the model shorter and more robust policies under dropped actions and missing observations. On an independent noisy `valid_unseen` evaluation, task success increased from **39.2% after SFT to 98.7% after RL**.

## Why run this experiment?

An LLM agent is more than a set of model weights. Its behavior also depends on the harness surrounding the model: the prompt, tool schema, action parser, environment step, observation format, context policy, and termination rules.

In this project, one interaction turn looks like this:

```text
The model emits one JSON action
              ↓
The harness parses and executes it in ALFWorld
              ↓
The environment returns a text observation
              ↓
The observation enters the context and the model acts again
```

That leads to a practical research question: after supervised fine-tuning teaches a model to imitate expert actions, can online reinforcement learning teach it to recover from an unreliable harness?

We evaluated two environment conditions:

- **Clean:** actions and observations are delivered normally.
- **Noisy:** each action has a 15% probability of being dropped, and each observation has a 10% probability of being lost.

The noise is injected during real multi-turn interaction rather than by corrupting static labels. The model must infer whether an action took effect, recover when state information is missing, and still finish the task within a fixed interaction budget.

## Experimental setup

The base model was `Qwen3-4B-Instruct-2507`. Training used [Slime](https://github.com/THUDM/slime), the environment was [ALFWorld](https://github.com/alfworld/alfworld), and experiment telemetry was recorded with SwanLab.

| Stage | Main configuration |
| --- | --- |
| SFT | 3,553 expert trajectories and 21,335 expert actions; action-only loss; batch size 32; three epochs; peak learning rate `5e-6`; 4×A100 80GB |
| RL | Fully asynchronous matched-LOO; eight samples per prompt; batch size 64; learning rate `1e-6`; 8×A100 80GB, with two GPUs for actor training and six for rollout |
| Independent evaluation | 134 `valid_unseen` tasks × four repeats = 536 episodes; temperature 0.8; task-level bootstrap 95% confidence intervals |

SFT and RL shared the same action representation and online environment protocol. During SFT, loss was applied only to assistant actions, not to the system prompt or environment observations.

## Stage 1: Establishing a usable policy with expert SFT

Starting sparse-reward RL directly from a general instruction model creates a bootstrapping problem. If almost every trajectory fails, all samples in a group receive the same reward. The leave-one-out advantages are then zero, leaving the optimizer with no useful comparison signal.

SFT was used to teach three prerequisites:

1. Produce JSON actions that the harness can parse.
2. Understand ALFWorld actions and observations.
3. Raise initial task success into a range where RL can compare successful and unsuccessful rollouts.

The SFT run completed 333 optimizer updates. Cross-entropy loss fell from **1.174 to 0.018**. Most of the improvement happened in the first few dozen updates, followed by slower refinement.

![ALFWorld SFT loss](/assets/blog/alfworld_sft_loss.png)

Low training loss did not mean the agent was already reliable. On the independent evaluation, SFT checkpoint `iter_0000299` reached **39.2%** success in the noisy condition (95% CI: 34.1–44.4%) and **51.9%** in the clean condition. Most failures exhausted the turn budget rather than crashing on malformed output. The agent had learned how to operate the environment, but its policy was still inefficient and brittle.

## Stage 2: Improving multi-turn decisions with matched-LOO RL

RL started from the SFT checkpoint. For each task, the policy generated eight rollouts, and a leave-one-out baseline produced relative advantages. When some trajectories for the same task succeeded and others failed, successful action sequences received positive learning signal while failed trajectories served as within-task controls.

The matched design also reduced variance from task difficulty: trajectories in a comparison group shared the same task and fault condition, focusing the learning signal on policy quality rather than differences between tasks.

The curve below comes from the [`num_steps_per_rollout=2` exploratory run](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/1af53b5369cb4bd3a4bd355d4a727942/chart). It is intentionally limited to the first 190 rollouts—the effective learning window. The later policy collapse is discussed separately rather than being mixed into the final result.

![ALFWorld RL effective reward window](/assets/blog/alfworld_rl_reward_effective.png)

The useful part of training had three clear phases:

- Online success started at approximately **46.7%**.
- It first exceeded 90% around rollout 38 and 98% around rollout 59.
- Between rollouts 100 and 180, mean online success was approximately **98.0%**, with a peak of **99.8%**.

The policy also became much shorter. Mean tool calls fell from roughly 28 to 11–12, while generated tokens fell from roughly 338 to 140–150. The model learned to avoid unproductive exploration and solve tasks with fewer actions.

One subtle point is that RL `train/loss` should not be interpreted like SFT cross-entropy. In LOO/GRPO-style training, its absolute value depends on normalized advantages, importance ratios, and cancellation between positive and negative samples. A near-zero loss does not imply that nothing is being learned. Independent task success, advantage variance, non-zero groups, KL, gradient norm, and trajectory length are more informative.

## Independent evaluation: how much did RL help?

Online reward is influenced by sampling, the training-task distribution, and asynchronous policy versions. Final conclusions therefore came from a separate `valid_unseen` evaluation using a freshly launched inference service and fixed sampling settings.

It is important to distinguish two runs. The online curve above is from the `num_steps_per_rollout=2` exploration run. The checkpoint results below come from the main [`matched-loo-async-sft-based-46` run](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/9c20fab4da0b44c3bb916e4711266bc0/chart), which used `num_steps_per_rollout=1`. The configurations are similar, but the runs are not identical, so online rollout indices must not be mapped directly to actor checkpoint numbers.

| Model | Noisy success | Clean success | Mean generated tokens, noisy | Mean tool calls, noisy |
| --- | ---: | ---: | ---: | ---: |
| SFT `iter_0000299` | 39.2% | 51.9% | 360.2 | 29.8 |
| RL `iter_0000299` | **98.7%** | **100.0%** | **147.7** | **12.6** |

![Independent evaluation comparison](/assets/blog/alfworld_eval_success.png)

RL improved noisy success by **59.5 percentage points** and clean success by **48.1 points**. Under noise, it also reduced generated tokens by approximately **59%** and tool calls by approximately **58%**.

The clean result matters. RL did not merely overfit to the injected faults: after fault injection was disabled, the checkpoint still improved from 51.9% to 100%. It learned a better task policy, a shorter execution path, and more reliable state recovery.

## The failure we should not hide: the policy eventually collapsed

The middle checkpoints were strong, but continuing training did not produce a better model:

| RL checkpoint | Noisy success |
| --- | ---: |
| `iter_0000049` | 93.8% |
| `iter_0000099` | 97.6% |
| `iter_0000299` | **98.7%** |
| `iter_0000449` | **98.7%** |
| `iter_0000499` | 7.5% |
| `iter_0000699` | 0.0% |

After `iter_0000499`, success collapsed abruptly. The final checkpoint stopped emitting valid tool actions entirely. The `num_steps_per_rollout=2` exploratory run showed a similar failure: reward deteriorated after roughly rollout 195, followed by extreme spikes in loss and gradient norm.

A single run cannot establish one definitive cause, but several warning signs aligned:

- Once success saturated, most groups had identical rewards. `zero_group_fraction` exceeded 0.9, so useful policy-gradient signal had become rare.
- Fully asynchronous rollout introduces a version gap between generated trajectories and current actor weights. Multiple updates per rollout can amplify off-policy drift.
- Sparse, high-magnitude advantages combined with an occasional large gradient can push a working policy out of its stable region.
- Training continued to consume compute even after “more steps” stopped meaning “more capability.”

The collapsed tail was therefore excluded from the effective-training figure, but not hidden from the analysis. Checkpoint `iter_0000299` is the safer representative model. `iter_0000449` achieved the same noisy score but sat much closer to the collapse boundary.

## What went wrong along the way

### 1. Treating RL loss like supervised loss

Cross-entropy is useful for reading SFT convergence, but policy loss has no equivalent monotonic interpretation. We initially worried that a non-decreasing RL loss meant the model was not learning, even while online reward and independent success improved sharply. Agentic RL should be judged primarily by task success, trajectory efficiency, effective groups, and held-out evaluation.

### 2. Using online reward as evaluation

Training rollouts come from the training distribution and depend on sampling, random faults, and asynchronous actor versions. We fixed the dataset, seed, and sampling parameters, repeated each held-out task four times, and evaluated HF checkpoints converted from Megatron actor checkpoints. Rollout snapshots saved during training could not be assumed to align exactly with actor iterations.

### 3. Expecting sparse-reward RL to bootstrap itself

Without SFT, successes were too rare and many groups had all-zero reward, producing zero advantages. Expert SFT moved the model into an explorable region; only then could RL exploit relative differences between successful and failed trajectories.

### 4. Assuming agentic rollout is only a GPU problem

Each turn generates a short action and then waits for CPU environment execution. One trajectory is inherently sequential, so throughput depends on advancing many trajectories concurrently and ensuring synchronous environment calls do not block the asynchronous event loop. Moving environment steps into a bounded executor—and recording model latency, environment latency, queue time, and in-flight episodes—made the actual bottlenecks visible.

### 5. Treating the harness as implementation detail

Action syntax, tool schemas, turn limits, truncation, error handling, and fault injection all change the policy being trained. If SFT data uses one prompt/harness while RL and evaluation use another, the task name may stay the same while the model sees a different problem. We therefore rebuilt SFT examples with the same action protocol used online and reported clean and noisy conditions separately.

## Stopping before a good agent becomes a bad one

For high-success, sparse-reward agentic RL, stopping should be driven by held-out behavior rather than a large preselected step count:

1. Save a checkpoint every 50 actor iterations and run a small fixed evaluation.
2. Stop after two or three checkpoints without improvement.
3. If online success is saturated while `zero_group_fraction > 0.9`, reduce the learning rate or stop.
4. Alert on abnormal gradient norm, KL, tool-call count, and format-error rate.
5. Select the final checkpoint with independent clean and noisy evaluation—never assume `latest` is best.

Promising next experiments include a lower late-stage learning rate, stronger KL control, sampling based on effective groups, and switching to harder tasks or stronger noise after success saturates instead of repeatedly updating on groups with no advantage.

## Takeaways

- Expert SFT solved action formatting and basic environment operation while placing the model in a region where RL could obtain meaningful comparisons.
- Matched-LOO RL raised noisy `valid_unseen` success from 39.2% to 98.7% and cut trajectory length by more than half.
- The gain was not limited to fault recovery: clean success increased from 51.9% to 100%.
- Longer training was not better. Once useful advantages vanished, asynchronous drift and gradient instability could rapidly destroy a strong policy.
- The harness, environment concurrency, checkpoint identity, and independent evaluation protocol are first-class parts of an agentic RL experiment.

A 4B model can learn strong agent behavior inside a well-defined environment and training loop. The difficult part is not just choosing an RL objective. It is keeping data, harness, rollout, optimization, and evaluation aligned around the same problem.

## Experiment links

- [SFT training curves](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/77110e675af74354bd5d4b08bae801ed/chart)
- [RL exploration run: `num_steps_per_rollout=2`](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/1af53b5369cb4bd3a4bd355d4a727942/chart)
- [Main RL run used for checkpoint evaluation](https://swanlab.cn/@mousewu/agentic-noise-rl/v1/geh96f/runs/9c20fab4da0b44c3bb916e4711266bc0/chart)
- [Project source code](https://github.com/mousewu/slime-noise-rl)

> **Scope note:** These results use a project-specific ALFWorld text harness, fault injection, and evaluation protocol. They should not be interpreted as standard ALFWorld leaderboard results. The checkpoint comparison comes from one RL training seed; task-bootstrap confidence intervals do not replace replication across multiple training seeds.
