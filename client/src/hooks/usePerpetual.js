import { useMemo, useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import Perpetual from "../abi/Perpetual.json"
import AMM from "../abi/AMM.json"

export const usePerpetual = (perpetualAddress, ammAddress, account, library, tick) => {


    const { perpetualContract, ammContract } = useMemo(() => {
        if (!account || !perpetualAddress || !ammAddress || !library) {
            return {
                perpetualContract: null,
                ammContract: null
            }
        }

        return {
            perpetualContract: new ethers.Contract(perpetualAddress, Perpetual.abi, library.getSigner()),
            ammContract: new ethers.Contract(ammAddress, AMM.abi, library.getSigner())
        }

    }, [account, perpetualAddress, ammAddress, library])

    const [indexPrice, setIndexPrice] = useState("--")
    const [markPrice, setMarkPrice] = useState("--")
    const [availableMargin, setAvailableMargin] = useState("--")
    const [status, setStatus] = useState("--")
    const [accumulatedFunding, setAccumulatedFunding ] = useState("--")
    const [myDeposit, setMyDeposit ] = useState("0")

    const getStatus = useCallback(
        async () => {
            try {
                const result = await perpetualContract.status()
                switch (result) {
                    case 0:
                        return "Active"
                    case 1:
                        return "Emergency"
                    case 2:
                        return "Settlement"
                    default:
                        return "Unknown"
                }
            } catch (e) {
                return "Error"
            }
        },

        [perpetualContract, account]
    );

    const getIndexPrice = useCallback(
        async () => {
            try {
                const result = await ammContract.indexPrice()
                return ethers.utils.formatEther(result.price)
            } catch (e) {
                return "0"
            }
        },

        [ammContract, account]
    );

    const getAccumulatedFunding = useCallback(
        async () => {
            try {
                const result = await ammContract.getAccumulatedFundingPerContract()
                return ethers.utils.formatEther(result)
            } catch (e) {
                return "0"
            }
        },

        [ammContract, account]
    );

    const getAvailableMargin = useCallback(
        async () => {
            try {
                const result = await ammContract.getAvailableMargin()
                return ethers.utils.formatEther(result)
            } catch (e) {
                return "0"
            }
        },

        [ammContract, account]
    );

    const getMarkPrice = useCallback(
        async () => {
            try {
                const output = await ammContract.getMarkPrice()
                return ethers.utils.formatEther(output)
            } catch (e) {
                return "0"
            }
        },

        [ammContract, account]
    );

    const deposit =  useCallback(
        async (amount) => {
            return await perpetualContract.deposit(
                ethers.utils.parseEther(amount)
            )
        },
        [perpetualContract, account]
    );

    const withdraw = useCallback(
        async (amount) => {
            // TODO : increase gas price
            return await perpetualContract.withdraw(
                ethers.utils.parseEther(amount)
            )
        },
        [perpetualContract, account]
    );

    const getDeposit = useCallback( async () => {
        const result = await perpetualContract.totalRawCollateral(account)
        return ethers.utils.formatEther(result)
    },[account])

    useEffect(() => {

        ammContract && getIndexPrice().then(setIndexPrice)
        ammContract && getMarkPrice().then(setMarkPrice)
        ammContract && getAvailableMargin().then(setAvailableMargin)
        ammContract && getAccumulatedFunding().then(setAccumulatedFunding)
        perpetualContract && getStatus().then(setStatus)
        perpetualContract && getDeposit().then(setMyDeposit)

    }, [account, ammContract, perpetualContract, tick])

    return {
        perpetualAddress,
        ammAddress,
        indexPrice,
        markPrice,
        status,
        availableMargin,
        accumulatedFunding,
        deposit,
        withdraw,
        myDeposit
    }

}
