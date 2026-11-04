---
layout: default
title: Home
title_zh: 首页
description: Xianyue Wu works on language-model agents, reinforcement learning, and reliable AI systems.
description_zh: 吴先越专注于大模型智能体、强化学习与可靠 AI 系统研究。
---

<section class="hero shell">
  <div class="hero-copy">
    <p class="eyebrow"><span data-lang-text="en">AI research · engineering · open source</span><span data-lang-text="zh">AI 研究 · 工程 · 开源</span></p>
    <h1><span data-lang-text="en">Building reliable learning systems for language-model agents.</span><span data-lang-text="zh">构建可靠的大模型智能体学习系统。</span></h1>
    <p class="hero-lede"><span data-lang-text="en">I study how models learn to act through tools and environments—especially the training loops, harnesses, and evaluation protocols that make agent behavior measurable and reproducible.</span><span data-lang-text="zh">我研究模型如何通过工具和环境学习行动，尤其关注让智能体行为可测量、可复现的训练循环、harness 与评测协议。</span></p>
    <div class="hero-actions">
      <a class="button primary" href="/writing/"><span data-lang-text="en">Read the technical notes</span><span data-lang-text="zh">阅读技术文章</span></a>
      <a class="button secondary" href="https://github.com/mousewu/slime-noise-rl"><span data-lang-text="en">Explore the code</span><span data-lang-text="zh">查看项目代码</span></a>
    </div>
  </div>
  <aside class="signal-card" aria-label="Current research focus">
    <p class="signal-label"><span data-lang-text="en">Current focus</span><span data-lang-text="zh">当前研究方向</span></p>
    <ol class="signal-list">
      <li><span>01</span><span data-lang-text="en">Agentic reinforcement learning</span><span data-lang-text="zh">智能体强化学习</span></li>
      <li><span>02</span><span data-lang-text="en">Robust environment harnesses</span><span data-lang-text="zh">鲁棒的环境 Harness</span></li>
      <li><span>03</span><span data-lang-text="en">Training and evaluation systems</span><span data-lang-text="zh">训练与评测系统</span></li>
    </ol>
    <div class="signal-footer">
      <span class="pulse" aria-hidden="true"></span>
      <span data-lang-text="en">Experiments in progress</span><span data-lang-text="zh">实验进行中</span>
    </div>
  </aside>
</section>

<section class="section shell" aria-labelledby="selected-work">
  <div class="section-heading">
    <p class="eyebrow"><span data-lang-text="en">Selected work</span><span data-lang-text="zh">代表项目</span></p>
    <h2 id="selected-work"><span data-lang-text="en">Research built from the full stack.</span><span data-lang-text="zh">贯穿完整技术栈的研究。</span></h2>
  </div>
  <div class="project-grid">
    <article class="project-card featured">
      <div>
        <p class="card-kicker"><span data-lang-text="en">Open-source research system</span><span data-lang-text="zh">开源研究系统</span></p>
        <h3>Slime Noise RL</h3>
        <p><span data-lang-text="en">An experimental stack for studying robust agentic RL across ALFWorld and Agent World Model environments, with asynchronous rollout, environment diagnostics, and SwanLab observability.</span><span data-lang-text="zh">用于研究鲁棒智能体强化学习的实验栈，覆盖 ALFWorld 与 Agent World Model 环境，支持异步 rollout、环境诊断与 SwanLab 可观测性。</span></p>
      </div>
      <div class="tag-row" aria-label="Project topics">
        <span>Qwen3-4B</span><span>Slime</span><span>Agentic RL</span>
      </div>
      <a class="text-link" href="https://github.com/mousewu/slime-noise-rl"><span data-lang-text="en">View repository</span><span data-lang-text="zh">查看代码仓库</span></a>
    </article>
    <div class="metric-stack" aria-label="Selected experiment results">
      <div class="metric-card">
        <strong>91.4%</strong>
        <span><span data-lang-text="en">Matched-noise success across three seeds</span><span data-lang-text="zh">三随机种子下的匹配噪声成功率</span></span>
      </div>
      <div class="metric-card">
        <strong>32,160</strong>
        <span><span data-lang-text="en">RL evaluation episodes</span><span data-lang-text="zh">RL 独立评测轨迹</span></span>
      </div>
    </div>
  </div>
</section>

<section class="section writing-band" aria-labelledby="latest-writing">
  <div class="shell">
    <div class="section-heading split-heading">
      <div>
        <p class="eyebrow"><span data-lang-text="en">Technical blog</span><span data-lang-text="zh">技术博客</span></p>
        <h2 id="latest-writing"><span data-lang-text="en">Latest writing</span><span data-lang-text="zh">最新文章</span></h2>
      </div>
      <a class="text-link" href="/writing/"><span data-lang-text="en">All posts</span><span data-lang-text="zh">全部文章</span></a>
    </div>
    {% for post in site.posts limit:1 %}
    <article class="post-preview">
      <div class="post-preview-meta">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %-d, %Y' }}</time>
        <span>Agentic RL</span>
      </div>
      <div>
        <h3><a href="{{ post.url | relative_url }}"><span data-lang-text="en">{{ post.title }}</span><span data-lang-text="zh">{{ post.title_zh | default: post.title }}</span></a></h3>
        <p><span data-lang-text="en">{{ post.description }}</span><span data-lang-text="zh">{{ post.description_zh | default: post.description }}</span></p>
      </div>
      <a class="post-arrow" href="{{ post.url | relative_url }}" aria-label="Read {{ post.title }}"><span data-lang-text="en">Read</span><span data-lang-text="zh">阅读</span></a>
    </article>
    {% endfor %}
  </div>
</section>

