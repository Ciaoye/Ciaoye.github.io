---
layout: post
title: Chef Server on Scaleway
description: Chef goodness on a tiny ARM box
image:  assets/images/5.gif
---


Somewhere like a year ago (?), friends of mine working at the awesome
[Online.net](www.online.net) hosting company told me they were working
on a new and weird concept: an ARM-based Bare metal _cloud like_ service.
This shit is now [live and available](scaleway.com) for your to play with.

I thought it was the perfect occasion for me to move my personal
infrastructre (dns, mail, hosting, ...) out of my old dedicated box to
a more modern and exciting stack: A swarm of cheap ARM boxes !

Chef was a no-brainer for me, considering my previous experience at
Facebook. I decided to try to run a chef-server on one of the Scaleway
C1 boxes. Sadly, arm isn't supported by Chef Inc and wasn't working at
all.  So I had to make it build and shrink the beast to make it fit on
that tiny box.

The good thing, is that I've made the chef-server build on ARM and
contributed this work upstream. Here I'll now detail how to deploy
the chef server on the Scaleway C1 box. This setup is very likely to
work as well for the Raspberry Pi (give or take additional tuning).

<div class='box'> <strong>Why care about ARM boxes?</strong>
  Hum... mostly because it's fun! It was also about spreading the chef
  goodness. I'm also sure people will have fun on Raspberry Pi with this :)
</div>

## Building your own ARM chef-server

### Create a server

The first thing you'll want to do is create an account if you don't
have one :), then login to the console and click the [Create Server](https://cloud.scaleway.com/#/zones/par1/servers/new) button.

- Pick a nice name like `chef-server`
- Select the `C1` server type.
- Pick a recent `Debian` or `Ubuntu` server. Mine runs on Ubuntu Xenial (16.04 LTS)
- Be sure to allocate a public IP, for you host to be reachable by `knife`

### Install the chef-server package

Once you created your server, wait for it to be started and ready,
then login as `root`.

The first thing to do is do get the debian package for the
chef-server. I'll cover the build process on a separate post, but
right now we'll just grab my own build: `https://github.com/elthariel/chef-server/releases/download/v12.5.0-arm-alpha/chef-server-core_12.9.1.20161020161349-1_armhf.deb`

I'm likely to publish new builds over time, and they'll be available on
[the release page of my fork](https://github.com/elthariel/chef-server/releases).

``` shellsession
root@chef-server> wget https://github.com/elthariel/chef-server/releases/download/v12.5.0-arm-alpha/chef-server-core_12.9.1.20161020161349-1_armhf.deb
[...]
root@chef-server> dpkg -i chef-server-core_12.9.1.20161020161349-1_armhf.deb
[... takes forever ... tiny box ...]
```

The chef server has been installed into `/opt/opscode` but is not
running yet. We'll have to tune it a little and launch the
`reconfigure` command.

### Configuration

The C1 box has only 2GB of memory, so we need to reduce it's memory
usage. Also, it has limited processing power, which causes the keygen
daemon to timeout, forking more and more openssl instances and
smashing the machine. This should be addressed in the chef-server
configuration *before* calling `reconfigure`. This file should be
place on the server at this path: `/etc/opscode/chef-server.rb`.

Here's a working configuration for the C1 box:

``` ruby
# My /etc/opscode/chef-server.rb

# Very important, allow the reconfigure to succeed
opscode_erchef['keygen_cache_workers'] = 1
opscode_erchef['keygen_timeout'] = 30000

# Tune to your taste, but keep a low profile
opscode_expander['nodes'] = 3
opscode_solr4['heap_size'] = 256
postgresql['shared_buffers'] = '256MB'
postgresql['shmall'] = 2097152
postgresql['shmmax'] = 4294967295
```


### Starting it

Be sure you've created the `/etc/opscode/chef-server.rb` file on your
server and kept the keygen configuration.

Now you're ready to configure the server. Here we go:

``` shellsession
root@chef-server> chef-server-ctl reconfigure
[This is going to take between 1-2 hours !]
```

[One nice guy from Chef Inc](https://github.com/chef/chef-server/pull/985#issuecomment-256942327),
pointed out that we can reduce the time it takes by generating the
certificates and the dhparams beforehand, uploading them to the box
and feeding them to chef. I haven't tried it yet, but I guess you'd have to upload them somewhere and add those lines to the `chef-server.rb` file:

``` ruby
nginx['ssl_certificate'] = '/path/to/cert'
nginx['ssl_certificate_key'] = '/path/to/key'
nginx['ssl_dhparam'] = '/path/to/dhparams'
```

### Good to go

After the `chef-server-ctl reconfigure` has finished (and if there
wasn't any fatal error on the way) you can resume setting up your
chef-server normally.

That would include:

``` shellsession
root@chef-server> chef-server-ctl user-create my_user My USER email@email.fr 'password' --filename ~/my_user.pem
[...]
root@chef-server> chef-server-ctl org-create my_org 'My organisation' --association_user my_user --filename my_org-validator.pem
[...]
```

Then you'll be able to grab the generated users and keys and feed them
to `knife` on your development box.


I hope you'll have a lot of fun managing your swarm of ARM box with chef :)
