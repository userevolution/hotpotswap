import React, { useState, useCallback } from 'react';
import styled from "styled-components"
import { Alert, Container, Jumbotron, Row, Col, Button, InputGroup, InputGroupAddon, InputGroupText, Input } from "reactstrap"
import { Search } from "react-feather"
import TokenList from "../TokenList"


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

const Card = styled(
    ({ className }) => {

        return (
            <Col className={className} lg="4" xs="12">
                <div className="-body">

                </div>
            </Col>
        )
    })`
    padding: 15px;
    >.-body {
        border : 1px solid black;
        border-radius: 8px;
        padding: 10px;
        min-height: 160px 
    }
    `

const Headline = styled(
    ({ className }) => {
        return (
            <div className={className}>
                <div>
                    <h3>Live the Live Market</h3>
                    <p>
                        {/* Introducing Elliptix, a synthetic asset protocol where BUSD is the underlying collateral for mint tokens that track the Stock Market Indexes around the world available for you on Binance Smart Chain. */}
                        Introduction Hotpotswap, 
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


            <Row>
                <Col xs="12">
                    <TokenList

                    />
                </Col>
                {/* <Col xs="4">
                    <div className="jumbotron">
                        <h5>Live the Live Market</h5>
                        Introducing Elliptix, a synthetic asset protocol where BUSD is the underlying collateral for mint tokens that track the Stock Market Indexes.
                        
                    </div>
                </Col> */}
            </Row>

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