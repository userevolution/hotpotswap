import React, { useEffect, useMemo, useReducer, createContext, useState, useCallback } from 'react';
import { Web3ReactProvider, useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { ethers } from "ethers";
import { useERC20 } from "./useERC20"
import { usePerpetual } from "./usePerpetual"
import { CONTRACTS } from "../constants"

export const ContractsContext = createContext({});

const Provider = ({ children }) => {

    const context = useWeb3React()
    const { chainId, account, active, error, library } = context

    const [tick, setTick] = useState(0)

    const collateralToken = useERC20(chainId, account, library, tick)

    // Only DJI
    let perpetualAddress
    let ammAddress

    switch (chainId) {

        case 1337:
            perpetualAddress = CONTRACTS?.LOCALHOST?.PERPETUAL
            ammAddress = CONTRACTS?.LOCALHOST?.AMM
            break;
        case 56:
            perpetualAddress = CONTRACTS?.BSC?.PERPETUAL
            ammAddress = CONTRACTS?.BSC?.AMM
            break
        case 42:
            perpetualAddress = CONTRACTS?.KOVAN?.PERPETUAL
            ammAddress = CONTRACTS?.KOVAN?.AMM
            break
        case 97:
            perpetualAddress = CONTRACTS?.BSC_TESTNET?.PERPETUAL
            ammAddress = CONTRACTS?.BSC_TESTNET?.AMM
            break
    }

    const increaseTick = useCallback(() => {
        setTick(tick+1)
    }, [tick])

    const djiPerpetual = usePerpetual(perpetualAddress, ammAddress, account, library, tick)

    const contractsContext = useMemo(
        () => ({
            collateralToken,
            djiPerpetual,
            increaseTick
        }),
        [collateralToken, djiPerpetual, increaseTick]
    );

    return (
        <ContractsContext.Provider value={contractsContext}>
            {children}
        </ContractsContext.Provider>
    )
}

export default Provider
