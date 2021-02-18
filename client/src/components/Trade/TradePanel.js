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


const TradePanel = () => {

    const [side, setSide] = useState(0) // 0 - long, 1 - short
    const [loginModal, setLoginModal] = useState(false)


    const { collateralToken, djiPerpetual } = useContext(ContractsContext)

    const toggleModal = useCallback(() => {
        setLoginModal(!loginModal)
    }, [loginModal])




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
                                    <div style={{ marginTop: 3 }}>{djiPerpetual.myDeposit}{` `}{collateralToken.symbol}</div>
                                    <Button onClick={() => setLoginModal(true)} style={{ marginLeft: 5 }} color="info" size="sm">
                                        <Plus size={16} />
                                    </Button>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <div  >Leverage</div>
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
                                        <Input type="number" disabled name="buyPrice" id="buyPrice" />
                                        <InputGroupAddon addonType="append">BUSD</InputGroupAddon>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="buyAmount">Amount</Label>
                                    <InputGroup>
                                        <Input type="number" name="buyAmount" id="buyAmount" />
                                        <InputGroupAddon addonType="append">DJI</InputGroupAddon>
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
                        <Button style={{ marginBottom: 20 }} color="info" block>Long</Button>
                    </TabPane>
                    <TabPane tabId="1">
                        {/* Short */}
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="shortPrice">Price</Label>
                                    <InputGroup>
                                        <Input type="number" disabled name="shortPrice" id="shortPrice" />
                                        <InputGroupAddon addonType="append">BUSD</InputGroupAddon>
                                    </InputGroup>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="shortAmount">Amount</Label>
                                    <InputGroup>
                                        <Input type="number" name="shortAmount" id="shortAmount" />
                                        <InputGroupAddon addonType="append">DJI</InputGroupAddon>
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
                        <Button style={{ marginBottom: 20 }} color="info" block>Short</Button>
                    </TabPane>
                </TabContent>
            </Wrapper>
            <DepositModal
                loginModal={loginModal}
                toggleModal={toggleModal}
            />
        </>
    )
}


const StyledModalBody = styled(ModalBody)`

    a {
        color: inherit;
        cursor: pointer;
    }

    p {
        font-size: 14px;
        margin-top: 5px;
    }

`



const DepositModal = ({ loginModal, toggleModal }) => {

    const [side, setSide] = useState(0) // 0 - Deposit , 1 - Withdraw
    const [amount, setAmount] = useState(0)
    const { djiPerpetual, collateralToken, increaseTick } = useContext(ContractsContext)
    const [approved, setApproved] = useState(false)

    const { add, update } = useToasts()

    const handleChange = (e) => {
        setAmount(Number(e.target.value))
    }

    useEffect(() => {
        if (djiPerpetual && collateralToken && djiPerpetual.perpetualAddress) {

            collateralToken.allowance(djiPerpetual.perpetualAddress).then(
                result => {
                    if (Number(result) > 0) {
                        setApproved(true)
                    }
                }
            )

        }
    }, [collateralToken, djiPerpetual])

    const onDeposit = useCallback(async () => {

        if (Number(amount) > 0) {
            const tx = await djiPerpetual.deposit(`${amount}`)
            toggleModal()
            const id = add(processingToast("Depositing", "Your transaction is being processed", true, tx.hash))
            await tx.wait()
            update({
                id,
                ...processingToast("Deposited", "Your transaction is completed", false, tx.hash)
            })

            increaseTick()

        }

    }, [amount, djiPerpetual])

    const onWithdraw = useCallback(async () => {

        if (Number(amount) > 0) {
            const tx = await djiPerpetual.withdraw(`${amount}`)
            toggleModal()
            const id = add(processingToast("Withdrawing", "Your transaction is being processed", true, tx.hash))
            await tx.wait()
            update({
                id,
                ...processingToast("Withdrawn", "Your transaction is completed", false, tx.hash)
            })

            increaseTick()
        }

    }, [amount, djiPerpetual])

    const onApprove = useCallback(async () => {

        const tx = await collateralToken.approve(djiPerpetual.perpetualAddress)
        const id = add(processingToast("Approving", "Your transaction is being processed", true, tx.hash))
        await tx.wait()
        setApproved(true)
        update({
            id,
            ...processingToast("Approved", "Your transaction is completed", false, tx.hash)
        })
    }, [collateralToken, djiPerpetual])

    return (
        <Modal isOpen={loginModal} toggle={toggleModal}>
            <ModalHeader toggle={toggleModal}>Your Deposit</ModalHeader>
            <StyledModalBody>
                <Nav tabs>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: side === 0 })}
                            onClick={() => setSide(0)}
                        >
                            Deposit
                    </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: side === 1 })}
                            onClick={() => setSide(1)}
                        >
                            Withdraw
                        </NavLink>
                    </NavItem>
                </Nav>
                <TabContent style={{ paddingTop: 20 }} activeTab={`${side}`}>
                    <TabPane tabId="0">
                        {/* Deposit */}
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="addAmount">Amount</Label>
                                    <InputGroup>
                                        <Input value={amount} onChange={handleChange} type="number" name="addAmount" id="addAmount" />
                                        <InputGroupAddon addonType="append">BUSD</InputGroupAddon>
                                    </InputGroup>
                                    <p>Max {collateralToken.balance}{` `}{collateralToken.symbol}</p>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Button disabled={approved} onClick={onApprove} color="info" block>Approve</Button>
                        <Button disabled={!approved} style={{ marginBottom: 20 }} onClick={onDeposit} color="primary" block>Deposit</Button>
                    </TabPane>
                    <TabPane tabId="1">
                        {/* Withdraw */}
                        <Row>
                            <Col xs="12">
                                <FormGroup>
                                    <Label for="removeAmount">Amount</Label>
                                    <InputGroup>
                                        <Input value={amount} onChange={handleChange} type="number" name="removeAmount" id="removeAmount" />
                                        <InputGroupAddon addonType="append">BUSD</InputGroupAddon>
                                    </InputGroup>
                                    <p>Available {djiPerpetual.myDeposit}{` `}{collateralToken.symbol}</p>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Button disabled={Number(djiPerpetual.myDeposit) === 0} onClick={onWithdraw} style={{ marginBottom: 20 }} color="warning" block>Withdraw</Button>
                    </TabPane>
                </TabContent>
            </StyledModalBody>
            {/* <ModalFooter>
                <Button color="secondary" onClick={toggleModal}>Close</Button>
            </ModalFooter> */}
        </Modal>
    )
}

export default TradePanel