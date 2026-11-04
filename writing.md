---
layout: default
title: Writing
title_zh: 文章
description: Technical writing by Xianyue Wu on agentic reinforcement learning and reliable AI systems.
description_zh: 吴先越关于智能体强化学习与可靠 AI 系统的技术文章。
permalink: /writing/
---

<section class="page-intro shell">
  <p class="eyebrow"><span data-lang-text="en">Technical blog</span><span data-lang-text="zh">技术博客</span></p>
  <h1><span data-lang-text="en">Research notes, with the failures left in.</span><span data-lang-text="zh">保留失败过程的研究笔记。</span></h1>
  <p><span data-lang-text="en">Long-form write-ups on model training, environment design, systems bottlenecks, and the experiments that changed my mind.</span><span data-lang-text="zh">记录模型训练、环境设计、系统瓶颈，以及那些改变我判断的实验。</span></p>
</section>

<section class="shell post-list" aria-label="Blog posts">
  {% for post in site.posts %}
  <article class="post-list-item">
    <div class="post-list-date">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%Y.%m.%d' }}</time>
    </div>
    <div>
      <p class="card-kicker"><span data-lang-text="en">Agentic RL · Experiment report</span><span data-lang-text="zh">智能体 RL · 实验报告</span></p>
      <h2><a href="{{ post.url | relative_url }}"><span data-lang-text="en">{{ post.title }}</span><span data-lang-text="zh">{{ post.title_zh | default: post.title }}</span></a></h2>
      <p><span data-lang-text="en">{{ post.description }}</span><span data-lang-text="zh">{{ post.description_zh | default: post.description }}</span></p>
      <a class="text-link" href="{{ post.url | relative_url }}"><span data-lang-text="en">Read article</span><span data-lang-text="zh">阅读文章</span></a>
    </div>
  </article>
  {% else %}
  <p><span data-lang-text="en">No posts yet.</span><span data-lang-text="zh">暂无文章。</span></p>
  {% endfor %}
</section>

