/* 
 * Copyright © 2016 Andrew "blackyblack" Lekar.
 * 
 * See the AUTHORS.txt and LICENSE.txt files at the top-level directory of
 * this distribution for the individual copyright holder information and the
 * developer policies on copyright and licensing.
 * 
 * Unless otherwise agreed in a custom licensing agreement, no part of the
 * software, including this file, may be copied, modified, propagated,
 * or distributed except according to the terms contained in the LICENSE.txt
 * file.
 * 
 * Removal or modification of this copyright notice is prohibited.
 *
*/

var web3 = new Web3();
var BigInteger = jsbn.BigInteger;

var cache = [
    '',
    ' ',
    '  ',
    '   ',
    '    ',
    '     ',
    '      ',
    '       ',
    '        ',
    '         '
];

function leftPad (str, len, ch) {
  // convert `str` to `string`
  str = str + '';
  // `len` is the `pad`'s length now
  len = len - str.length;
  // doesn't need to pad
  if (len <= 0) return str;
  // `ch` defaults to `' '`
  if (!ch && ch !== 0) ch = ' ';
  // convert `ch` to `string`
  ch = ch + '';
  // cache common use cases
  if (ch === ' ' && len < 10) return cache[len] + str;
  // `pad` starts with an empty string
  var pad = '';
  // loop
  while (true) {
    // add `ch` to `pad` if `len` is odd
    if (len & 1) pad += ch;
    // divide `len` by 2, ditch the remainder
    len >>= 1;
    // "double" the `ch` so this operation count grows logarithmically on `len`
    // each time `ch` is "doubled", the `len` would need to be "doubled" too
    // similar to finding a value in binary search tree, hence O(log(n))
    if (len) ch += ch;
    // `len` is 0, exit the loop
    else break;
  }
  // pad `str`!
  return pad + str;
}

  // the size of a character in a hex string in bytes
const HEX_CHAR_SIZE = 4

// the size to hash an integer if not explicity provided
const DEFAULT_SIZE = 256

// Encodes a value in hex and adds padding to the given size if needed. Tries to determine whether it should be encoded as a number or string. Curried args.
function encodeWithPadding(size, value) {
  return typeof value === 'string'
    // non-hex string
    ? web3.toHex(value)
    // numbers, big numbers, and hex strings
    : encodeNum(size, value)
}

// Encodes a number in hex and adds padding to the given size if needed. Curried args.
function encodeNum(size, value) {
  return leftPad(web3.toHex(value < 0 ? value >>> 0 : value).slice(2), size / HEX_CHAR_SIZE, value < 0 ? 'F' : '0')
}

// Hashes one or more arguments, using a default size for numbers.
function sha3(array) {
  var paddedArgs = '';
  for(var index = 0; index < array.length; index++) {
    paddedArgs += encodeWithPadding(DEFAULT_SIZE, array[index]);
  }
  //const paddedArgs = args.map(encodeWithPadding(DEFAULT_SIZE)).join('')
  return web3.toBigNumber(web3.sha3(paddedArgs, { encoding: 'hex' }));
}

var B = new BigInteger('7');
var P = new BigInteger('115792089237316195423570985008687907853269984665640564039457584007908834671663');
var M = new BigInteger('57896044618658097711785492504343953926634992332820282019728792003956564819968');
var N = new BigInteger('115792089237316195423570985008687907852837564279074904382605163141518161494337');
var Gx = new BigInteger('55066263022277343669578718895168534326250603453777594175500187360389116729240');
var Gy = new BigInteger('32670510020758816978083085130507043184471273380659243275938904335757337482424');

function to_jacobian(p) {
  var o = [p[0], p[1], BigInteger.ONE];
  return o;
}

function jacobian_double(p) {

  if(p[1].equals(BigInteger.ZERO)) return [BigInteger.ZERO, BigInteger.ZERO, BigInteger.ZERO];

  //ysq = (p[1] ** 2) % P
  var ysq = p[1].modPow(new BigInteger('2'), P).add(P).remainder(P);
  //S = (4 * p[0] * ysq) % P
  var S = p[0].multiply(new BigInteger('4')).multiply(ysq).remainder(P).add(P).remainder(P);
  //M = (3 * p[0] ** 2 + A * p[2] ** 4) % P
  var M = p[0].multiply(new BigInteger('3')).multiply(p[0]).remainder(P).add(P).remainder(P);
  //nx = (M**2 - 2 * S) % P
  var nx = M.multiply(M).subtract(S.multiply(new BigInteger('2'))).remainder(P).add(P).remainder(P);
  //ny = (M * (S - nx) - 8 * ysq ** 2) % P
  var ny = M.multiply(S.subtract(nx)).subtract(ysq.multiply(ysq).multiply(new BigInteger('8'))).remainder(P).add(P).remainder(P);
  //nz = (2 * p[1] * p[2]) % P
  var nz = p[1].multiply(p[2]).multiply(new BigInteger('2')).remainder(P).add(P).remainder(P);
  return [nx, ny, nz];
}

