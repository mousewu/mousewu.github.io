---
layout: default
title: Writing
description: Technical writing by Xianyue Wu on agentic reinforcement learning and reliable AI systems.
permalink: /writing/
---

<section class="page-intro shell">
  <p class="eyebrow">Technical blog</p>
  <h1>Research notes, with the failures left in.</h1>
  <p>Long-form write-ups on model training, environment design, systems bottlenecks, and the experiments that changed my mind.</p>
</section>

<section class="shell post-list" aria-label="Blog posts">
  {% for post in site.posts %}
  <article class="post-list-item">
    <div class="post-list-date">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%Y.%m.%d' }}</time>
    </div>
    <div>
      <p class="card-kicker">Agentic RL · Experiment report</p>
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p>{{ post.description }}</p>
      <a class="text-link" href="{{ post.url | relative_url }}">Read article</a>
    </div>
  </article>
  {% else %}
  <p>No posts yet.</p>
  {% endfor %}
</section>

