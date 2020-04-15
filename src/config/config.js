const KYCTEZOS = 'KYCTEZOS'
const TZLIBRE = 'TZLIBRE'

export default {
  tzlTokenAddress: '0x6B91BC206eED0a8474F071339D1FD7eD7156f856',
  tzlibreBaseApi: 'https://www.tzlibre.io/api/v1',
  tzLibreAddress: 'tz1iDu3tHhf7H4jyXk6rGV4FNUsMqQmRkwLp',
  bankAddress: 'KT1SL6CGhjPUyLypDbFv9bXsNF2sHG7Fy3j9',

  // libre-escrow
  eth_escrow_address: '0x5B4FcdbdE01C6BB14Faaaa45C49740ef95bCBdB3',
  tzl_escrow_address: 'KT1TMZPtAdrGEdcJsY2Jw7S4tFiLLHhCCdac',

  minBalanceWarning: 100,
  KYCTEZOS,
  TZLIBRE,
  tzlibre: {
    rpc: 'https://rpc.betanet.tzlibre.io',
    apiExplorer: 'https://api-explorer.betanet.tzlibre.io',
    explorer: 'https://explorer.betanet.tzlibre.io'
  },
  protos: {
    'PtCJ7pwoxe8JasnHY8YonnLYjcVHmhiARPJvqcC6VfHT5s8k8sY': 'Betanet',
    'PsYLVpVvgbLhAhoqAkMFUo6gudkJ9weNXhUYCiLDzcUpFpkk8Wt': 'Mainnet'
  },
  OTCAddress: 'tz1iDu3tHhf7H4jyXk6rGV4FNUsMqQmRkwLp',
  bankFee: 30000,
  bankGasLimit: 250000,
  bankStorageLimit: 277,

  originFee: 1285,
  originGasLimit: 10000,
  originStorageLimit: 257,

  txFee: 1283,
  txGasLimit: 10300,
  txStorageLimit: 0
}