function jacobian_add(p, q) {

  if(p[1].equals(BigInteger.ZERO)) return q;
  if(q[1].equals(BigInteger.ZERO)) return p;

  //U1 = (p[0] * q[2] ** 2) % P
  var U1 = p[0].multiply(q[2]).multiply(q[2]).remainder(P).add(P).remainder(P);
  //U2 = (q[0] * p[2] ** 2) % P
  var U2 = q[0].multiply(p[2]).multiply(p[2]).remainder(P).add(P).remainder(P);
  //S1 = (p[1] * q[2] ** 3) % P
  var S1 = p[1].multiply(q[2]).multiply(q[2]).multiply(q[2]).remainder(P).add(P).remainder(P);
  //S2 = (q[1] * p[2] ** 3) % P
  var S2 = q[1].multiply(p[2]).multiply(p[2]).multiply(p[2]).remainder(P).add(P).remainder(P);

  if(U1.equals(U2)) {

    if(!S1.equals(S2)) return [BigInteger.ZERO, BigInteger.ZERO, BigInteger.ONE];
    return jacobian_double(p);
  }
    
  //H = U2 - U1
  var H = U2.subtract(U1).remainder(P).add(P).remainder(P);
  //R = S2 - S1
  var R = S2.subtract(S1).remainder(P).add(P).remainder(P);
  //H2 = (H * H) % P
  var H2 = H.multiply(H).remainder(P).add(P).remainder(P);
  //H3 = (H * H2) % P
  var H3 = H.multiply(H2).remainder(P).add(P).remainder(P);
  //U1H2 = (U1 * H2) % P
  var U1H2 = U1.multiply(H2).remainder(P).add(P).remainder(P);
  //nx = (R ** 2 - H3 - 2 * U1H2) % P
  var nx = R.multiply(R).remainder(P).add(P).remainder(P);
  nx = nx.subtract(H3).remainder(P).add(P).remainder(P);
  nx = nx.subtract(U1H2.multiply(new BigInteger('2'))).remainder(P).add(P).remainder(P);;
  //ny = (R * (U1H2 - nx) - S1 * H3) % P
  var ny = U1H2.subtract(nx).remainder(P).add(P).remainder(P);
  ny = ny.multiply(R).remainder(P).add(P).remainder(P);
  ny = ny.subtract(S1.multiply(H3)).remainder(P).add(P).remainder(P);
  //nz = (H * p[2] * q[2]) % P
  var nz = H.multiply(p[2]).multiply(q[2]).remainder(P).add(P).remainder(P);
  return [nx, ny, nz];
}

function jacobian_multiply(a, n) {

  if(a[1].equals(BigInteger.ZERO) || n.equals(BigInteger.ZERO))
    return [BigInteger.ZERO, BigInteger.ZERO, BigInteger.ONE];

  if(n.equals(BigInteger.ONE)) return a;

  n = n.remainder(N).add(N).remainder(N);

  if(n.equals(BigInteger.ZERO)) return [BigInteger.ZERO, BigInteger.ZERO, BigInteger.ONE];

  var ax = BigInteger.ZERO;
  var ay = BigInteger.ZERO;
  var az = BigInteger.ONE;
  var b = M;

  while(b.compareTo(BigInteger.ZERO) > 0) {

    a1 = jacobian_double([ax, ay, az]);
    ax = a1[0];
    ay = a1[1];
    az = a1[2];

    if(!n.and(b).equals(BigInteger.ZERO)) {
              
      if(ay.equals(BigInteger.ZERO)) {

        ax = a[0];
        ay = a[1];
        az = a[2];
      } else {

        a2 = jacobian_add([ax, ay, az], a);
        ax = a2[0];
        ay = a2[1];
        az = a2[2];
      }
    }

    b = b.divide(new BigInteger('2'));
  }

  return [ax, ay, az];
}

