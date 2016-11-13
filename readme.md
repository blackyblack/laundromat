Laundromat

Ethereum based mixing service using ring signatures to anonymize participants.

More info: https://docs.google.com/document/d/1KtAn_gMATO2D2WLDPQdtS2IcmTZDUorFmfIlZm64-Ys

Usage:

- Run your local geth node with RPC enabled for your localhost:
  geth.exe --rpc --rpcport "8545" --rpcaddr="localhost" --rpccorsdomain "*"
  Make sure it is only accessible from your local network!
- Open app/index.html to access the Laundromat UI
- Check the desired mixing contract status:
  enter the contract address into Query Status->Contract Address eg 0x401e28717a6a35a50938bc7f290f2678fc0a2816;
  click "Status" button
- If there are available seats you can join the mixing ("Got participants" is less than "Participants limit").
  You will have "Payment (ETH)" Ether deducted from your account for the mixing.
- To join the mixing:
  enter the contract address into Deposit->To contract eg 0x401e28717a6a35a50938bc7f290f2678fc0a2816;
  enter your Ethereum account (you will need to unlock it, check available accounts with "geth account list" command) eg 0x4460f4c8edbca96f9db17ef95aaf329eddaeac29;
  generate private key with Private key->Generate. Write it down - your coins will be lost if you loose your private key;
  enter your private key int Deposit->Private key eg 24883375667666319798130594789127643442423595702572623965227685575198986951784;
  unlock your account:
    geth attach
    personal.unlockAccount('your_account',"your_password") eg personal.unlockAccount('0x401e28717a6a35a50938bc7f290f2678fc0a2816',"password")
  click "Deposit" button
- When all participants are in you can withdraw your money. To withdraw:
  check "Got participants" is equal to "Participants limit";
  generate new Ethereum account (with geth account new) eg 0xeb5fa6cbf2aca03a0df228f2df67229e2d3bd01e and top up it with small amount of Ether (up to 0.01 Ether). Make sure this account is not related to your primary account in any way;
  enter the contract address into Deposit->To contract eg 0x401e28717a6a35a50938bc7f290f2678fc0a2816;
  enter your new Ethereum account eg 0xeb5fa6cbf2aca03a0df228f2df67229e2d3bd01e;
  enter your private key eg 24883375667666319798130594789127643442423595702572623965227685575198986951784.
  click "Withdraw" button.
- The withdraw process can take some time and big amount of gas. Withdraw process requires 1 transaction to start withdrawal, 1 transaction for each participant and 1 transaction to finish the withdrawal.
- If the withdrawal is stuck at some point you can check block explorer to see how many steps left and click "Withdraw Step" button to advance withdrawal further.
- If all steps are here but the Finalize transaction is missing you can click "Withdraw Finalize" to finish the withdrawal.
- New mixing contract can be created from any account. You only need to set participants limit and payment from each participant, unlock your account and click "Create" button.