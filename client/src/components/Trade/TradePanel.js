import React, { useState, useCallback, useContext, useEffect } from 'react';
import styled from "styled-components"
import {
    Alert,
    Table,
    Container,
    Jumbotron,
    Nav,
    Form,
    InputGroupAddon,
    InputGroupText,
    FormGroup,
    Label,
    NavItem,
    TabContent,
    TabPane,
    TabItem,
    NavLink,
    Row,
    Col,
    Button,
    InputGroup,
    Input,
    Modal,
    Spinner,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap"
import { Plus } from "react-feather"
import classnames from 'classnames';
import useInterval from "../../hooks/useInterval"
import { Slider } from "../common"
import { ContractsContext } from "../../hooks/useContracts"
import { useToasts } from "../../hooks/useToasts"
import { shortAddress, processingToast } from "../../utils"


const Wrapper = styled.div`

    button {
        :first-child {
            margin-right: 3px;
        }
    }

    h2 {
        margin: 0px;
        margin-top: 10px;
    }

    a {
        color: inherit;
        cursor: pointer;
    }

`

const Description = styled.div`
    font-size: 14px;
    margin-bottom: 10px;
    margin-top: 10px;
`

const Error = ({ errorMessage }) => {
    return (
        <div style={{ textAlign: "center", fontSize: 12, height: 30, fontWeight: 600, color: "red" }}>
            {errorMessage}
        </div>
    )
}

const TradePanel = ({ setDepositModal }) => {

    const [side, setSide] = useState(0) // 0 - long, 1 - short
    
    const [amount, setAmount] = useState(0.001)
    const [errorMessage, setErrorMessage] = useState()

    const { collateralToken, djiPerpetual } = useContext(ContractsContext)
    const [buyPrice, setBuyPrice] = useState(0)
    const [sellPrice, setSellPrice] = useState(0)

    useInterval(() => {

        if (djiPerpetual && amount > 0) {

            (async () => {

                let errorCount = 0

                try {
                    const buyPrice = await djiPerpetual.getBuyPrice(amount)
                    setBuyPrice(Number(buyPrice))
                } catch (e) {
                    errorCount += 1
                    setErrorMessage("Price Error - Please reduce collateral size")
                }

                try {
                    const sellPrice = await djiPerpetual.getSellPrice(amount)
                    setSellPrice(Number(sellPrice))
                } catch (e) {
                    errorCount += 1
                    setErrorMessage("Price Error - Please reduce collateral size")
                }

                if (errorCount === 0) {
                    setErrorMessage()
                }

            })()

        }

    }, 3000)

    

    const handleChange = (e) => {
        setAmount(Number(e.target.value))
    }

    const onBuy = useCallback(async () => {

        await djiPerpetual.buy(amount)

    }, [djiPerpetual, amount])

    const onSell = useCallback(async () => {

        await djiPerpetual.sell(amount)

    }, [djiPerpetual, amount])

    return (
        <>
            <Wrapper>
                <Description>
                    simply dummy text of the printing and typesetting industry.
                </Description>
                <div>
                    <Table>
                        <tbody>
                            <tr>
                                <th scope="row">
                                    <div>Your Balance</div>
                                </th>
                                <td>
                                    {collateralToken.balance}{` `}{collateralToken.symbol}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <div style={{ marginTop: 3 }}>Your Deposit</div>
                                </th>
                                <td style={{ display: "flex", flexDirection: "row" }}>
                                    <div style={{ marginTop: 3 }}>{Number(djiPerpetual.myDeposit).toLocaleString()}{` `}{collateralToken.symbol}</div>
                                    <Button onClick={() => setDepositModal(true)} style={{ marginLeft: 5 }} color="info" size="sm">
                                        <Plus size={16} />
                                    </Button>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <div>Leverage</div>
                                </th>
                                <td>
                                    0.0x
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </div>
                <Nav tabs>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: side === 0 })}
                            onClick={() => setSide(0)}
                        >
                            Long
                    </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: side === 1 })}
                            onClick={() => setSide(1)}
                        >
                            Short
                    </NavLink>
                    </NavItem>
                </Nav>
                <TabContent style={{ paddingTop: 20 }} activeTab={`${side}`}>
                    <TabPane tabId="0">
                        {/* Long */}
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="buyPrice">Price</Label>
                                    <InputGroup>
                                        <Input value={buyPrice.toLocaleString()} type="text" disabled name="buyPrice" id="buyPrice" />
                                        <InputGroupAddon addonType="append">
                                            { collateralToken?.symbol }
                                        </InputGroupAddon>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="buyAmount">Amount</Label>
                                    <InputGroup>
                                        <Input step="0.0001" value={amount} onChange={handleChange} type="number" name="buyAmount" id="buyAmount" />
                                        <InputGroupAddon addonType="append">
                                            { djiPerpetual?.shareToken?.symbol }
                                        </InputGroupAddon>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="leverage">Leverage</Label>
                                    <Slider />
                                    <p>1.5x</p>
                                </FormGroup>
                            </Col>
                        </Row>
                        <div>
                            <Table>
                                <tbody>
                                    <tr>
                                        <th scope="row">
                                            <div>Total {collateralToken.symbol}</div>
                                        </th>
                                        <td>
                                            {(amount * buyPrice).toLocaleString()}
                                        </td>
                                    </tr>

                                </tbody>
                            </Table>
                        </div>

                        <Error errorMessage={errorMessage} />

                        <Button onClick={onBuy} disabled={Number(djiPerpetual.myDeposit) === 0} style={{ marginBottom: 20 }} color="info" block>Long</Button>
                    </TabPane>
                    <TabPane tabId="1">
                        {/* Short */}
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="shortPrice">Price</Label>
                                    <InputGroup>
                                        <Input value={sellPrice.toLocaleString()} type="text" disabled name="shortPrice" id="shortPrice" />
                                        <InputGroupAddon addonType="append">
                                            { collateralToken?.symbol }
                                        </InputGroupAddon>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="shortAmount">Amount</Label>
                                    <InputGroup>
                                        <Input step="0.0001" value={amount} onChange={handleChange} type="number" name="shortAmount" id="shortAmount" />
                                        <InputGroupAddon addonType="append">
                                            { djiPerpetual?.shareToken?.symbol }
                                        </InputGroupAddon>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="leverage">Leverage</Label>
                                    <Slider />
                                    <p>1.5x</p>
                                </FormGroup>
                            </Col>
                        </Row>
                        <div>
                            <Table>
                                <tbody>
                                    <tr>
                                        <th scope="row">
                                            <div>Total {collateralToken.symbol}</div>
                                        </th>
                                        <td>
                                            {(amount * sellPrice).toLocaleString()}
                                        </td>
                                    </tr>

                                </tbody>
                            </Table>
                        </div>

                        <Error errorMessage={errorMessage} />

                        <Button onClick={onSell} disabled={Number(djiPerpetual.myDeposit) === 0} style={{ marginBottom: 20 }} color="info" block>Short</Button>
                    </TabPane>
                </TabContent>
            </Wrapper>
            
        </>
    )
}




export default TradePanel