function hash_to_pubkey(a) {

  var x = sha3([web3.toBigNumber(a[0].toString()), web3.toBigNumber(a[1].toString())]);
  x = new BigInteger('' + x.toFixed());

  while(true) {
    //xcubedaxb = (x*x*x+A*x+B) % P
    var xcubedaxb = ((x.multiply(x.multiply(x))).add(B)).remainder(P).add(P).remainder(P);
    //beta = pow(xcubedaxb, (P+1)//4, P)
    var beta = xcubedaxb.modPow(P.add(BigInteger.ONE).divide(new BigInteger('4')), P).add(P).remainder(P);
    var y = beta;
    if(beta.remainder(new BigInteger('2')).equals(BigInteger.ZERO)) {
      y = P.subtract(beta).add(P).remainder(P);
    }

    if(xcubedaxb.subtract(y.multiply(y)).remainder(P).equals(BigInteger.ZERO)) {
      return [x, y];
    }

    x = x.add(BigInteger.ONE).remainder(P).add(P).remainder(P);
  }
}

function jdecompose(Q) {

  //uint ox = mulmod(_q0, jexp(_q2, P - 3, P), P);
  var ox = Q[2].modPow(P.subtract(new BigInteger('3')), P).multiply(Q[0]).remainder(P).add(P).remainder(P);
  //uint oy = mulmod(_q1, jexp(_q2, P - 4, P), P);
  var oy = Q[2].modPow(P.subtract(new BigInteger('4')), P).multiply(Q[1]).remainder(P).add(P).remainder(P);
  return [ox, oy];
}

function random_key() {

  var rng = new jsbn.SecureRandom();

  var ba = new Array();
  for(var i = 0; i < 32; i++) {
    ba.push(0);
  }

  rng.nextBytes(ba);
  return (new BigInteger(ba)).remainder(N).add(N).remainder(N);
}

function createBigInteger(value) {
  return new BigInteger(web3.toBigNumber(value).toFixed());
}

function getPublicKey(privateKey) {

  var privkey = createBigInteger(privateKey);
  var jpubkey = jacobian_multiply([Gx, Gy, BigInteger.ONE], privkey);
  var mypubkey = jdecompose(jpubkey);
  return [mypubkey[0].toString(), mypubkey[1].toString()];
}

function signring(privateKey, myaddress, publicKeys) {
 
  var privkey = createBigInteger(privateKey);
  var myindex = -1;
  var pubkeys = [];
  var participants = 0;

  var jpubkey = jacobian_multiply([Gx, Gy, BigInteger.ONE], privkey);
  var mypubkey = jdecompose(jpubkey);
  console.log("My public key: " + mypubkey.toString());

  participants = publicKeys.length;
  for(var i = 0; i < participants; i++) {

    var pubx = createBigInteger(publicKeys[i][0]);
    var puby = createBigInteger(publicKeys[i][1]);
    pubkeys.push([pubx, puby]);
    console.log("Participant public key: " + [pubx, puby].toString());

    if(mypubkey[0].equals(pubx) && mypubkey[1].equals(puby)) {

      myindex = i;
    }
  }

  if(myindex < 0) {

    return {result: 'error', error: 'Not found myself in participants'};
  }

  var msghash = createBigInteger(myaddress);

  //I = multiply(hash_to_pubkey(my_pub), mypriv)
  var I = jdecompose(jacobian_multiply(to_jacobian(hash_to_pubkey(mypubkey)), privkey));

  //random key
  var k = random_key();

  //empty ring
  var e = [];
  for(var i = 0; i < participants; i++) {
    e.push([BigInteger.ZERO, BigInteger.ZERO]);
  }

  var kpub = jdecompose(jacobian_multiply([Gx, Gy, BigInteger.ONE], k));

  //kmulpub =  multiply(hash_to_pubkey(my_pub), k)
  var kmulpub = jdecompose(jacobian_multiply(to_jacobian(hash_to_pubkey(pubkeys[myindex])), k));

  //hash together [msghash, kpub[0], kpub[1], kmulpub[0], kmulpub[1]]
  var orig_left = sha3([
    web3.toBigNumber(msghash.toString()),
    web3.toBigNumber(kpub[0].toString()),
    web3.toBigNumber(kpub[1].toString()),
    web3.toBigNumber(kmulpub[0].toString()),
    web3.toBigNumber(kmulpub[1].toString())]);

  var orig_right = sha3([orig_left]);

  e[myindex] = [
    new BigInteger('' + orig_left.toFixed()),
    new BigInteger('' + orig_right.toFixed())];

  var signature = [];
  var left = BigInteger.ZERO;
  var right = BigInteger.ZERO;
  for(var i = 0; i < participants; i++) {

    var prev_i = (i + myindex) % pubkeys.length;
    var cur_i = (i + myindex + 1) % pubkeys.length;

    if(cur_i == myindex) {

      var s0 = e[prev_i][1].multiply(privkey).add(k).remainder(N).add(N).remainder(N);
      signature[prev_i] = s0;
    } else {

      //random key
      var s0 = random_key();
      signature[prev_i] = s0;
    }

    //pub1 = b.subtract_pubkeys(b.privtopub(s[prev_i]),
    //                            b.multiply(pubs[i], e[prev_i]["right"]))
    var pubx = jdecompose(jacobian_multiply([Gx, Gy, BigInteger.ONE], signature[prev_i]));

    var jmul1 = jacobian_multiply(to_jacobian(pubkeys[cur_i]), e[prev_i][1]);
    jmul1[1] = P.subtract(jmul1[1]);

    var pub1 = jdecompose(jacobian_add(to_jacobian(pubx), jmul1));

    var kmulpub1 = jacobian_multiply(to_jacobian(hash_to_pubkey(pubkeys[cur_i])), signature[prev_i]);

    var Imul1 = jacobian_multiply(to_jacobian(I), e[prev_i][1]);
    Imul1[1] = P.subtract(Imul1[1]);

    var pub2 = jdecompose(jacobian_add(kmulpub1, Imul1));

    //hash together [msghash, kpub[0], kpub[1], kmulpub[0], kmulpub[1]]
    left = sha3([
      web3.toBigNumber(msghash.toString()),
      web3.toBigNumber(pub1[0].toString()),
      web3.toBigNumber(pub1[1].toString()),
      web3.toBigNumber(pub2[0].toString()),
      web3.toBigNumber(pub2[1].toString())]);

    right = sha3([left]);

    e[cur_i] = [
      new BigInteger('' + left.toFixed()),
      new BigInteger('' + right.toFixed())];
  }

  if(!left.equals(orig_left)) {
    return {result: 'error', error: 'Signature failed'};
  }

  if(!right.equals(orig_right)) {
    return {result: 'error', error: 'Signature failed'};
  }

  var signStr = [];
  for(var i = 0; i < signature.length; i++) {

    signStr.push(signature[i].toString());
  }

  return {result: 'ok', ix: I[0].toString(), iy: I[1].toString(), x0: e[0][0].toString(), signature: signStr};
}

