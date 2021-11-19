// import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
// import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js'
// import base58 from 'bs58'


  
//   const makeTransaction = async (toPublicKey, amount) => {

//     const instructions = await createInstructionsForTransaction(toPublicKey, amount)
//     const transaction = new Transaction()
//     transaction.add(...instructions)

//     try {
//       transaction.feePayer = fromPublicKey
//       transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash

//       const signedTransaction = await wallet.signTransaction(transaction)

//       const signature = await connection.sendRawTransaction(signedTransaction.serialize(), { skipPreflight: true })
//       console.log(signature)
//       const response = await connection.confirmTransaction(signature)
//       console.log(response)
//     } catch (error) {
//       console.log(error)
//     }

//   }

// export {makeTransaction}