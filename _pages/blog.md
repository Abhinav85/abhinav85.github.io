---
title: "Blog"
description: "Engineering notes, system design write-ups, and backend learnings by Abhinav Rajput."
---
<header class="hero">
  <div>
    <h1>Blog</h1>
    <p class="lead">Notes on engineering, architecture, and systems.</p>
  </div>
</header>

<section class="panel">
  <div class="section-title">
    <h2>Posts</h2>
  </div>
  <ul class="simple-list">
    {% for post in site.posts %}
      <li>
        <a href="{{ post.url | relative_url }}">
          <strong>{{ post.title }}</strong> — {{ post.date | date: "%b %d, %Y" }}
        </a>
      </li>
    {% endfor %}
    {% if site.posts.size == 0 %}
      <li><strong>Coming soon</strong> — First post in progress.</li>
    {% endif %}
  </ul>
</section>
