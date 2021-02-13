

import styled from "styled-components"
import { Check, X } from "react-feather"

export const SuccessIcon = styled(
    ({ className, size = 16 }) => {
        return (
            <Check
                className={className}
                size={size}
            />
        )
    })`
    color: green;
    margin-left: 5px;
    margin-right: 5px;
    margin-bottom: 2px;
    `


export const ErrorIcon = styled(
    ({ className, size = 16 }) => {
        return (
            <X
                className={className}
                size={size}
            />
        )
    })`
        color: red;
        margin-left: 5px;
        margin-right: 5px;
        margin-bottom: 2px;
        `
