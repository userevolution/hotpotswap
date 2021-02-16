import React, { useState, useCallback } from 'react';
import styled from "styled-components"
import { Alert, Table, Container, Jumbotron, Row, Col, Button, InputGroup, InputGroupAddon, InputGroupText, Input } from "reactstrap"
import { Plus } from "react-feather"

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

    

`

const Description = styled.div`
    font-size: 14px;
    margin-bottom: 10px;
`


const TradePanel = () => {

    const [side, setSide] = useState(0) // 0 - long, 1 - short

    return (
        <Wrapper>
            <Description>
                simply dummy text of the printing and typesetting industry.
            </Description>
            {/* <div>
                <Button outline={side !== 0} onClick={() => setSide(0)} color="primary">Long</Button>
                <Button outline={side !== 1} onClick={() => setSide(1)} color="danger">Short</Button>
            </div> */}
            <div>

                <Table>
                    <tbody>
                        <tr>
                            <th scope="row">
                                <div style={{ marginTop: 3 }}>Your Deposit</div>
                            </th>
                            <td style={{display : "flex", flexDirection : "row"}}> 
                                <div style={{ marginTop: 3 }}>5588.76 BUSD</div>
                                <Button style={{marginLeft: 5}} color="info" size="sm">
                                    <Plus size={16}/>
                                </Button>
                            </td>
                            </tr>
                        <tr>
                            <th scope="row">
                                <div style={{ marginTop: 5 }}>Position</div>
                            </th>
                            <td>
                                <Button outline={side !== 0} onClick={() => setSide(0)} color="primary">Long</Button>
                                <Button outline={side !== 1} onClick={() => setSide(1)} color="danger">Short</Button>
                            </td>
                        </tr>

                        {side === 0 && (
                            <tr>
                                <th scope="row">
                                    <div  >Long Price</div>
                                </th>
                                <td>
                                    31622.67 BUSD
                                </td>
                            </tr>
                        )
                        }
                        {side === 1 && (
                            <tr>
                                <th scope="row">
                                    <div  >Short Price</div>
                                </th>
                                <td>
                                    31657.12 BUSD
                                </td>
                            </tr>
                        )
                        }

                    </tbody>
                </Table>


            </div>
        </Wrapper>
    )
}

export default TradePanel