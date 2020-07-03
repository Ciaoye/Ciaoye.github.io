---
layout: post
title: Scaleway metadata in Chef
description: Ohai's magic
image:  assets/images/4.png
---

Do you want to generate DNS records for all your running nodes ? Do
you need to know the public ip address of your node to generate
config ? What is the node IPv6 configuration ?

The [ohai-scaleway](https://github.com/elthariel/ohai-scaleway)
cookbook ships an Ohai plugin that will allow you to answer easily to
all those questions and more from within your chef recipes.

## Getting the cookbook

The easier way to get the cookbook is to add it to your Berksfile:

``` ruby
cookbook 'ohai-scaleway', '~> 0.1.0'
```

and then run `berks && berks upload` to fetch the cookbook and upload
it to your server.

## Using it from your recipe

``` ruby
# metadata.rb

depends 'ohai-scaleway'

# recipes/default.rb

include 'ohai-scaleway'

# Get the node current public IPv4
public_ip = node['scw']['public_ip_address']

# Grab all the scaleway nodes with a public_ip
public_nodes = search(:node, 'scw:public_ip_address')
```

## Getting the plugin into your ohai.plugin_path

The plugin is installed into `/etc/chef/ohai/plugins`, which is the
default plugin install path but which is not included in the default
plugin path (_Huh?_)

To solve this problem, you can either use the `chef_client` cookbook
to manage your client configuration, change your bootstrap options or
edit the file by hand.

If you're using the `chef_client` cookbook to manage your
configuration, you just need to add this line:

``` ruby
node.default[:ohai][:plugin_path] = node[:chef_client][:conf_dir] + '/ohai/plugins'
```
