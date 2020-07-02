---
layout: home
title: Home
landing-title: 俏也！好的！
description:
author:
menu: true
---

<!-- Banner -->
<section id="banner" class="major">
    <div class="inner">
    <header class="major">
      <h1>{{ page.landing-title }}</h1>
    </header>
    <div class="content">
      <p style="text-transform: uppercase;">{{ site.description }}</p>
      <ul class="actions">
        <li><a href="#one" class="button next scrolly">就这?我他妈就这</a></li>
      </ul>
    </div>
  </div>
</section>

<!-- Main -->
<div id="main">

<!-- One -->
{% include tiles.html %}

<!-- Two -->
<section id="two">
  <div class="inner">
    <header class="major">
      <h2>Open Source</h2>
    </header>
    <p>Like many of us, I strongly believe in Open Source and Free Software. It's
    also a very fun hobby of mine. You can have a look at the different projects
    I've released or I've contributed to</p>
    <ul class="actions">
      <li><a href="projects.html" class="button next">My Projects</a></li>
    </ul>
  </div>
</section>

</div>
