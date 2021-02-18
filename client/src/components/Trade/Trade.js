import React, { useState, useCallback, useContext } from 'react';
import styled from "styled-components"
import { Alert, Container, Jumbotron, Row, Col, Button, InputGroup, InputGroupAddon, InputGroupText, Input } from "reactstrap"
import TradingViewWidget from 'react-tradingview-widget';
import Position from "./Position"
import LiquidityPanel from "./LiquidityPanel"
import TradePanel from "./TradePanel"
import { ContractsContext } from "../../hooks/useContracts"
import { Slider } from "../common"
const Wrapper = styled.div` 

    h2 {
        font-size: 24px;
        margin-top: 20px;
        margin-bottom: 20px;
        select {
            margin-left: 20px;
            font-size: 14px;
        }
    }

`

const StyledCol = styled(Col)`

`

const Card = styled.div`
    border: 1px solid black;
    padding: 10px; 
`

const TradingViewContainer = styled.div`
    height: 400px;
`

const Tab = styled.div`
    overflow: hidden;
    border: 1px solid black;
    background-color: #f1f1f1;  
`

const TabItem = styled.div`
    background-color: inherit;
    float: left;
    border: none;
    outline: none;
    cursor: pointer;
    padding: 14px 16px;
    transition: 0.3s;
    color: inherit; 

    ${props => props.active ? `
        background-color: black;
        color: white;
        :hover {
            color: white;
        }
        
    ` : `
        :hover {
            background-color: #ddd; 
            color: inherit;
        }
    `}

`

const TabContent = styled.div`
     
    padding: 6px 12px;
    border: 1px solid black;
    border-top: none; 
    background: white;
`

const Stats = styled(Row)`
    margin-top: 20px;
    margin-bottom: 20px;
`

const StatItem = styled(Col).attrs(props => ({
    xs: props.xs ? props.xs : "2"
}))`
    
    h4 {
        margin: 0px;
        font-size: 16px;
    }
    p {
        margin: 0px;
    }

`

// Hard-coded everything to DJI

const Trade = () => {

    const [panel, setPanel] = useState(0) // 0 - Trade , 1 - Liquidity

    const { djiPerpetual, collateralToken } = useContext(ContractsContext)

    return (
        <Wrapper>
            <h2>
                Dow Jones Index
                <select>
                    <option>Dow Jones Index</option>
                    <option disabled>Hang Seng Index</option>
                    <option disabled>Nikkei 225</option>
                </select>
            </h2>
            <Stats>
                <StatItem>
                    <h4>
                        Status
                    </h4>
                    <p>{djiPerpetual.status}</p>
                </StatItem>
                <StatItem>
                    <h4>
                        Index Price
                    </h4>
                    <p>{djiPerpetual.indexPrice}{` `}{collateralToken.symbol}</p>
                </StatItem>
                <StatItem>
                    <h4>
                        Mark Price
                    </h4>
                    <p>{djiPerpetual.markPrice}{` `}{collateralToken.symbol}</p>
                </StatItem>
                <StatItem>
                    <h4>
                        Available Margin
                    </h4>
                    <p>{djiPerpetual.availableMargin}{` `}{collateralToken.symbol}</p>
                </StatItem>
                <StatItem xs="4">
                    <h4>
                        Accumulated Funding / 8hrs.
                    </h4>
                    <p>{Number(djiPerpetual.accumulatedFunding) >= 0 ? "+" : "-"}{djiPerpetual.accumulatedFunding}{` `}{collateralToken.symbol}</p>
                </StatItem>
            </Stats>
            <Row>
                <StyledCol xs="4">
                    <Tab>
                        <TabItem active={panel === 0} onClick={() => setPanel(0)}>Trade</TabItem>
                        <TabItem active={panel === 1} onClick={() => setPanel(1)} >Liquidity</TabItem>
                    </Tab>
                    <TabContent>
                        {panel === 0 && <TradePanel />}
                        {panel === 1 && <LiquidityPanel />}
                    </TabContent>
                </StyledCol>
                <StyledCol xs="8">
                    <TradingViewContainer>
                        <TradingViewWidget symbol="DJI" autosize />
                    </TradingViewContainer>
                    <Position />
                </StyledCol>
            </Row>
        </Wrapper>
    )
}

export default Trade