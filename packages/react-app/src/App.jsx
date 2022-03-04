import WalletConnectProvider from "@walletconnect/web3-provider";
import { useThemeSwitcher } from "react-css-theme-switcher";
import StackGrid from "react-stack-grid";
import { Button, Card, Col, List, Menu, Row } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { HashRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import {
  Address,
  Account,
  Contract,
  Faucet,
  Header,
  NetworkSelect,
  Ramp,
  ThemeSwitch,
} from "./components";
import { GAS_PRICE, FIAT_PRICE, INFURA_ID, NETWORKS, OWNER_ADDR } from "./constants";
import { Transactor, formatUri } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useUserSigner,
  useEventListener,
  useExchangePrice,
} from "./hooks";
import { Events, MintProperty } from "./views";

const { ethers } = require("ethers");

/*
    Welcome to 🏗 scaffold-multi !

    Code: https://github.com/zh/scaffold-eth , Branch: multi-evm
*/

// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.localhost;
// const targetNetwork = NETWORKS.rinkeby;
// const targetNetwork = NETWORKS.polygon;
// const targetNetwork = NETWORKS.mumbai;
// const targetNetwork = NETWORKS.testnetSmartBCH;
// const targetNetwork = NETWORKS.testnetSmartBCH;
// const targetNetwork = NETWORKS.mainnetSmartBCH;
// const targetNetwork = NETWORKS.fujiAvalanche;
// const targetNetwork = NETWORKS.mainnetAvalanche;
// const targetNetwork = NETWORKS.testnetFantom;
// const targetNetwork = NETWORKS.fantomOpera;
// const targetNetwork = NETWORKS.moondev;
// const targetNetwork = NETWORKS.moonbase;
// const targetNetwork = NETWORKS.moonbeam;
// const targetNetwork = NETWORKS.moonriver;
// const targetNetwork = NETWORKS.testnetTomo;
// const targetNetwork = NETWORKS.mainnetTomo;
// const targetNetwork = NETWORKS.testnetBSC;
// const targetNetwork = NETWORKS.mainnetBSC;
// const targetNetwork = NETWORKS.bakerloo;
// const targetNetwork = NETWORKS.kaleido;

// 😬 Sorry for all the console logging
const DEBUG = false;

const propertyName = "Property";
const bookingName = "Booking";
const coinName = targetNetwork.coin || "ETH";

// 🛰 providers
// 🏠 Your local provider is usually pointed at your local blockchain
let localProviderUrl = targetNetwork.rpcUrl;
if (targetNetwork.user && targetNetwork.pass) {
  localProviderUrl = {
    url: targetNetwork.rpcUrl,
    user: targetNetwork.user,
    password: targetNetwork.pass,
  };
}
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrl);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrl);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
  },
});

