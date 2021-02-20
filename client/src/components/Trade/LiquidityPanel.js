import React, { useState, useCallback, useContext, useEffect } from 'react';
import styled from "styled-components"
import { Alert, Table, Container, FormGroup, Label, Nav, NavItem, NavLink, TabContent, TabPane, Jumbotron, Row, Col, Button, InputGroup, InputGroupAddon, InputGroupText, Input } from "reactstrap"
import { Plus } from "react-feather"
import classnames from 'classnames';
import { Slider } from "../common"
import useInterval from "../../hooks/useInterval"
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

const LiquidityPanel = ({ setDepositModal }) => {

    const [side, setSide] = useState(0) // 0 - add, 1 - remove
    const { collateralToken, djiPerpetual } = useContext(ContractsContext)
    const [errorMessage, setErrorMessage] = useState()
    const [currentPrice, setCurrentPrice] = useState(0)
    const [amount, setAmount] = useState(0.001)
    const [approved, setApproved] = useState(false)

    const { add, update } = useToasts()

    useInterval(() => {

        if (djiPerpetual) {

            (async () => {

                let errorCount = 0

                try {
                    const price = await djiPerpetual.getCurrentPrice(amount)
                    setCurrentPrice(Number(price))
                } catch (e) {
                    console.log(e)
                    errorCount += 1
                    setErrorMessage("Can't fetch current price from Pool")
                }

                if (errorCount === 0) {
                    setErrorMessage()
                }
            })()

        }

    }, 3000)

    useEffect(() => {
        if (djiPerpetual && djiPerpetual.shareToken) {

            djiPerpetual.shareToken.allowance(djiPerpetual.ammAddress).then(
                result => {
                    if (Number(result) > 0) {
                        setApproved(true)
                    }
                }
            )

        }
    }, [djiPerpetual])

    const handleChange = (e) => {
        setAmount(Number(e.target.value))
    }

    const onAddLiquidity = useCallback(async () => {

        if (amount > 0) {
            await djiPerpetual.addLiquidity(amount)
        }

    }, [amount])

    const onRemoveLiquidity = useCallback(async () => {

        if (amount > 0) {
            await djiPerpetual.removeLiquidity(amount)
        }

    }, [amount])

    const onApprove = useCallback(async () => {

        const tx = await djiPerpetual.shareToken.approve(djiPerpetual.ammAddress)
        const id = add(processingToast("Approving", "Your transaction is being processed", true, tx.hash))
        await tx.wait()
        setApproved(true)
        update({
            id,
            ...processingToast("Approved", "Your transaction is completed", false, tx.hash)
        })

    }, [djiPerpetual])

    return (
        <Wrapper>
            <Description>
                simply dummy text of the printing and typesetting industry.
            </Description>
            <div>
                <Table>
                    <tbody>
                        <tr>
                            <th scope="row">
                                Your Balance
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
                                Your LP Token
                            </th>
                            <td>
                                {Number(djiPerpetual?.shareToken?.balance).toLocaleString()}{` `}{djiPerpetual?.shareToken?.symbol}
                            </td>
                        </tr>
                        {/* <tr>
                            <th scope="row">
                                Your Share
                            </th>
                            <td>
                                3%
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                Pool Address
                            </th>
                            <td>
                                0x123456
                            </td>
                        </tr> */}
                    </tbody>
                </Table>
            </div>
            {/* <div>
                <Button outline={side !== 0} onClick={() => setSide(0)} color="info">Add</Button>
                <Button outline={side !== 1} onClick={() => setSide(1)} color="info">Remove</Button>
            </div> */}
            <Nav tabs>
                <NavItem>
                    <NavLink
                        className={classnames({ active: side === 0 })}
                        onClick={() => setSide(0)}
                    >
                        Add
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: side === 1 })}
                        onClick={() => setSide(1)}
                    >
                        Remove
                    </NavLink>
                </NavItem>
            </Nav>
            <TabContent style={{ paddingTop: 20 }} activeTab={`${side}`}>
                <TabPane tabId="0">
                    {/* Add */}
                    <Row>
                        <Col xs="12">
                            <FormGroup>
                                <Label for="currentPrice1">Price</Label>
                                <InputGroup>
                                    <Input value={currentPrice.toLocaleString()} type="text" disabled name="currentPrice1" id="currentPrice1" />
                                    <InputGroupAddon addonType="append">BUSD</InputGroupAddon>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs="12">
                            <FormGroup>
                                <Label for="addAmount">Amount</Label>
                                <InputGroup>
                                    <Input step="0.0001" value={amount} onChange={handleChange} type="number" name="addAmount" id="addAmount" />
                                    <InputGroupAddon addonType="append">
                                        {djiPerpetual?.shareToken?.symbol}
                                    </InputGroupAddon>
                                </InputGroup>
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
                                        {(2 * amount * currentPrice).toLocaleString()}
                                    </td>
                                </tr>

                            </tbody>
                        </Table>
                    </div>

                    <Error errorMessage={errorMessage} />

                    <Button disabled={Number(djiPerpetual.myDeposit) < amount} onClick={onAddLiquidity} style={{ marginBottom: 20 }} color="info" block>Add</Button>
                </TabPane>
                <TabPane tabId="1">
                    {/* Remove */}
                    <Row>
                        <Col xs="12">
                            <FormGroup>
                                <Label for="currentPrice2">Price</Label>
                                <InputGroup>
                                    <Input value={currentPrice.toLocaleString()} type="text" disabled name="currentPrice2" id="currentPrice2" />
                                    <InputGroupAddon addonType="append">
                                        {collateralToken.symbol}
                                    </InputGroupAddon>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs="12">
                            <FormGroup>
                                <Label for="removeAmount">Amount</Label>
                                <InputGroup>
                                    <Input step="0.0001" value={amount} onChange={handleChange} type="number" name="removeAmount" id="removeAmount" />
                                    <InputGroupAddon addonType="append">
                                        {djiPerpetual?.shareToken?.symbol}
                                    </InputGroupAddon>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                    </Row>

                    {/* <div>
                        <Table>
                            <tbody>
                                <tr>
                                    <th scope="row">
                                        <div>Total {collateralToken.symbol}</div>
                                    </th>
                                    <td>
                                        {(amount * currentPrice).toLocaleString()}
                                    </td>
                                </tr>

                            </tbody>
                        </Table>
                    </div> */}

                    <Error errorMessage={errorMessage} />

                    <Button onClick={onApprove} disabled={approved} color="info" block>Approve</Button>
                    <Button disabled={!approved} onClick={onRemoveLiquidity} style={{ marginBottom: 20 }} color="primary" block>Remove</Button>
                </TabPane>
            </TabContent>
        </Wrapper>
    )
}

export default LiquidityPanel