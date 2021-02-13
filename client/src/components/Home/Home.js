import React, { useState, useCallback } from 'react';
import styled from "styled-components"
import { Container, Jumbotron, Row, Col, Button, InputGroup, InputGroupAddon, InputGroupText, Input } from "reactstrap"
import { Nav, NavItem, Dropdown, DropdownItem, DropdownToggle, DropdownMenu, NavLink } from 'reactstrap';

const Wrapper = styled(Container)`
    margin-top: 20px;
`

const MenuItem = styled(NavLink)`
    cursor: pointer;
`

const Switcher = styled.div`
    border : 1px solid black;
    border-radius: 8px;
    padding: 20px;
    height: 80vh;
`


const Home = () => {

    const [ panel, setPanel ] = useState()

    return (
        <Wrapper>
            <Nav tabs>
                <NavItem>
                    <MenuItem style={{ background: "transparent", color: "inherit" }} active>Dashboard</MenuItem>
                </NavItem>
                <NavItem>
                    <MenuItem style={{ background: "transparent", color: "inherit", opacity: 0.6 }} >Mint Assets</MenuItem>
                </NavItem>
                <NavItem>
                    <MenuItem style={{ background: "transparent", color: "inherit", opacity: 0.6 }}>Setup Burner</MenuItem>
                </NavItem>
            </Nav>
        </Wrapper>
    )
}

export default Home