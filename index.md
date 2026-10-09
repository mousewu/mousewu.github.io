---
layout: default
title: Home
description: Xianyue Wu works on language-model agents, reinforcement learning, and reliable AI systems.
---

<section class="hero shell">
  <div class="hero-copy">
    <p class="eyebrow">AI research · engineering · open source</p>
    <h1>Building reliable learning systems for language-model agents.</h1>
    <p class="hero-lede">I study how models learn to act through tools and environments—especially the training loops, harnesses, and evaluation protocols that make agent behavior measurable and reproducible.</p>
    <div class="hero-actions">
      <a class="button primary" href="/writing/">Read the technical notes</a>
      <a class="button secondary" href="https://github.com/mousewu/slime-noise-rl">Explore the code</a>
    </div>
  </div>
  <aside class="signal-card" aria-label="Current research focus">
    <p class="signal-label">Current focus</p>
    <ol class="signal-list">
      <li><span>01</span> Agentic reinforcement learning</li>
      <li><span>02</span> Robust environment harnesses</li>
      <li><span>03</span> Training and evaluation systems</li>
    </ol>
    <div class="signal-footer">
      <span class="pulse" aria-hidden="true"></span>
      Experiments in progress
    </div>
  </aside>
</section>

<section class="section shell" aria-labelledby="selected-work">
  <div class="section-heading">
    <p class="eyebrow">Selected work</p>
    <h2 id="selected-work">Research built from the full stack.</h2>
  </div>
  <div class="project-grid">
    <article class="project-card featured">
      <div>
        <p class="card-kicker">Open-source research system</p>
        <h3>Slime Noise RL</h3>
        <p>An experimental stack for studying robust agentic RL across ALFWorld and Agent World Model environments, with asynchronous rollout, environment diagnostics, and SwanLab observability.</p>
      </div>
      <div class="tag-row" aria-label="Project topics">
        <span>Qwen3-4B</span><span>Slime</span><span>Agentic RL</span>
      </div>
      <a class="text-link" href="https://github.com/mousewu/slime-noise-rl">View repository</a>
    </article>
    <div class="metric-stack" aria-label="Selected experiment results">
      <div class="metric-card">
        <strong>98.7%</strong>
        <span>Noisy held-out success after RL</span>
      </div>
      <div class="metric-card">
        <strong>−58%</strong>
        <span>Tool calls versus the SFT policy</span>
      </div>
    </div>
  </div>
</section>

<section class="section writing-band" aria-labelledby="latest-writing">
  <div class="shell">
    <div class="section-heading split-heading">
      <div>
        <p class="eyebrow">Technical blog</p>
        <h2 id="latest-writing">Latest writing</h2>
      </div>
      <a class="text-link" href="/writing/">All posts</a>
    </div>
    {% for post in site.posts limit:1 %}
    <article class="post-preview">
      <div class="post-preview-meta">
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%b %-d, %Y' }}</time>
        <span>Agentic RL</span>
      </div>
      <div>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p>{{ post.description }}</p>
      </div>
      <a class="post-arrow" href="{{ post.url | relative_url }}" aria-label="Read {{ post.title }}">Read</a>
    </article>
    {% endfor %}
  </div>
</section>

