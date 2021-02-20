
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
    BSC_TESTNET :{
        COLLATERAL_TOKEN: process.env.REACT_APP_COLLATERAL_TOKEN_ADDRESS,
        PERPETUAL: process.env.REACT_APP_PERPETUAL_ADDRESS,
        AMM: process.env.REACT_APP_AMM_ADDRESS
    },
    KOVAN: {
        COLLATERAL_TOKEN: "0x11cd798554CFa738c7Aa199693E76c56F6eA221F", // Fake-BUSD
        PERPETUAL: "0x71d010EeFb6d629e9E7ad9e7650c17F97078AFa9",
        AMM: "0x4D97Bd8eFaCf46b33c4438Ed0B7B6AABfa2359FB"
    },
    LOCALHOST: {
        COLLATERAL_TOKEN: process.env.REACT_APP_COLLATERAL_TOKEN_ADDRESS,
        PERPETUAL: process.env.REACT_APP_PERPETUAL_ADDRESS,
        AMM: process.env.REACT_APP_AMM_ADDRESS
    }
}