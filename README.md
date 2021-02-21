# HotpotSwap

![slide](hotpotswap-poster.png)

This monorepo contains all Solidity smart contracts, apps and services for the HotpotSwap platform which allows trade stock market indices in the form of crytocurrency synthetic assets via perpetual swap contracts. 

The project is under heavy development and currently live on BSC Testnet and Kovan network only, check out at: [https://hotpotswap.fi](https://hotpotswap.fi)

## Motivation

We've seen stock market indices such as Nasdaq, S&P 500, Dow Jones,... on every business news much more than crypto prices. Why can't we trade against them?

## Overview

We formulate this idea during Binance Virtual Hackathon 2021 and evaluate a number of perpetual contract project from MCDEX v2, Perpetual protocol to UMA protocol. Eventually, we brought core logic mostly from MCDEX v2 protocol to implement this project that applying continuous funding rate and AMM to perpetual contracts.

### What does it currently do

* Trader can short and long Dow Jones Index with BUSD and he/she will need to maintain the position above liquidation ratio.
* Funding rate occurs when the trader execute the order or either been triggered by the price feeder bot that runs every hour.
* Stock market indices are observed by internal oracle that fetch the data from Tradermade API.
* Liqudation provider can help balance AMM towards the mark price by selling LP tokens and get some profit.

### Road to BSC Mainnet

The main lesson learned from the early version of this project are:

* Using AMM is costly and difficult to control the slippage rate, the problem will be worst when multiple pools are launched.
* Involved with complex math calculation that our team are not effectively capable with.

In order to overcome above statements, we're planning to do major improvement works to smart contrat side with following:
* Replace AMM with off-chain order books.
* Replace on-chain funding rate mechanism with off-chain approach.
* All off-chain facilities are going to managed by project team members at the beginning and the set of validators in the future.
* Seperate UI for trader and liquidity provider.

We strive to provide the hybird perpetual contract solution rather than fully decentralized as we're more expert at scaling cloud infrastructure to serve a huge number of users that would have better UX for all.

## How it works

## How to use


## Install


## Smart Contracts


## Development

### Test

## License

* Open-source [MIT](LICENSE)