function verifyring(signature, x0, Ix, Iy, myaddress, publicKeys) {
 
  var pubkeys = [];
  var participants = 0;

  participants = publicKeys.length;
  for(var i = 0; i < participants; i++) {

    var pubx = createBigInteger(publicKeys[i][0]);
    var puby = createBigInteger(publicKeys[i][1]);
    pubkeys.push([pubx, puby]);
  }

  var s = []
  for(var i = 0; i < participants; i++) {

    s.push(createBigInteger(signature[i]));
  }

  var I = [createBigInteger(Ix), createBigInteger(Iy)];

  var msghash = createBigInteger(myaddress);

  //empty ring
  var e = [];

  var left = web3.toBigNumber(x0);
  var right = sha3([left]);
  e.push([new BigInteger('' + left.toFixed()), new BigInteger('' + right.toFixed())]);

  var i = 1;

  while(i < (participants + 1)) {

    var prev_i = (i - 1) % participants;

    var kmulpub1 = jacobian_multiply([Gx, Gy, BigInteger.ONE], s[prev_i]);
    var jmul1 = jacobian_multiply(to_jacobian(pubkeys[i % participants]), e[prev_i][1]);
    jmul1[1] = P.subtract(jmul1[1]);

    var pub1 = jdecompose(jacobian_add(kmulpub1, jmul1));

    var kmulpub2 = jacobian_multiply(to_jacobian(hash_to_pubkey(pubkeys[i % participants])), s[prev_i]);
    var Imul1 = jacobian_multiply(to_jacobian(I), e[prev_i][1]);
    Imul1[1] = P.subtract(Imul1[1]);

    var pub2 = jdecompose(jacobian_add(kmulpub2, Imul1));

    //hash together [msghash, kpub[0], kpub[1], kmulpub[0], kmulpub[1]]
    left = sha3([
      web3.toBigNumber(msghash.toString()),
      web3.toBigNumber(pub1[0].toString()),
      web3.toBigNumber(pub1[1].toString()),
      web3.toBigNumber(pub2[0].toString()),
      web3.toBigNumber(pub2[1].toString())]);

    right = sha3([left]);

    e[i] = [
      new BigInteger('' + left.toFixed()),
      new BigInteger('' + right.toFixed())];

    i++;
  }

  if(!e[participants][0].equals(e[0][0])) {
    return {result: 'error', error: 'Signature failed'};
  }

  if(!e[participants][1].equals(e[0][1])) {
    return {result: 'error', error: 'Signature failed'};
  }

  return {result: 'ok'};
}