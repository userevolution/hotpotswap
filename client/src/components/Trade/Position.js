
import React, { useState, useCallback } from 'react';
import styled from "styled-components"

const Wrapper = styled.div`
    border: 1px solid black;
    min-height: 200px;

    margin-top: 20px;

`

const Position = () => {
    return (
        <Wrapper>
            You have no position.
        </Wrapper>
    )
}

export default Position