import React, { useState, useCallback } from 'react';
import styled from "styled-components"
import { Alert, Table, Container, FormGroup, Label, Nav, NavItem, NavLink, TabContent, TabPane, Jumbotron, Row, Col, Button, InputGroup, InputGroupAddon, InputGroupText, Input } from "reactstrap"
import { Plus } from "react-feather"
import classnames from 'classnames';
import { Slider } from "../common"

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


const LiquidityPanel = () => {

    const [side, setSide] = useState(0) // 0 - add, 1 - remove

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
                                1440.23 BUSD
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                Your Collateral
                            </th>
                            <td>
                                1440.23 BUSD
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                Your LP Token
                            </th>
                            <td>
                                100.00 LP
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                Your Share
                            </th>
                            <td>
                                3%
                            </td>
                        </tr>
                        {/* <tr>
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
                                <Label for="addAmount">Amount</Label>
                                <InputGroup>
                                    <Input type="number" name="addAmount" id="addAmount" />
                                    <InputGroupAddon addonType="append">BUSD</InputGroupAddon>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Button style={{ marginBottom: 20 }} color="info" block>Add</Button>
                </TabPane>
                <TabPane tabId="1">
                    {/* Remove */}
                    <Row>
                        <Col xs="12">
                            <FormGroup>
                                <Label for="removeAmount">Amount</Label>
                                <InputGroup>
                                    <Input type="number" name="removeAmount" id="removeAmount" />
                                    <InputGroupAddon addonType="append">BUSD</InputGroupAddon>
                                </InputGroup>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Button style={{ marginBottom: 20 }} color="info" block>Remove</Button>
                </TabPane>
            </TabContent>
        </Wrapper>
    )
}

export default LiquidityPanel