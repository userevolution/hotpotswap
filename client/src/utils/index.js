import {
    Spinner
} from "reactstrap"

export const shortAddress = (address, first = 7, last = -5) => {
    return `${address.slice(0, first)}...${address.slice(last)}`
}



export const processingToast = (title = "Processing", subtitle = "Transaction is being processed" , loading = false, txId = "") => {

    return {
        title,
        content: (
            <div>
                {subtitle}
                <br />
                <a href={`https://bscscan.com/tx/${txId}`} target="_blank"> {shortAddress(txId)}</a>{loading && <Spinner style={{ marginLeft: 10 }} size="sm" color="secondary" />}
            </div>
        )
    }

}