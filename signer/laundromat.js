var laundromatContractAbi = [{"constant":true,"inputs":[],"name":"gotParticipants","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"uint256[]"},{"name":"_x0","type":"uint256"},{"name":"_Ix","type":"uint256"},{"name":"_Iy","type":"uint256"}],"name":"withdrawStart","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"pubkeys2","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"payment","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"pubkeys1","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"participants","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"withdrawStep","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"withdrawFinal","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_pubkey1","type":"uint256"},{"name":"_pubkey2","type":"uint256"}],"name":"deposit","outputs":[],"payable":true,"type":"function"},{"inputs":[{"name":"_participants","type":"uint256"},{"name":"_payment","type":"uint256"}],"type":"constructor"},{"payable":false,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"message","type":"string"}],"name":"LogDebug","type":"event"}];

function getStatus(address, callback) {

  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

  var laundromatContract = web3.eth.contract(laundromatContractAbi);
  var laundromatContractInstance = laundromatContract.at(address);
  try {
    var participants = parseInt(laundromatContractInstance.participants().toFixed());
    var gotParticipants = parseInt(laundromatContractInstance.gotParticipants().toFixed());
    var payment = laundromatContractInstance.payment().toFixed();
    var pubkeys = [];

    for(var i = 0; i < gotParticipants; i++) {

      var pubkey = [
        laundromatContractInstance.pubkeys1(i).toFixed(),
        laundromatContractInstance.pubkeys2(i).toFixed()];

      pubkeys.push(pubkey);
    }

    callback({result: 'ok', participants: participants, gotParticipants: gotParticipants, payment: payment, pubkeys: pubkeys, address: address});
    return;
  }
  catch (err) {
    console.log("error: " + err.message);
    callback({result: 'error', error: err.message});
    return;
  }
}

function deposit(address, myaddress, privateKey, callback) {

  getStatus(address, function(result) {

    if(result.result != 'ok') {

      callback(result);
      return;
    }

    var paymentWei = result.payment;
    var pubkeys = result.pubkeys;
    var gotParticipants = result.gotParticipants;
    var participants = result.participants;

    if(gotParticipants >= participants) {

      callback({result: 'error', error: 'No more participants available'});
      return;
    }

    var pubkey = getPublicKey(privateKey);

    //start deposit
    var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

    var laundromatContract = web3.eth.contract(laundromatContractAbi);
    var laundromatContractInstance = laundromatContract.at(address);

    try {

      var txhash = laundromatContractInstance.deposit(pubkey[0], pubkey[1],
        {from: myaddress, gas: 200000, value: paymentWei});

      callback({result: 'ok', txhash: txhash});
      return;
    } catch (err) {

      console.log("error: " + err.message);
      callback({result: 'error', error: err.message});
      return;
    }
  });
}

function withdraw(address, myaddress, privateKey, callback) {

  getStatus(address, function(result) {

    if(result.result != 'ok') {

      callback(result);
      return;
    }

    var paymentWei = result.payment;
    var pubkeys = result.pubkeys;
    var gotParticipants = result.gotParticipants;
    var participants = result.participants;

    if(gotParticipants < participants) {

      callback({result: 'error', error: ('Not enough participants: ' + gotParticipants + ' of ' + participants)});
      return;
    }

    //make signature
    var result = signring(privateKey, myAddress, pubkeys);
    if(result.result != 'ok') {

      callback(result);
      return;
    }

    //start withdraw
    var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    var laundromatContract = web3.eth.contract(laundromatContractAbi);
    var laundromatContractInstance = laundromatContract.at(address);

    try {

      var txhash = laundromatContractInstance.withdrawStart(result.signature, result.x0, result.ix, result.iy,
        {from: myaddress, gas: 1500000});
      console.log('Withdraw started');

      for(var i = 0; i < participants; i++) {

        txhash = laundromatContractInstance.withdrawStep({from: myaddress, gas: 1500000});
        console.log("Withdraw step " + i);
      }

      txhash = laundromatContractInstance.withdrawFinal({from: myaddress, gas: 1500000});

      callback({result: 'ok', txhash: txhash});
      return;
    } catch (err) {

      console.log("error: " + err.message);
      callback({result: 'error', error: err.message});
      return;
    }
  });
}

function withdrawStep(address, myaddress, callback) {

  //start withdraw
  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  var laundromatContract = web3.eth.contract(laundromatContractAbi);
  var laundromatContractInstance = laundromatContract.at(address);

  try {

    var txhash = laundromatContractInstance.withdrawStep({from: myaddress, gas: 1500000});
    console.log("Withdraw step");
    callback({result: 'ok', txhash: txhash});
    return;
  } catch (err) {

    console.log("error: " + err.message);
    callback({result: 'error', error: err.message});
    return;
  }
}

function withdrawFinal(address, myaddress, callback) {

  //start withdraw
  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  var laundromatContract = web3.eth.contract(laundromatContractAbi);
  var laundromatContractInstance = laundromatContract.at(address);

  try {

    var txhash = laundromatContractInstance.withdrawFinal({from: myaddress, gas: 1500000});
    console.log("Withdraw final");
    callback({result: 'ok', txhash: txhash});
    return;
  } catch (err) {

    console.log("error: " + err.message);
    callback({result: 'error', error: err.message});
    return;
  }
}