/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS executable entry point. */
const {createECDH}=require('node:crypto');const ecdh=createECDH('prime256v1');ecdh.generateKeys();console.log('VAPID_PUBLIC_KEY='+ecdh.getPublicKey().toString('base64url')+'\nVAPID_PRIVATE_KEY='+ecdh.getPrivateKey().toString('base64url')+'\nVAPID_SUBJECT=mailto:VNESI-SVOJ-EMAIL');
