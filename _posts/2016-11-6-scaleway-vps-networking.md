---
layout: post
title: Benchmarking Scaleway's internal bandwidth
description: Just a quick benchmark with iperf
image: assets/images/test2.gif
---

While I was having fun planning a few personal deployments on
Scaleway's infrastructure, I wondered what was the internal bandwidth
allocated to the VPS. They provide those numbers for the bare metal
instances but I haven't been able to find anything about the VPS.

I ran a few benchmarks with the `iperf` tool to get a rough idea. I'm
testing with a C1, two C2S, a VC1S and a VC1M.

Let's point out that those are quick and dirty benchmarks, that I'm no
networking expert, that I haven't paid attention to actual server
location in the DC and that I know nothing about their network topology.

## C2S <-> C1

Server is on the `C2S`.

### 10s test

``` shellsession
# iperf3 -c 10.1.177.79 -i 0 -t 10 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-10.00  sec  3.26 MBytes  2.73 Mbits/sec    0             sender
[  4]   0.00-10.00  sec  3.03 MBytes  2.54 Mbits/sec                  receiver
[  6]   0.00-10.00  sec  3.19 MBytes  2.68 Mbits/sec    0             sender
[  6]   0.00-10.00  sec  2.93 MBytes  2.46 Mbits/sec                  receiver
[  8]   0.00-10.00  sec  2.92 MBytes  2.45 Mbits/sec    0             sender
[  8]   0.00-10.00  sec  2.67 MBytes  2.24 Mbits/sec                  receiver
[ 10]   0.00-10.00  sec  1.09 GBytes   932 Mbits/sec    0             sender
[ 10]   0.00-10.00  sec  1.08 GBytes   931 Mbits/sec                  receiver
[SUM]   0.00-10.00  sec  1.09 GBytes   940 Mbits/sec    0             sender
[SUM]   0.00-10.00  sec  1.09 GBytes   938 Mbits/sec                  receiver
```

### 60s test

```shellsession
# iperf3 -c 10.1.177.79 -i 0 -t 60 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-60.00  sec   608 MBytes  85.1 Mbits/sec  16956             sender
[  4]   0.00-60.00  sec   608 MBytes  85.0 Mbits/sec                  receiver
[  6]   0.00-60.00  sec  3.12 GBytes   447 Mbits/sec  21754             sender
[  6]   0.00-60.00  sec  3.12 GBytes   447 Mbits/sec                  receiver
[  8]   0.00-60.00  sec   628 MBytes  87.8 Mbits/sec  17429             sender
[  8]   0.00-60.00  sec   627 MBytes  87.6 Mbits/sec                  receiver
[ 10]   0.00-60.00  sec   640 MBytes  89.4 Mbits/sec  17473             sender
[ 10]   0.00-60.00  sec   639 MBytes  89.3 Mbits/sec                  receiver
[SUM]   0.00-60.00  sec  4.96 GBytes   709 Mbits/sec  73612             sender
[SUM]   0.00-60.00  sec  4.95 GBytes   709 Mbits/sec                  receiver
```

## C2S <-> VC1S

Server is on the `C2S`.

### 10s test

``` shellsession
# iperf3 -c 10.1.177.79 -i 0 -t 10 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-10.00  sec   236 MBytes   198 Mbits/sec  13850             sender
[  4]   0.00-10.00  sec   232 MBytes   195 Mbits/sec                  receiver
[  6]   0.00-10.00  sec   272 MBytes   228 Mbits/sec  19402             sender
[  6]   0.00-10.00  sec   269 MBytes   226 Mbits/sec                  receiver
[  8]   0.00-10.00  sec   282 MBytes   236 Mbits/sec  19631             sender
[  8]   0.00-10.00  sec   278 MBytes   234 Mbits/sec                  receiver
[ 10]   0.00-10.00  sec   245 MBytes   206 Mbits/sec  13561             sender
[ 10]   0.00-10.00  sec   242 MBytes   203 Mbits/sec                  receiver
[SUM]   0.00-10.00  sec  1.01 GBytes   868 Mbits/sec  66444             sender
[SUM]   0.00-10.00  sec  1021 MBytes   857 Mbits/sec                  receiver
```

### 60s test

``` shellsession
# iperf3 -c 10.1.177.79 -i 0 -t 60 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-60.00  sec  1.08 GBytes   155 Mbits/sec  73971             sender
[  4]   0.00-60.00  sec  1.08 GBytes   154 Mbits/sec                  receiver
[  6]   0.00-60.00  sec  1.06 GBytes   152 Mbits/sec  80689             sender
[  6]   0.00-60.00  sec  1.06 GBytes   151 Mbits/sec                  receiver
[  8]   0.00-60.00  sec  1.13 GBytes   161 Mbits/sec  78828             sender
[  8]   0.00-60.00  sec  1.12 GBytes   161 Mbits/sec                  receiver
[ 10]   0.00-60.00  sec  1.21 GBytes   173 Mbits/sec  76258             sender
[ 10]   0.00-60.00  sec  1.21 GBytes   173 Mbits/sec                  receiver
[SUM]   0.00-60.00  sec  4.48 GBytes   641 Mbits/sec  309746             sender
[SUM]   0.00-60.00  sec  4.47 GBytes   639 Mbits/sec                  receiver
```

## C2S <-> VC1M

Server is on the `C2S`.

