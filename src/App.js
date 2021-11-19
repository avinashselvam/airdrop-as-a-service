import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
import base58 from 'bs58'

import { parse, unparse } from 'papaparse'

import { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {

  // USE STATES

  // phantom wallet object
  const [wallet, setWallet] = useState(null)
  // token details
  const [mintAddress, setMintAddress] = useState("")
  // from account details
  const [fromPublicKey, setFromPublicKey] = useState(null)
  const [fromPrivateKeyString, setFromPrivateKeyString] = useState("")
  // "2qEPo7rf4aTBYA1vDurReN5httPWECjV7C8ohRSChLEuNwrKTwxQNfzn91mw6aoXX9fS9XLDgwecW9SaqgGsMYbP"

  const [connection, _] = useState(new Connection("http://api.devnet.solana.com"))

  const [isValidPrivateKey, setIsValidPrivateKey] = useState(false)
  const [isValidMintAddress, setIsValidMintAddress] = useState(false)
  const [isFileUploaded, setIsFileUploaded] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadHref, setDownloadHref] = useState(null)

  const [filename, setFilename] = useState(null)

  const [currentTransaction, setCurrentTransaction] = useState(0)
  const [successfulTransactions, setSuccessfulTransactions] = useState(0)
  const [failedTransactions, setFailedTransactions] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)

  // connection object to solana network
  // const connection = new Connection("http://api.devnet.solana.com")
  // console.log(connection)

  // USE REFS
  const fileInput = useRef(null)

  // USE EFFECTS

  /*
  adds a load event listener that runs after page is loaded
  here we check if wallet is connected after page is loaded
  */
  useEffect(() => {
    window.addEventListener("load", async (event) => {
      try{
        const { solana } = window
          if (solana) {
            if (solana.isPhantom) {
              const response = await solana.connect({onlyIfTrusted: true})
              const publicKey = response.publicKey
              setFromPublicKey(new PublicKey(publicKey.toString()))
              setWallet(solana)
              console.log(`Connected with Public Key: ${publicKey.toString()}`)
            } else console.log("Only phantom wallet is supported for now")
          } else alert('Solana object not found! Get a Phantom Wallet 👻')
        } catch (error) {
          console.error(error)
      }
      // await checkIfWallerConnected()
    })
  })

  useEffect(() => {
    console.log("changed")
  }, [successfulTransactions])

  // FUNCTIONS

  const connectToWallet = async () => {
    try{
      const { solana } = window
        if (solana) {
          if (solana.isPhantom) {
            const response = await solana.connect()
            const publicKey = response.publicKey
            setFromPublicKey(new PublicKey(publicKey.toString()))
            setWallet(solana)
            console.log(`Connected with Public Key: ${publicKey.toString()}`)
          } else console.log("Only phantom wallet is supported for now")
        } else alert('Solana object not found! Get a Phantom Wallet 👻')
      } catch (error) {
        console.error(error)
    }
  }

  /*
  checks for wallet object and if wallet is phantom
  */
  const checkIfWallerConnected = async () => {
    connectToWallet({ onlyIfTrusted: true })
  }

  const validatePrivateKeyInput = (event) => {
    const value = event.target.value
    const isLength88 = value.length == 88
    const isAlphaNum = value.match(/^[0-9a-zA-Z]+$/)
    setIsValidPrivateKey(isLength88 && isAlphaNum)
  }

  const validateMintAddressInput = (event) => {
    const value = event.target.value
    const isLength44 = value.length == 44
    const isAlphaNum = value.match(/^[0-9a-zA-Z]+$/)
    setIsValidMintAddress(isLength44 && isAlphaNum)
  }

  const handlePrivateKeyInput = (event) => {
    const value = event.target.value
    const isLength88 = value.length == 88
    const isAlphaNum = value.match(/^[0-9a-zA-Z]+$/)
    setIsValidPrivateKey(isLength88 && isAlphaNum)
    setFromPrivateKeyString(value)
  }

  const handleMintAddressInput = (event) => {
    const value = event.target.value
    const isLength44 = value.length == 44
    const isAlphaNum = value.match(/^[0-9a-zA-Z]+$/)
    setIsValidMintAddress(isLength44 && isAlphaNum)
    setMintAddress(value)
  }

  const handleFileUploadInput = (event) => {
    const path = event.target.value.replace(/^.*[\\\/]/, '')
    setFilename(path)
    setIsFileUploaded(true)
  }

  const makeTransaction = async (instructions) => {

    const transaction = new Transaction()
    transaction.add(...instructions)
    transaction.feePayer = fromPublicKey
    try {
      transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash
      return transaction
    } catch (error) {
      console.log(error)
    }

  }

  const makeTransactionList = async (tokenDetails, fromDetails, airdropList) => {
    
    const transactions = await Promise.all(airdropList.map(async (entry) => {
      const [toPublicKeyString, amount] = entry
      const toDetails = new PublicKey(toPublicKeyString)
      try {
        const instructions = await createInstructionsForTransaction(tokenDetails, fromDetails, toDetails, amount)
        const transaction = await makeTransaction(instructions)
        return transaction
      } catch (error) {
        console.log(error)
      }
    }))
    return transactions

  }

  const process = async (tokenDetails, fromDetails, airdropList) => {

    let logs = []

    const signer = fromDetails[2]

    const transactions = await makeTransactionList(tokenDetails, fromDetails, airdropList)
    setTotalTransactions(transactions.length)

    const sendTransaction = async (signedTransactions, idx, sofar) => {
      if (signedTransactions.length === 0) {
        setIsProcessing(false)
        makeReportDownloadable(logs) 
        return
      }
      setCurrentTransaction(idx+1)
      const signedTransaction = signedTransactions[0]
      try {
        console.log("sofar", sofar)
        const signature = await connection.sendTransaction(signedTransaction, [signer], { skipPreflight: true })
        const response = await connection.confirmTransaction(signature)
        const passed = response !== null
        // console.log([...airdropList[idx], signature,  ? "pass" : "fail"])
        logs.push([...airdropList[idx], signature, passed ? "pass" : "fail"])
        if(passed) {
          console.log(successfulTransactions, idx, passed)
          sofar += 1
          setSuccessfulTransactions(sofar)
        }
      } catch (error) {
        console.log(error)
      } finally {
        signedTransactions.shift()
        sendTransaction(signedTransactions, idx+1, sofar)
      }
    }

    sendTransaction(transactions, 0, 0)

  }

  

  const makeReportDownloadable = (logs) => {
    const csv = unparse({
      "fields": ["Destination Public Key", "Amount", "Transaction Signature", "Signature verification"],
      "data": logs
    })
    const csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    const csvURL = window.URL.createObjectURL(csvData)
    console.log(csvData, csvURL)
    setDownloadHref(csvURL)
  }

  const start = async () => {

    setIsProcessing(true)

    // once we have private key and mint address we can create token object
    const mintPublicKey = new PublicKey(mintAddress)
    const payer = Keypair.fromSecretKey(base58.decode(fromPrivateKeyString))
    const token = new Token(connection, mintPublicKey, TOKEN_PROGRAM_ID, payer)

    // once we have the public key we get the associated account address
    const fromAssociatedTokenAddress = (await token.getOrCreateAssociatedAccountInfo(fromPublicKey)).address

    // pack information together for easy passing around
    const tokenDetails = [token, mintPublicKey]
    const fromDetails = [fromPublicKey, fromAssociatedTokenAddress, payer]

    // get reference of input and get its files
    const airdropFile = fileInput.current.files[0]
    parse(airdropFile, { complete: (results) => {
      const airdropList = results.data
      console.log(airdropList.length)
      process(tokenDetails, fromDetails, airdropList)
    }})
    
  }

  const createInstructionsForTransaction = async (tokenDetails, fromDetails, toDetails, amount) => {

    const [token, mintPublicKey] = tokenDetails
    const [fromPublicKey, fromAssociatedTokenAddress] = fromDetails
    const toPublicKey = toDetails

    let instructions = []

    try {
      // get to associated token account address
      const toAssociatedTokenAddress = await Token.getAssociatedTokenAddress(
        token.associatedProgramId,
        token.programId,
        token.publicKey,
        toPublicKey
      )

      // get to associated token account info to check if such an account exists
      const toTokenAccount = await connection.getAccountInfo(toAssociatedTokenAddress)
      // if not then add a create account instruction to the transaction
      const associatedAccountCreationInstruction = Token.createAssociatedTokenAccountInstruction(
        token.associatedProgramId,
        token.programId,
        mintPublicKey,
        toAssociatedTokenAddress,
        toPublicKey,
        fromPublicKey
      )

      if (toTokenAccount === null) instructions.push(associatedAccountCreationInstruction)
      instructions.push(Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        fromAssociatedTokenAddress,
        toAssociatedTokenAddress,
        fromPublicKey,
        [],
        amount
      ))

    } catch (error) {
      console.log(error)
    }

    return instructions

  }

  // connect to wallet
  const step1 = () => (fromPublicKey ? <div className="step">
      <h3>Using Public Key </h3>
      <h4>{fromPublicKey.toString()}</h4>
    </div> : <button onClick={connectToWallet}>Connect to Phantom</button>)

  // get private key
  const step2 = () => <div  className="step">
    <h3>Private key. Needed for signing the transactions.</h3>
    {/* <p></p> */}
    <input type="text" id="privatekey" disabled={isProcessing} value={fromPrivateKeyString} placeholder="private key" onChange={handlePrivateKeyInput} onBlur={validatePrivateKeyInput}/>
    {!isValidPrivateKey && fromPrivateKeyString && fromPrivateKeyString.length && <p className="error">Invalid. Private Key is a 88 character alpha numeric string</p>}
  </div>

  // get mint address
  const step3 = () => <div  className="step">
    <h3>Mint address</h3>
    <input type="text" id="token" disabled={isProcessing} value={mintAddress} placeholder="mint Address" onChange={handleMintAddressInput} onBlur={validateMintAddressInput}/>
    {mintAddress && mintAddress.length && !isValidMintAddress && <p className="error">Invalid. Mint Address is a 44 character alpha numeric string</p>}
    </div>

  // upload csv file
  const step4 = () => <div  className="step">
    <h3>Upload Airdrop list</h3>
    <label className="upload">
      Choose File
      <input ref={fileInput} type="file" id="csv" onChange={handleFileUploadInput}/>
    </label>
    <p>{filename}</p>
    </div>

  const step5 = () => <div className="step">
    <button disabled={!(fromPublicKey && isValidPrivateKey && isValidMintAddress) || isProcessing} onClick={start}>Start</button>
    {isProcessing && <div>
        <p>Processing {currentTransaction} of {totalTransactions} transactions. Success: {successfulTransactions} Failed: {currentTransaction-successfulTransactions-1}</p>
      </div>}
    {downloadHref && <div>
        <p>Done. <a href={downloadHref} download="airdrop_results.csv">Download Results</a></p>
        
      </div>}
    </div>

  const steps = [step2, step3, step4, step5]

  return (
    <div className="App">
      <div className="inputs">
        <div className="header">
          <h2>Airdrop as a Service</h2>
          <a href="https://github.com/avinashselvam/airdrop-as-a-service">How to use?</a>
        </div>
        {step1()}
        {steps.map((step, idx) => fromPublicKey && step())}
      </div>
    </div>
  )
}

export default App
