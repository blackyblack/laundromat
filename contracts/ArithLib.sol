/* An elliptic curve arithmetics contract */

/* Deployment:
Owner: 0xeb5fa6cbf2aca03a0df228f2df67229e2d3bd01e
Last address: 0x600ad7b57f3e6aeee53acb8704a5ed50b60cacd6
ABI: [{"constant":true,"inputs":[{"name":"_ax","type":"uint256"},{"name":"_ay","type":"uint256"},{"name":"_az","type":"uint256"},{"name":"_bx","type":"uint256"},{"name":"_by","type":"uint256"},{"name":"_bz","type":"uint256"}],"name":"jadd","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_pub1","type":"uint256"},{"name":"_pub2","type":"uint256"}],"name":"hash_pubkey_to_pubkey","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_x","type":"uint256"},{"name":"_y_bit","type":"uint256"}],"name":"jrecover_y","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_q0","type":"uint256"},{"name":"_q1","type":"uint256"},{"name":"_q2","type":"uint256"}],"name":"jdecompose","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_ax","type":"uint256"},{"name":"_ay","type":"uint256"},{"name":"_az","type":"uint256"},{"name":"_bx","type":"uint256"},{"name":"_by","type":"uint256"},{"name":"_bz","type":"uint256"}],"name":"jsub","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_ax","type":"uint256"},{"name":"_ay","type":"uint256"},{"name":"_az","type":"uint256"}],"name":"jdouble","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_data","type":"uint256"},{"name":"_bit","type":"uint256"}],"name":"isbit","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_b","type":"uint256"},{"name":"_e","type":"uint256"},{"name":"_m","type":"uint256"}],"name":"jexp","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_bx","type":"uint256"},{"name":"_by","type":"uint256"},{"name":"_bz","type":"uint256"},{"name":"_n","type":"uint256"}],"name":"jmul","outputs":[{"name":"","type":"uint256"},{"name":"","type":"uint256"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"jtest","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"payable":false,"type":"fallback"}]
Optimized: yes
Solidity version: v0.4.4
*/

pragma solidity ^0.4.0;

