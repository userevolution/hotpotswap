
export const NODE_URL = {
    BSC: "https://bsc-dataseed.binance.org/",
    KOVAN: "https://kovan.infura.io/v3/3aa2960d9ce549d6a539421c0a94fe52",
    LOCALHOST: "http://localhost:8545"
}

export const CONTRACTS = {
    BSC: {
        COLLATERAL_TOKEN: process.env.REACT_APP_COLLATERAL_TOKEN_ADDRESS,
        PERPETUAL: process.env.REACT_APP_PERPETUAL_ADDRESS,
        AMM: process.env.REACT_APP_AMM_ADDRESS
    },
    KOVAN: {
        COLLATERAL_TOKEN: process.env.REACT_APP_COLLATERAL_TOKEN_ADDRESS,
        PERPETUAL: process.env.REACT_APP_PERPETUAL_ADDRESS,
        AMM: process.env.REACT_APP_AMM_ADDRESS
    },
    LOCALHOST: {
        COLLATERAL_TOKEN: process.env.REACT_APP_COLLATERAL_TOKEN_ADDRESS,
        PERPETUAL: process.env.REACT_APP_PERPETUAL_ADDRESS,
        AMM: process.env.REACT_APP_AMM_ADDRESS
    }
}