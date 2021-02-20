import React, { useState, useCallback, useContext } from 'react';
import styled from "styled-components"
import { Alert, Container, Jumbotron, Row, Col, Button, InputGroup, InputGroupAddon, InputGroupText, Input } from "reactstrap"
import { Search } from "react-feather"
import { useHistory } from "react-router-dom";
import FlagHK from "../../assets/img/flag-hkg.png"
import FlagUS from "../../assets/img/flag-us.png"
import FlagJP from "../../assets/img/flag-jp.png"
import { ContractsContext } from "../../hooks/useContracts"

const Wrapper = styled(Container)`
     

    .jumbotron { 
        color: dark;
        background: rgb(238,174,202);
        background: radial-gradient(circle, rgba(238,174,202,1) 0%, rgba(148,187,233,1) 100%);
        border-radius: 8px; 

    }
    .search { 
        margin-top: 20px;
        margin-bottom: 30px;
    }

`

const Headline = styled(
    ({ className }) => {
        return (
            <div className={className}>
                <div>
                    <h3>Live the Live Market</h3>
                    <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
                    </p>
                </div>
            </div>
        )
    })`
    text-align: center; 
    padding-top: 30px;
    padding-bottom: 30px;
    
    div {
        margin-left: auto;
        margin-right: auto; 
        max-width: 800px;
    }
    `

const TokenList = styled(
    ({ className }) => {

        let history = useHistory()
        const { djiPerpetual, collateralToken } = useContext(ContractsContext)

        const toTrading = () => {
            history.push("/trade")
        }

        return (
            <div className={className}>
                <div onClick={toTrading} className="card enabled">
                    <div>
                        <img src={FlagUS} alt={`icon-1`} />
                    </div>
                    <div style={{ minWidth: 200 }}>
                        <h5>Perpetual Name</h5>
                        <p>Dow Jones Index</p>
                    </div>
                    <div style={{ minWidth: 160 }}>
                        <h5>Status</h5>
                        <p>{djiPerpetual.status}</p>
                    </div>

                    <div>
                        <h5>Index Price</h5>
                        <p>{Number(djiPerpetual.indexPrice).toLocaleString()}{` `}{collateralToken.symbol}</p>
                    </div>
                    <div>
                        <h5>Mark Price</h5>
                        <p>{Number(djiPerpetual.markPrice).toLocaleString()}{` `}{collateralToken.symbol}</p>
                    </div>
                    <div style={{ marginTop: 24 }}>
                        <u>Trade Now</u>
                    </div>
                </div>
                <div className="card disabled">
                    <div>
                        <img src={FlagHK} alt={`icon-2`} />
                    </div>
                    <div style={{ minWidth: 200 }}>
                        <h5>Perpetual Name</h5>
                        <p>Hang Seng Index</p>
                    </div>
                    <div style={{ minWidth: 160 }}>
                        <h5>Status</h5>
                        <p>Coming Soon</p>
                    </div>

                </div>
                <div className="card disabled">
                    <div>
                        <img src={FlagJP} alt={`icon-3`} />
                    </div>
                    <div style={{ minWidth: 200 }}>
                        <h5>Perpetual Name</h5>
                        <p>Nikkei 225 Index</p>
                    </div>
                    <div style={{ minWidth: 160 }}>
                        <h5>Status</h5>
                        <p>Coming Soon</p>
                    </div>

                </div>
            </div>
        )
    })`
    
    padding: 20px;

    .card {
        margin-top: 15px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        padding-top: 10px;
        padding-bottom: 10px;
        background: transparent;
        display: flex;
        flex-direction: row;
        cursor: pointer;
        overflow: hidden;

        img {
            width: 64px;
            height: 64px;
        }

        h5 {
            margin: 0px;
            margin-top: 12px; 
            margin-bottom: 2px;
            font-size: 14px;
        }
        p {
            font-size: 18px;
        }

        div { 
            display: flex; 
            flex-direction: column;
            :not(:first-child) {
                margin-left: 20px; 
                min-width: 160px;
            }
        }


    }
    .enabled {
        :hover {
            cursor: pointer;
            color: white;
            background-image: linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0)), linear-gradient(101deg, #78e4ff, #ff48fa);
            background-origin: border-box;
            background-clip: content-box, border-box;
            box-shadow: none;
        }
    }

    .disabled {
        background: #ddd;
        opacity: 0.6;
        cursor: not-allowed;
    }

    .soon {
        
    }

    `

const HowToUse = styled(
    ({ className }) => {
        return (
            <Col className={className} xs="12">
                <div className="-body">
                    HowToUse
                </div>
            </Col>
        )
    })`
    padding: 15px;
    >.-body {
        border : 1px solid black;
        border-radius: 8px;
        padding: 20px;
        min-height: 400px 
    }
    `

const Landing = () => {
    return (
        <Wrapper>
            {/* <Alert color="primary">
                We're live on Binance Smart Chain. 
            </Alert> */}
            <Headline />
            <TokenList />

            {/* header */}
            {/* <Jumbotron className="jumbotron">
                <h4 className="display-3">Article nor prepare chicken you him now.</h4>
                <p className="lead">You disposal strongly quitting his endeavor two settling him.</p>
                <Row className="search">
                    <Col sm="12" lg="6">
                        <InputGroup size="lg">
                            <InputGroupAddon addonType="prepend">
                                <InputGroupText><Search /></InputGroupText>
                            </InputGroupAddon>
                            <Input />
                        </InputGroup>
                    </Col>
                </Row>
                <ul>
                    <li>Don't have an address? View demo.</li>
                    <li>What is DeFi?</li>
                    <li>Binance Smart Chain?</li>
                </ul>
            </Jumbotron> */}
            {/* stats */}
            {/* <Row>
                <Card
                    title={"Total Burned"}
                />
                <Card
                    title={"Total Assets"}
                />
                <Card
                    title={"xxxx"}
                />
            </Row>
            <Row>
                <HowToUse />
            </Row> */}

        </Wrapper>
    )
}

export default Landing