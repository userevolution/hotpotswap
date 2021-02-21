"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");

const axios = require("axios")
const { ethers } = require("ethers");

const config = new pulumi.Config();

const PriceFeeder = require("./abi/priceFeeder.json")
const AMM = require("./abi/AMM.json")

const HDWalletProvider = require('@truffle/hdwallet-provider');

const privateKey = config.require("privateKey");
const traderMadeApiKey = config.require("traderMadeApiKey");
const bscTestnetAddress = config.require("bscTestnetAddress");
const bscTestnetRpcUrl = config.require("bscTestnetRpcUrl");
const kovanAddress = config.require("kovanAddress");
const kovanRpcUrl = config.require("kovanRpcUrl");


// Feeder bot, hardcoded for Dow Jones Index only
const feederBot = async (event) => {

    /*
            {
        "endpoint": "live", 
        "quotes": [
            {
            "ask": 31511.9, 
            "bid": 31507.7, 
            "instrument": "USA30", 
            "mid": 31509.80078
            }
        ], 
        "requested_time": "Sat, 20 Feb 2021 15:09:24 GMT", 
        "timestamp": 1613833764
        }
    */

    console.log("Feeder bot started")

    const { data } = await axios.get(`https://marketdata.tradermade.com/api/v1/live?currency=USA30&api_key=${traderMadeApiKey}`)

    if (data && data.quotes[0]) {
        const currentIndex = data.quotes[0].mid
        console.log("Current Dow Jones Index is : ", currentIndex)


        // update BSC testnet feeder contract
        try {

            console.log("Feeder contract addres on BSC Testnet : ", bscTestnetAddress)
            const bscTestnetProvider = new ethers.providers.Web3Provider(new HDWalletProvider(privateKey, bscTestnetRpcUrl));

            const priceFeederBscTestnetContract = new ethers.Contract(bscTestnetAddress, PriceFeeder.abi, bscTestnetProvider.getSigner());

            const tx3 = await priceFeederBscTestnetContract.updateValue(ethers.utils.parseEther(`${currentIndex}`))
            console.log("updating bscTestnet tx hash : ", tx3.hash)
            await tx3.wait()

            const tx4 = await priceFeederBscTestnetContract.confirmValueUpdate()
            console.log("confirming bscTestnet tx hash : ", tx4.hash)
            await tx4.wait()

            const ammBscTestnetContract = new ethers.Contract("0xda87577f9eb8B15B26C00619FD06d4485880310D", AMM.abi, bscTestnetProvider.getSigner());

            await ammBscTestnetContract.updateIndex({
                gasPrice: 20000000000
            })

        } catch (e) {
            console.log("Update index in BSC Testnet failed : ", e.message)
        }

        // Update value in Kovan
        try {

            console.log("Feeder contract addres on Kovan : ", kovanAddress)
            const kovanProvider = new ethers.providers.Web3Provider(new HDWalletProvider(privateKey, kovanRpcUrl));

            const priceFeederKovanContract = new ethers.Contract(kovanAddress, PriceFeeder.abi, kovanProvider.getSigner());

            const tx1 = await priceFeederKovanContract.updateValue(ethers.utils.parseEther(`${currentIndex}`))
            console.log("updating kovan tx hash : ", tx1.hash)
            await tx1.wait()

            const tx2 = await priceFeederKovanContract.confirmValueUpdate()
            console.log("confirming kovan tx hash : ", tx2.hash)
            await tx2.wait()

            const ammKovanContract = new ethers.Contract("0x4D97Bd8eFaCf46b33c4438Ed0B7B6AABfa2359FB", AMM.abi, kovanProvider.getSigner());

            await ammKovanContract.updateIndex({
                gasPrice: 20000000000
            })

        } catch (e) {
            console.log("Update index in Kovan failed : ", e.message)
        }

        
    }


    console.log("Feeder bot stopped")
}

const feederBotScheduler = new aws.cloudwatch.onSchedule(
    "feederBotScheduler",
    "rate(1 hour)",
    feederBot,
);