contract ArithLib {

    uint constant internal P = 115792089237316195423570985008687907853269984665640564039457584007908834671663;
    uint constant internal N = 115792089237316195423570985008687907852837564279074904382605163141518161494337;
    uint constant internal M = 57896044618658097711785492504343953926634992332820282019728792003956564819968;
    uint constant internal Gx = 55066263022277343669578718895168534326250603453777594175500187360389116729240;
    uint constant internal Gy = 32670510020758816978083085130507043184471273380659243275938904335757337482424;
    
    function ArithLib() { }
    
    function jtest() constant returns (uint) {

        return(0);
    }

    function jdouble(uint _ax, uint _ay, uint _az) constant returns (uint, uint, uint) {

        if(_ay == 0) return (0, 0, 0);

        uint ysq = mulmod(_ay, _ay, P);
        uint S = mulmod(
            mulmod(4, _ax, P),
            ysq,
            P);
        uint M = mulmod(
            mulmod(3, _ax, P),
            _ax,
            P);
        uint nx = addmod(
            mulmod(M, M, P),
            P - mulmod(2, S, P),
            P);
        uint ny = addmod(
            mulmod(M, 
                addmod(S, P - nx, P),
                P),
            P - mulmod(ysq,
                mulmod(8, ysq, P),
                P),
            P);
        uint nz = mulmod(
            mulmod(2, _ay, P),
            _az,
            P);
            
        return (nx, ny, nz);
    }

    function jadd(uint _ax, uint _ay, uint _az, uint _bx, uint _by, uint _bz) constant returns (uint, uint, uint) {

        if(_ay == 0) return(_bx, _by, _bz);
        if(_by == 0) return(_ax, _ay, _az);
        
        uint u1 = mulmod(_ax, _bz, P);
        u1 = mulmod(u1, _bz, P);
        
        uint u2 = mulmod(_bx, _az, P);
        u2 = mulmod(u2, _az, P);
        
        _bx = mulmod(_ay, _bz, P);
        _bx = mulmod(_bx, _bz, P);
        _bx = mulmod(_bx, _bz, P);
        
        _by = mulmod(_by, _az, P);
        _by = mulmod(_by, _az, P);
        _by = mulmod(_by, _az, P);
        
        if(u1 == u2) {
           //s1 != s2
           if(_bx != _by) return(0, 0, 1);
           return jdouble(_ax, _ay, _az);
        }
        
        _az = mulmod(_az, _bz, P);
        _bz = addmod(u2, P - u1, P);
        _az = mulmod(_az, _bz, P);
        //_az contains nz
        //_bz contains h1

        uint h2 = mulmod(_bz, _bz, P);
        uint h3 = mulmod(_bz, h2, P);
        uint u1h2 = mulmod(u1, h2, P);
        _bz = addmod(_by, P - _bx, P);
        //_bz contains r
        
        _ax = mulmod(_bz, _bz, P);
        _ay = mulmod(2, u1h2, P);
        _ax = addmod(_ax, P - h3, P);
        _ax = addmod(_ax, P - _ay, P);
        
        _ay = addmod(u1h2, P - _ax, P);
        _ay = mulmod(_ay, _bz, P);
        h2 = mulmod(_bx, h3, P);
        _ay = addmod(_ay, P - h2, P);
        
        return(_ax, _ay, _az);
    }
    
    function jsub(uint _ax, uint _ay, uint _az, uint _bx, uint _by, uint _bz) constant returns (uint, uint, uint) {
        return jadd(_ax, _ay, _az, _bx, P - _by, _bz);
    }

    function jmul(uint _bx, uint _by, uint _bz, uint _n) constant returns (uint, uint, uint) {

        _n = _n % N;
        if(((_by == 0)) || (_n == 0)) return(0, 0, 1);

        uint ax = 0;
        uint ay = 0;
        uint az = 1;
        uint b = M;
        
        while(b > 0) {

           (ax, ay, az) = jdouble(ax, ay, az);
           if((_n & b) != 0) {
              
              if(ay == 0) {
                 (ax, ay, az) = (_bx, _by, _bz);
              } else {
                 (ax, ay, az) = jadd(ax, ay, az, _bx, _by, _bz);
              }
           }

           b = b / 2;
        }

        return (ax, ay, az);
    }
    
    function jexp(uint _b, uint _e, uint _m) constant returns (uint) {
        uint o = 1;
        uint bit = M;
        
        while (bit > 0) {
            uint bitval = 0;
            if(_e & bit > 0) bitval = 1;
            o = mulmod(mulmod(o, o, _m), _b ** bitval, _m);
            bitval = 0;
            if(_e & (bit / 2) > 0) bitval = 1;
            o = mulmod(mulmod(o, o, _m), _b ** bitval, _m);
            bitval = 0;
            if(_e & (bit / 4) > 0) bitval = 1;
            o = mulmod(mulmod(o, o, _m), _b ** bitval, _m);
            bitval = 0;
            if(_e & (bit / 8) > 0) bitval = 1;
            o = mulmod(mulmod(o, o, _m), _b ** bitval, _m);
            bit = (bit / 16);
        }
        return o;
    }
    
    function jrecover_y(uint _x, uint _y_bit) constant returns (uint) {

        uint xcubed = mulmod(mulmod(_x, _x, P), _x, P);
        uint beta = jexp(addmod(xcubed, 7, P), ((P + 1) / 4), P);
        uint y_is_positive = _y_bit ^ (beta % 2) ^ 1;
        return(beta * y_is_positive + (P - beta) * (1 - y_is_positive));
    }

    function jdecompose(uint _q0, uint _q1, uint _q2) constant returns (uint, uint) {
        uint ox = mulmod(_q0, jexp(_q2, P - 3, P), P);
        uint oy = mulmod(_q1, jexp(_q2, P - 4, P), P);
        return(ox, oy);
    }
    
    function isbit(uint _data, uint _bit) constant returns (uint) {
        return (_data / 2**(_bit % 8)) % 2;
    }

    function hash_pubkey_to_pubkey(uint _pub1, uint _pub2) constant returns (uint, uint) {
        uint x = uint(sha3(_pub1, _pub2));
        while(true) {
            uint xcubed = mulmod(mulmod(x, x, P), x, P);
            uint beta = jexp(addmod(xcubed, 7, P), ((P + 1) / 4), P);
            uint y = beta * (beta % 2) + (P - beta) * (1 - (beta % 2));
            if(addmod(xcubed, 7, P) == mulmod(y, y, P)) return(x, y);
            x = ((x + 1) % P);
        }
    }
    
    function () {
        throw;
    }
}