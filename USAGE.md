# USAGE
## staketool
```

$ ./staketool help

Horizen node stake ownerhsip verification tool

VERSION
  staketool v1.3.0   linux-x64   node v14.16.1

USAGE
  ./staketool [COMMAND]

COMMANDS
  createstakeverification      Creates a stake verification request and optionally creates a raw transaction or outputs instructions 
                               to send funds                                                                                         
  sendtxandstakeverification   Broadcasts the verification transaction to the blockchain and the verification request to the         
                               tracking server                                                                                       
  cancelstakeverification      Cancel a verification request that is confirming or verified                                          
  liststakes                   List stakeaddresses and their verification status                                                     
  getbalance                   Display confirmed balance of an address                                                               
  help                         Display help for staketool. Use './staketool help [COMMAND]' for help about [COMMAND]                 


$ ./staketool help createstakeverification

Horizen node stake ownerhsip verification tool

USAGE
  ./staketool createstakeverification [OPTIONS]

DESCRIPTION
  Creates a stake verification request and optionally creates a raw transaction or outputs instructions to send funds 

OPTIONS
  -s=  | --stake=stakeaddress                 (required) stakeaddress to verify                                                     
  -p=  | --payaddress='[]'                    (required) JSON array of payaddress objects, see NOTES                                
  -sys=| --system=super|secure|testnet        (required) tracking system must be: super, secure, or testnet                         
  -m=  | --method=tool|zen-cli|instructions   (optional) [default: tool] method to use to create and sign the transaction, see      
                                              NOTES                                                                                 
  -o=  | --outputfile=path/filename           (optional) [default: ./verificationfiles/<system>/<stakeFirst8Chars>_<satoshis>.json] 
                                              override default filename or path/filename                                            
  -ez= | --extrazen=zen                       (optional) an amount in zen to add to the verification transaction, see NOTES         
  -v   | --verbose                            (optional) displays additional messages to help with troubleshooting                  


NOTES
  Payaddress:       The addresses in --payaddress need to be 1 to 5 valid transparent zen addresses. The sum of all "pct" needs to  
                    equal 100.00. A payaddress can be the same as the stakeaddress.                                                 
                    Some platforms may not need to have quotes escaped or may not have to encapsulate the array in single quotes.   
                    Example:--payaddress='[{"address":"ztcXfXAdPoDtyBJhzNmC3DzUkq3r22phsbt","pct":66.66},{"address":"zrFzxutppvxEdjyu4QNjogBMjtC1py9Hp1S","pct":33.34}]' 
                                                                                                                                    
  Tracking System   The system where the stake address will be used: super, secure, or testnet.  A stake address cannot be used for 
                    both secure and super node systems.                                                                             
                                                                                                                                    
  Method:           Option "tool" creates a raw transaction to be used by the tool (using zencashjs) and returns transaction and    
                    verification data to the tracking file. Signtxtool can be used to sign the transaction with the private key of  
                    the stake address.                                                                                              
                    Option "zen-cli" displays a zen-cli command to run manually that creates a raw transaction to sign using the    
                    zen-cli signrawtransaction command.                                                                             
                    Option "instructions" displays links to documentation on how to create the transaction using other methods like 
                    Sphere by Horizen or zen-cli z_sendmany.                                                                        
                                                                                                                                    
  Extrazen:         By default the tool creates a transaction smaller than 1 zen, in some circumstances this might be lower than a  
                    minimum transaction size.                                                                                       
                    With this option you can specifiy the minimum amount to send in the verification transaction. Must be a whole   
                    number (no decimals).                                                                                           


$ ./staketool help sendtxandstakeverification

Horizen node stake ownerhsip verification tool

USAGE
  ./staketool sendtxandstakeverification [OPTIONS]

DESCRIPTION
  Broadcasts the verification transaction (if present) to the blockchain and the verification request to the tracking server 

OPTIONS
  -a=  | --apikey=apisubkey              (required) a Super Node API sub key. Environment variable APIKEY can be used instead.      
  -sys=| --system=super|secure|testnet   (required) tracking system where stake is used                                             
  -i=  | --inputfile=path/filename       (optional) [default: ./verificationfiles/<stakeFirst8Chars>_<satoshis>.json] override      
                                         default input file from previous steps                                                     
  -s=  | --signedtxhex=mysignedtxhex     (optional) [default: parsed from inputfile] hexadecimal signed serialized raw transaction, 
                                         this is the output from a zen-cli signrawtransaction command                               
  -tx= | --txid=transactionidhex         (optional) the transaction id of a signed transaction that has already been broadcasted to 
                                         the network                                                                                
  -o=  | --outputfile=path/filename      (optional) [default: ./verificationfiles/<stakeFirst8Chars>_<satoshis>.json] override      
                                         default filename or path/filename                                                          
  -v   | --verbose                       (optional) displays additional messages to help with troubleshooting                       


NOTES
  The API key must be a sub key, not a main key. It may be obtained from your hosting provider or created on the API Settings page   
  of the Tracking System.                                                                                                            
                                                                                                                                     
  If -signedtxhex is not used, the current verification file is checked for a signed raw transaction from the previous step and sent 
  to the blockchain.                                                                                                                 
                                                                                                                                     
  If -txid is used, it is assumed that the transaction has already been broadcasted to the network by this tool or zen-cli or a      
  wallet.                                                                                                                            
                                                                                                                                     
  When this step completes the transaction id (txid) is written back to the verification tracking file.                              
  The tracking server replies with whether the stake verification request is created (status=confirming) or if there is an error.    
                                                                                                                                     
  If "sendtxandstakeverification" is run again and the txid is present, the tool will check the tracking server for status.          
                                                                                                                                     
  The tracking system waits for a number of block confirmations before changing the status to verified.                              
  Once verified a request is set to active after the end of the current earning period. Any existing active is set to replaced.      
  The current status can also be found by using the liststakes command or by checking the My Stakes page on the tracking server web  
  site after setting up your API key.                                                                                                
                                                                                                                                     
  If the transaction is not found by the tracking server within 4 hours the request is set to failed and the process will need to be 
  repeated with a new transaction.                                                                                                   


$ ./staketool help cancelstakeverification

Horizen node stake ownerhsip verification tool

USAGE
  ./staketool cancelstakeverification [OPTIONS]

DESCRIPTION
  Cancel a confirming or verified request 

OPTIONS
  -a=  | --apikey=apisubkey              (required) a Super Node API sub key. Environment variable APIKEY can be used instead. 
  -id= | --idstake=stakeid               (required) stake id to cancel                                                         
  -sys=| --system=super|secure|testnet   (required) tracking system where stake is used                                        
  -v   | --verbose                       (optional) displays additional messages to help with troubleshooting                  


NOTES
  Only status 'confirming' and 'verified' requests can be cancelled. Use 'liststakes' command to get the stake id. 


$ ./staketool help liststakes

Horizen node stake ownerhsip verification tool

USAGE
  ./staketool liststakes [OPTIONS]

DESCRIPTION
  List stakeaddresses and their verification status 

OPTIONS
  -a=  | --apikey=apisubkey                                         (required) a Super Node API sub key. Environment variable       
                                                                    APIKEY can be used instead.                                     
  -sys=| --system=super|secure|testnet                              (required) tracking system where stake is used                  
  -s=  | --stake=stakeaddress                                       (optional) filter by single stakeaddress                        
  -st= |                                                            (optional) filter by status                                     
  --status=confirming|verified|cancelled|active|replaced|failed|all                                                                   
  -f=  | --format=json|list                                         (optional) [default: json] format the output. Displays either   
                                                                    JSON or a list of one stake with details per console line       
  -v   | --verbose                                                  (optional) displays additional messages to help with            
                                                                    troubleshooting                                                 


NOTES
  Default is a list of all confirming, verified, and active stakes.  Also includes payto addresses and node ids with FQDNS (once     
  configured).                                                                                                                       


$ ./staketool help getbalance

Horizen node stake ownerhsip verification tool

USAGE
  ./staketool getbalance [OPTIONS]

DESCRIPTION
  Display confirmed balance of an address 

OPTIONS
  -s=  | --stake=stakeaddress            (required) the stakeaddress to show the balance of                   
  -sys=| --system=super|secure|testnet   (required) tracking system where stake is used                       
  -v   | --verbose                       (optional) displays additional messages to help with troubleshooting 



$ ./staketool help help

Horizen node stake ownerhsip verification tool

USAGE
  ./staketool help [COMMAND]

DESCRIPTION
 Display help for [COMMAND] 
```
## signtxtool
```

$ ./signtxtool help

Horizen node stake ownerhsip verification tool

VERSION
  signtxtool v1.3.0   linux-x64   node v14.16.1

USAGE
  ./signtxtool [COMMAND]

COMMANDS
  signverificationtransaction    Signs a raw transaction using output from "staketool createstakeverification"           
  keysfromseed                   Shows addresses and private keys of a BIP39 Mnemonic seed phrase                        
  help                           Display help for signtxtool. Use './signtxtool help [COMMAND]' for help about [COMMAND] 


$ ./signtxtool help signverificationtransaction

Horizen node stake ownerhsip verification tool

USAGE
  ./signtxtool signverificationtransaction [OPTIONS]

DESCRIPTION
  Signs a raw transaction using output from "staketool createstakeverification" 

OPTIONS
  -sys=| --system=super|secure|testnet   (required) tracking system where stake is used                                             
  -p=  | --privkey=myprivatekeyWIF       (optional) stakeaddress private key in standard WIF format, optionally environment         
                                         variable PRIVKEY can be used instead, see NOTES                                            
  -i=  | --inputfile=path/filename       (optional) [default: ./verificationfiles/<system>/<stakeFirst8Chars>_<satoshis>.json]      
                                         override default input file from previous steps                                            
  -o=  | --outputfile=path/filename      (optional) [default: ./verificationfiles/<system>/<stakeFirst8Chars>_<satoshis>.json]      
                                         override default filename or path/filename                                                 
  -v   | --verbose                       (optional) displays additional messages to help with troubleshooting                       


NOTES
  If the --privkey switch and the PRIVKEY environment variable are both omitted, the app will prompt for the private key to be       
  entered.                                                                                                                           
  One of the three methods to enter the private key must be used.                                                                    
                                                                                                                                     
  The private key can be obtained from the wallet containing the stake address or "zen-cli dumpprivkey mystakeaddr".                 
  If only a wallet seed phrase is available, "signtxtool keysfromseed" or a tool like https://iancoleman.io/bip39/                   
  can be used to obtain the private key of the stakeaddress.                                                                         
                                                                                                                                     
  USING OFFLINE                                                                                                                      
  When using this tool to sign on a another system (other than the system where the stake verification was done)                     
  the corresponding "./verificationfiles/<system>" folder (including the inprocess.json file) should be copied too.                  
  <system> is either: super, secure, or testnet.                                                                                     
  If not, the inputfile option should be used with the verifcation file. e.g. -i="/mypath/zthC3Poh_264954.json".                     
  The verication file will be updated with the signed transaction.                                                                   
  Copy the verification file back to the original system (into the folder) and continue with sendtxandstakeverification.             


$ ./signtxtool help keysfromseed

Horizen node stake ownerhsip verification tool

USAGE
  ./signtxtool keysfromseed  [OPTIONS]

DESCRIPTION
  Shows addresses and private keys of a BIP39 Mnemonic seed phrase 

OPTIONS
  -s=  | --seed="BIP39 seed phrase words"   (required) the BIP39 seed phrase                                                        
  -net=| --network=mainnet|testnet          (optional) The ZEN network to use (default: mainnet)                                    
  -a=  | --account=integer                  (optional) [default: 0] the account to use for the derivation path                      
  -n=  | --number=integer                   (optional) [default: 10] the quantity of addresses to return                            
  -p=  | --password="BIP39 Passphrase"      (optional) the BIP39 Passphrase                                                         
  -f=  | --format=json|list                 (optional) [default: json] format the output, displays either JSON or a list of one zen 
                                            address and WIF private key per console line                                            
  -v   | --verbose                          (optional) displays additional messages to help with troubleshooting                    



$ ./signtxtool help help

Horizen node stake ownerhsip verification tool

USAGE
  ./signtxtool help [COMMAND]

DESCRIPTION
  Display help for [COMMAND] 
```