function App(props) {
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price in fiat */
  const price = FIAT_PRICE ? useExchangePrice(targetNetwork) : 0;

  const gasPrice = targetNetwork.gasPrice || GAS_PRICE;
  // if (DEBUG) console.log("⛽️ Gas price:", gasPrice);
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  // const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (DEBUG && address && selectedChainId && yourLocalBalance && readContracts && writeContracts) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [address, selectedChainId, yourLocalBalance, readContracts, writeContracts]);

  const loadWeb3Modal = useCallback(async () => {
    try {
      const provider = await web3Modal.connect();
      setInjectedProvider(new ethers.providers.Web3Provider(provider));

      provider.on("chainChanged", chainId => {
        console.log(`chain changed to ${chainId}! updating providers`);
        setInjectedProvider(new ethers.providers.Web3Provider(provider));
      });

      provider.on("accountsChanged", () => {
        console.log(`account changed!`);
        setInjectedProvider(new ethers.providers.Web3Provider(provider));
      });

      // Subscribe to session disconnection
      provider.on("disconnect", (code, reason) => {
        console.log(code, reason);
        logoutOfWeb3Modal();
      });
    } catch (e) {
      console.log(`Wev3Modal error: ${e}`);
    }
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  useThemeSwitcher();

  // 📟 Listen for broadcast events
  const mintEvents = useEventListener(readContracts, propertyName, "Minted", localProvider, 1);
  const rentEvents = useEventListener(readContracts, propertyName, "Rented", localProvider, 1);
  // console.log("📟 Property Mint events: ", mintEvents);
  // console.log("📟 Property Rent events: ", rentEvents);

  const _propertyBalance = useContractReader(readContracts, propertyName, "balanceOf", [address]);
  const propertiesCount = _propertyBalance && _propertyBalance.toNumber && _propertyBalance.toNumber();
  if (DEBUG) console.log("🤗 Properties count: ", propertiesCount);
  // Loading Properties
  const [yourProperties, setYourProperties] = useState();
  useEffect(() => {
    const updateYourProperties = async () => {
      const propertiesUpdate = [];
      for (let idx = 0; idx < propertiesCount; idx++) {
        try {
          const tokenId = await readContracts[propertyName].tokenOfOwnerByIndex(address, idx);
          const websiteId = await readContracts[propertyName].tokenURI(tokenId);
          const available = await readContracts[propertyName].bookingAllowed(tokenId);
          const reserved = await readContracts[propertyName].propertyReserved(tokenId);
          const currentProperty = {
            id: tokenId,
            owner: address,
            websiteId,
            available,
            reserved,
          };
          propertiesUpdate.push(currentProperty);
        } catch (e) {
          console.log(e);
        }
      }
      setYourProperties(propertiesUpdate);
    };
    if (readContracts && readContracts[propertyName]) updateYourProperties();
  }, [address, propertiesCount, rentEvents, mintEvents]);

  const _totalSupply = useContractReader(readContracts, propertyName, "totalSupply");
  const allPropertiesCount = _totalSupply && _totalSupply.toNumber && _totalSupply.toNumber();
  const [availableProperties, setAvailableProperties] = useState();
  if (DEBUG) console.log("🤗 All Properties count: ", allPropertiesCount);
  useEffect(() => {
    const updateAvailableProperties = async () => {
      const availableUpdate = [];
      for (let idx = 1; idx <= allPropertiesCount; idx++) {
        try {
          const owner = await readContracts[propertyName].ownerOf(idx);
          const websiteId = await readContracts[propertyName].tokenURI(idx);
          const available = await readContracts[propertyName].bookingAllowed(idx);
          const reserved = await readContracts[propertyName].propertyReserved(idx);
          const currentProperty = {
            id: idx,
            owner,
            websiteId,
            available,
            reserved,
          };
          if (available) {
            availableUpdate.push(currentProperty);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setAvailableProperties(availableUpdate);
      console.log("available: ", availableUpdate);
    };
    if (readContracts && readContracts[propertyName] && allPropertiesCount > 0) updateAvailableProperties();
  }, [allPropertiesCount, rentEvents, mintEvents]);

  const OwnerNftCard = item => {
    const id = item.id.toNumber();
    const cardActions = [];
    if (item.reserved) {
      cardActions.push(
        <Button
          onClick={() => {
            tx(writeContracts[propertyName].cancelBooking(id));
          }}
        >
          Free
        </Button>,
      );
    } else {
      cardActions.push(
        <Button
          onClick={() => {
            tx(writeContracts[propertyName].toggleStatus(id));
          }}
        >
          {item.available ? "Deny " : "Allow "} booking
        </Button>,
      );
      cardActions.push(
        <Button
          onClick={() => {
            tx(writeContracts[propertyName].reserveProperty(id));
          }}
        >
          Reserve
        </Button>,
      );
    }
    return (
      <>
        <Card
          key={item.id}
          actions={cardActions}
          title={
            <div>
              <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> ID: {item.websiteId}
            </div>
          }
        >
          owner:
          <Address address={item.owner} blockExplorer={blockExplorer} fontSize={16} />
        </Card>
      </>
    );
  };

  const NftCard = item => {
    const cardActions = [];
    console.log(item.owner, address);
    if (item.owner != address) {
      cardActions.push(
        <div>
          owned by:
          <Address address={item.owner} blockExplorer={blockExplorer} minimized />
        </div>,
        <Button onClick={() => {}}>Book</Button>,
      );
    } else {
      cardActions.push(<div>OWN ASSET</div>);
    }
    return (
      <Card
        style={{ width: 200 }}
        key={item.id}
        actions={cardActions}
        title={
          <div>
            <span style={{ fontSize: props.fontSize || 16, marginRight: 8 }}>#{item.id}</span>
            ID: {item.websiteId}{" "}
          </div>
        }
      >
        <div style={{ opacity: 0.77 }}>Start Date - End date</div>
        <div style={{ padding: 3, fontWeight: "bold" }}>Price: 0.0 {coinName}</div>
      </Card>
    );
  };

  const galleryList = [];
  for (let a in availableProperties) {
    console.log("item: ", availableProperties[a]);
    galleryList.push(NftCard(availableProperties[a]));
  }

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      <NetworkSelect targetNetwork={targetNetwork} localChainId={localChainId} selectedChainId={selectedChainId} />
      <HashRouter>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              For booking
            </Link>
          </Menu.Item>
          <Menu.Item key="/owner">
            <Link
              onClick={() => {
                setRoute("/owner");
              }}
              to="/owner"
            >
              Properties
            </Link>
          </Menu.Item>
          <Menu.Item key="/mint">
            <Link
              onClick={() => {
                setRoute("/mint");
              }}
              to="/mint"
            >
              Mint
            </Link>
          </Menu.Item>
          {address && (
            <>
              <Menu.Item key="/debug">
                <Link
                  onClick={() => {
                    setRoute("/debug");
                  }}
                  to="/debug"
                >
                  Debug Property
                </Link>
              </Menu.Item>
            </>
          )}
        </Menu>
        <Switch>
          <Route exact path="/">
            <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <StackGrid columnWidth={200} gutterWidth={16} gutterHeight={16}>
                {galleryList}
              </StackGrid>
            </div>
          </Route>
          <Route path="/owner">
            <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <List
                bordered
                dataSource={yourProperties}
                renderItem={item => {
                  const id = item.id.toNumber();
                  return <List.Item key={id + "_" + item.websiteId + "_" + item.owner}>{OwnerNftCard(item)}</List.Item>;
                }}
              />
            </div>
          </Route>
          <Route path="/mint">
            <MintProperty
              address={address}
              tx={tx}
              contractName={propertyName}
              writeContracts={writeContracts}
              gasPrice={gasPrice}
            />
          </Route>
          {address && (
            <>
              <Route path="/debug">
                <Contract
                  name={propertyName}
                  address={address}
                  signer={userSigner}
                  provider={localProvider}
                  blockExplorer={blockExplorer}
                  gasPrice={gasPrice}
                  chainId={localChainId}
                />
              </Route>
            </>
          )}
        </Switch>
      </HashRouter>

      <ThemeSwitch />

      {/* 👨💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userSigner={userSigner}
          price={price}
          coin={coinName}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        {FIAT_PRICE && (
          <Row align="middle" gutter={[4, 4]}>
            <Col span={8}>
              <Ramp price={price} address={address} networks={NETWORKS} />
            </Col>
          </Row>
        )}

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet signer={userSigner} localProvider={localProvider} price={price} coin={coinName} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
