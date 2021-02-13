

export const shortAddress = (address, first = 7, last = -5) => {
    return `${address.slice(0, first)}...${address.slice(last)}`
}
