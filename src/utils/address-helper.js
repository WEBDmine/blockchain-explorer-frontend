const crypto = require('crypto')

const knownAddresses = {
    "WEBD$gDNzWkHmJC3ZcB1gINt58Uspj$mV9+wDkH$": "P2PB2B Exchange",
    "WEBD$gAh+2k2qrZ1G#qJJCG+u9vG7KyE$FUoPf7$": "IndoEX Exchange",
    "WEBD$gDZwjjD7ZE5+AE+44ITr8yo5E2aXYT3mEH$": "DEV funds",
    "WEBD$gCP41xykgy6K$LyGHCVNDZ44@PTp1kGufP$": "DEV 2 funds",
    "WEBD$gDnTKoDgfy4k8f3ahDfCGG7yKQMxgdrDBr$": "Telegram Tipbot",
    "WEBD$gDx8CjURuVS+LSI91ufs@LH2QpIdSzaAxT$": "Project funds",
    "WEBD$gD5@1VU3ZiJ1siQxib#wAb4xeQTUS2zscn$": "Project funds 2",
    "WEBD$gBttMQ5kqqfPjcwqG3dLZsiyNy+Goq$2#L$": "Bitrabbit Exchange",
    "WEBD$gCMxAKX96yhmaygo@NG+vnb4cz1eYoYpMv$": "Balanel_si_Miaunel",
    "WEBD$gC+NwGALHX#9sXZjtUN++rt5t479EHIxa$$": "WWEBD Matic fund",
    "WEBD$gAoqGpIZZ@4c2kGYN1+rguUCahLLPNH2Hj$": "WWEBD ETH fund",
    "WEBD$gCrEhDsa9Wv$@x3QkNd4jbNcb5bISk8Nyv$": "WMP-ASIA",
    "WEBD$gDkPvqvpjFPd#wPL2KimDSH5+Nvh0Jg$$r$": "Timi",
    "WEBD$gDEVpp1z9QNZ+MvBjbk+Md76iWZK2WZmqn$": "WMP",
    "WEBD$gCsh0nNrsZv9VYQfe5Jn$9YMnD4hdyx62n$": "LOFT",
    "WEBD$gAtzwEJfs1ZHnT6rfNG9p++7@Qf4Af4dxn$": "CanadianStakePool",
    "WEBD$gAdwcILUb9ac5WmXHV+BLBR7eKH9@9wEXH$": "EuroPool",
    "WEBD$gBLWfWQ+9@5P6wpX+$9xnoscRJpM+Qn+$D$": "WEBD-Splashpool-USA",
    "WEBD$gCjzVHrbS$hmkZGCihyAsMbxh0Y0u50GE3$": "MOFTpool",
    "WEBD$gDs7nqgQFH9V@Fu#+5yI1VPmDHK$4KPorn$": "Reddit TipsBot"
}

module.exports = {

    knownAddresses,

    settings: {

        PRIVATE_KEY:{
            WIF:{
                VERSION_PREFIX : "80", //it is in HEX
                CHECK_SUM_LENGTH : 4, //in bytes
            },
            LENGTH : 64, //ending BASE64 HEX
        },
        PUBLIC_KEY:{
            LENGTH : 32, //ending BASE64 HEX
        },

        ADDRESS:{

            USE_BASE64 : true,

            LENGTH : 20,

            WIF:{
                LENGTH: 0,

                VERSION_PREFIX : "00", //ending BASE64 HEX
                CHECK_SUM_LENGTH : 4, //in bytes   //ending BASE64 HEX

                PREFIX_BASE64 : "584043fe", //BASE64 HEX  WEBD$
                //WEBD  584043
                //WEBD$ 584043FF

                SUFFIX_BASE64 : "FF", //ending BASE64 HEX
                //#w$ EC3F
                //%#$ 8FBF

                PREFIX_BASE58 : "00", //BASE58 HEX and it will be converted to Base64/58
                SUFFIX_BASE58 : "",
            }

        },
    },

    _encodeBase64(buffer) {

        if (!Buffer.isBuffer(buffer))
            buffer = Buffer.from(buffer);

        let result = buffer.toString('base64');

        let newStr = '';
        for (let i = 0; i < result.length; i++) {

            if (result[i] === 'O') newStr +=  '#'; else
            if (result[i] === 'l') newStr +=  '@'; else
            if (result[i] === '/') newStr +=  '$';
            else newStr += result[i];

        }

        return newStr;
    },

    _toBase(buffer){
        return this._encodeBase64(buffer);
    },

    _SHA256(bytes){

        let sha256 = crypto.createHash('sha256'); //sha256
        sha256.update(bytes);

        return sha256.digest();
    },

    _calculateChecksum(privateKeyAndVersion, showDebug){

        //add 0x80 to the front, https://en.bitcoin.it/wiki/List_of_address_prefixes

        if (!Buffer.isBuffer(privateKeyAndVersion) && typeof privateKeyAndVersion === 'string')
            privateKeyAndVersion = Buffer.from(privateKeyAndVersion, 'hex');

        let secondSHA = this._SHA256(this._SHA256(privateKeyAndVersion));
        let checksum = Buffer.alloc(this.settings.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH);
        secondSHA.copy(checksum, 0, 0, this.settings.PRIVATE_KEY.WIF.CHECK_SUM_LENGTH);

        return checksum;
    },

    _generateAddressWIF(address, showDebug, toBase = false){

        if (!Buffer.isBuffer(address) && typeof address === "string")
            address = Buffer.from(address, 'hex');

        if ( !Buffer.isBuffer(address) )
            throw {message: "invalid address"};

        let prefix = ( this.settings.ADDRESS.USE_BASE64 ? this.settings.ADDRESS.WIF.PREFIX_BASE64 : this.settings.ADDRESS.WIF.PREFIX_BASE58);
        let suffix = ( this.settings.ADDRESS.USE_BASE64 ? this.settings.ADDRESS.WIF.SUFFIX_BASE64 : this.settings.ADDRESS.WIF.SUFFIX_BASE58);

        //maybe address is already a
        if (address.length === this.settings.ADDRESS.LENGTH + this.settings.ADDRESS.WIF.CHECK_SUM_LENGTH  + this.settings.ADDRESS.WIF.VERSION_PREFIX.length/2 + prefix.length/2 + suffix.length/2)
            return (toBase ? this._toBase(address) : address);

        address = Buffer.concat ( [ Buffer.from(this.settings.ADDRESS.WIF.VERSION_PREFIX,"hex"), address ]) ; //if using testnet, would use 0x6F or 111.

        let checksum = this._calculateChecksum(address, showDebug);

        let addressWIF = Buffer.concat([
            Buffer.from( prefix , "hex"),
            address,
            checksum,
            Buffer.from( suffix, "hex")
        ]);


        return (toBase ? this._toBase(addressWIF) : addressWIF);
    },

    convertAddress(unencodedPublicKeyHash){
        return this._toBase(this._generateAddressWIF(unencodedPublicKeyHash))
    },

    displayAddress(address){

        if (knownAddresses[address])
            return knownAddresses[address]

        return address
    }

}