### 10s test

``` shellsession
# iperf3 -c 10.1.177.79 -i 0 -t 10 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-10.00  sec   293 MBytes   246 Mbits/sec  15119             sender
[  4]   0.00-10.00  sec   290 MBytes   243 Mbits/sec                  receiver
[  6]   0.00-10.00  sec   210 MBytes   176 Mbits/sec  15404             sender
[  6]   0.00-10.00  sec   206 MBytes   173 Mbits/sec                  receiver
[  8]   0.00-10.00  sec   221 MBytes   186 Mbits/sec  15135             sender
[  8]   0.00-10.00  sec   218 MBytes   183 Mbits/sec                  receiver
[ 10]   0.00-10.00  sec   310 MBytes   260 Mbits/sec  18411             sender
[ 10]   0.00-10.00  sec   306 MBytes   257 Mbits/sec                  receiver
[SUM]   0.00-10.00  sec  1.01 GBytes   867 Mbits/sec  64069             sender
[SUM]   0.00-10.00  sec  1020 MBytes   856 Mbits/sec                  receiver

```

### 60s test

``` shellsession
# iperf3 -c 10.1.177.79 -i 0 -t 60 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-60.00  sec  1.18 GBytes   168 Mbits/sec  96255             sender
[  4]   0.00-60.00  sec  1.17 GBytes   168 Mbits/sec                  receiver
[  6]   0.00-60.00  sec  1.19 GBytes   171 Mbits/sec  89608             sender
[  6]   0.00-60.00  sec  1.19 GBytes   170 Mbits/sec                  receiver
[  8]   0.00-60.00  sec  1.06 GBytes   152 Mbits/sec  84641             sender
[  8]   0.00-60.00  sec  1.06 GBytes   152 Mbits/sec                  receiver
[ 10]   0.00-60.00  sec  1.05 GBytes   150 Mbits/sec  89153             sender
[ 10]   0.00-60.00  sec  1.04 GBytes   149 Mbits/sec                  receiver
[SUM]   0.00-60.00  sec  4.48 GBytes   641 Mbits/sec  359657             sender
[SUM]   0.00-60.00  sec  4.46 GBytes   639 Mbits/sec                  receiver
```

## C2S <-> C2S

### 10s test

``` shellsession
iperf3 -c 10.1.177.79 -i 0 -t 10 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-10.00  sec   468 MBytes   393 Mbits/sec    0             sender
[  4]   0.00-10.00  sec   468 MBytes   392 Mbits/sec                  receiver
[  6]   0.00-10.00  sec   936 MBytes   785 Mbits/sec    2             sender
[  6]   0.00-10.00  sec   935 MBytes   785 Mbits/sec                  receiver
[  8]   0.00-10.00  sec   468 MBytes   393 Mbits/sec    0             sender
[  8]   0.00-10.00  sec   468 MBytes   392 Mbits/sec                  receiver
[ 10]   0.00-10.00  sec   936 MBytes   785 Mbits/sec    1             sender
[ 10]   0.00-10.00  sec   935 MBytes   785 Mbits/sec                  receiver
[SUM]   0.00-10.00  sec  2.74 GBytes  2.36 Gbits/sec    3             sender
[SUM]   0.00-10.00  sec  2.74 GBytes  2.35 Gbits/sec                  receiver

```

### 60s test

``` shellsession
# iperf3 -c 10.1.177.79 -i 0 -t 10 -P 4
Connecting to host 10.1.177.79, port 5201
[ ID] Interval           Transfer     Bandwidth       Retr
[  4]   0.00-10.00  sec   468 MBytes   393 Mbits/sec    0             sender
[  4]   0.00-10.00  sec   468 MBytes   392 Mbits/sec                  receiver
[  6]   0.00-10.00  sec   936 MBytes   785 Mbits/sec    2             sender
[  6]   0.00-10.00  sec   935 MBytes   785 Mbits/sec                  receiver
[  8]   0.00-10.00  sec   468 MBytes   393 Mbits/sec    0             sender
[  8]   0.00-10.00  sec   468 MBytes   392 Mbits/sec                  receiver
[ 10]   0.00-10.00  sec   936 MBytes   785 Mbits/sec    1             sender
[ 10]   0.00-10.00  sec   935 MBytes   785 Mbits/sec                  receiver
[SUM]   0.00-10.00  sec  2.74 GBytes  2.36 Gbits/sec    3             sender
[SUM]   0.00-10.00  sec  2.74 GBytes  2.35 Gbits/sec                  receiver
```

At least a benchmark with expected results :)

## Conclusion

So, it seems there's some burst mechanism in place for C1 and VPS,
allowing you to access the claimed bandwidth for a few seconds, then
throttling you to around 600Mbits/s.

On the VPS, the birst time is about 1-2 seconds. Let's add that the
network card seems shared with other users on the same physical server
(Yeah, kinda logical). So your actual interal bandwidth can vary and
drop below the 600Mbits/s depending on the servermates usage.

On the C1, the burst time is around 20s, which seems reasonnable for a
lot of use cases.

On the C2S, I haven't been able to notice such a burst time limit, but
I haven't been patient enough to test it for more than a minute.

Finally, I've mixed feeling about this issue. I'm kinda disappointed
about this burst thing on VPS/C1, but on the other hand, it's still a
great value for 2 euros per month :D
