require("dotenv").config();

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
export const INFURA_ID = process.env.REACT_APP_INFURA_KEY;
export const ALCHEMY_RINKEBY_URL = process.env.REACT_APP_ALCHEMY_RINKEBY_URL;
export const ETHERSCAN_KEY = process.env.REACT_APP_ETHERSCAN_KEY;
// BLOCKNATIVE ID FOR Notify.js:
export const BLOCKNATIVE_DAPPID = "0b58206a-f3c0-4701-a62f-73c7243e8c77";
export const FIAT_PRICE = process.env.REACT_APP_FIAT_PRICE === "NO";
export const OWNER_ADDR = process.env.REACT_APP_OWNER_ADDRESS;

export const NETWORKS = {
  localhost: {
    name: "localhost",
    color: "#666666",
    chainId: 31337,
    coin: "ETH",
    blockExplorer: "",
    rpcUrl: "http://" + window.location.hostname + ":8545",
  },
  kovan: {
    name: "kovan",
    color: "#7003DD",
    chainId: 42,
    coin: "ETH",
    rpcUrl: `https://kovan.infura.io/v3/${INFURA_ID}`,
    blockExplorer: "https://kovan.etherscan.io/",
    faucet: "https://gitter.im/kovan-testnet/faucet", // https://faucet.kovan.network/
  },
  rinkeby: {
    name: "rinkeby",
    color: "#2bbdf7",
    chainId: 4,
    coin: "ETH",
    rpcUrl: ALCHEMY_RINKEBY_URL,
    blockExplorer: "https://rinkeby.etherscan.io/",
  },
  polygon: {
    name: "Polygon",
    color: "#2bbdf7",
    chainId: 137,
    price: 1,
    gasPrice: 1000000000,
    coin: "MATIC",
    rpcUrl: "https://polygon-rpc.com/",
    faucet: "https://faucet.matic.network/",
    blockExplorer: "https://polygonscan.com/",
  },
  mumbai: {
    name: "Mumbai",
    color: "#2bbdf7",
    chainId: 80001,
    price: 1,
    gasPrice: 1000000000,
    coin: "MATIC",
    rpcUrl: "https://rpc-mumbai.maticvigil.com/",
    faucet: "https://faucet.matic.network/",
    blockExplorer: "https://mumbai.polygonscan.com/",
  },
  testnetBSC: {
    name: "Binance BSC Testnet",
    color: "#ff8b9e",
    chainId: 97,
    coin: "BNB",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com/",
    gasPrice: 20000000000,
  },
  mainnetBSC: {
    name: "Binance BSC Mainnet",
    color: "#00b0ef",
    chainId: 56,
    coin: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    blockExplorer: "https://www.bscscan.com/",
    gasPrice: 20000000000,
  },
};

export const NETWORK = chainId => {
  for (const n in NETWORKS) {
    if (NETWORKS[n].chainId === chainId) {
      return NETWORKS[n];
    }
  }
};

export const GAS_PRICE = 1050000000; // fix this for your network
