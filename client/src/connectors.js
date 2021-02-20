import { InjectedConnector } from '@web3-react/injected-connector'

export const injected = new InjectedConnector({ supportedChainIds: [1337, 97, 42] })
// export const injected = new InjectedConnector()