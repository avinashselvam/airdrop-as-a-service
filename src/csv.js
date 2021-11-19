import { parse, unparse } from 'papaparse'
import {useEffect, useRef} from 'react'

const Csv = () => {

    const fileinp = useRef(null)
    const downloadLink = useRef(null)

    const csv = unparse({
        "fields": ["Destination Private Key", "Amount", "Transaction Signature", "Signature verification"],
        "data": [[1, 2, 3, "pass"], [2, 3, 4, "fail"]]
      })

    useEffect(() => {
        readyDownload()
    })

    const readyDownload = (csv) => {
        const csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
        const csvURL = window.URL.createObjectURL(csvData)
        console.log(csvData, csvURL)
        downloadLink.current.href = csvURL
        downloadLink.current.download  = "airdrop_results.csv"
    }

    

    const printRows = (files) => {
        if (files.length !== 1) throw "please load one file"
        const file = files[0]
        parse(file, {
            worker: true,
            step: results => {
                console.log(results.data)
            }
        })
    }

    const start = () => {
        console.log(fileinp.current.files)
    }

    return <div>
        <input ref={fileinp} type="file"/>
        <button onClick={start}>start</button>
        <a ref={downloadLink}>Download</a>
    </div>

    
}

export default Csv