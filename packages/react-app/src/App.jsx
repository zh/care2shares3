import WalletConnectProvider from "@walletconnect/web3-provider";
import { useThemeSwitcher } from "react-css-theme-switcher";
import StackGrid from "react-stack-grid";
import { Button, Card, Col, List, Menu, Row, DatePicker, Space } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { HashRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Address, Account, Contract, Faucet, Header, NetworkSelect, Ramp, ThemeSwitch, EtherInput } from "./components";
import { GAS_PRICE, FIAT_PRICE, INFURA_ID, NETWORKS, OWNER_ADDR } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useUserSigner,
  useEventListener,
  useExchangePrice,
} from "./hooks";
import { MintProperty } from "./views";
import moment from "moment";

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
  const { RangePicker } = DatePicker;
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [startBookDate, setStartBookDate] = useState();
  const [endBookDate, setEndBookDate] = useState();
  const [amount, setAmount] = useState();

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
  const rentEvents = useEventListener(readContracts, propertyName, "Booked", localProvider, 1);
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
          const booking = await readContracts[propertyName].getBooking(tokenId);
          const currentProperty = {
            id: tokenId,
            owner: address,
            websiteId,
            booking,
          };
          console.log("owner properties: ", currentProperty);
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
          const booking = await readContracts[propertyName].getBooking(idx);
          if (booking.state !== 3) {
            // do not show reserved properties
            const owner = await readContracts[propertyName].ownerOf(idx);
            const websiteId = await readContracts[propertyName].tokenURI(idx);
            const currentProperty = {
              id: idx,
              owner,
              websiteId,
              booking,
            };
            console.log("ready props: ", currentProperty);
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

  const handleDateChange = range => {
    setStartDate(range[0].format("X"));
    setEndDate(range[1].format("X"));
  };

  const OwnerNftCard = item => {
    const id = item.id.toNumber();
    const start = moment(item.booking.startDate.toNumber() * 1000).format("YYYY-MM-DD");
    const end = moment(item.booking.endDate.toNumber() * 1000).format("YYYY-MM-DD");
    const cardActions = [];
    if (item.booking.state === 3 || item.booking.state === 0) {
      cardActions.push(
        <Button
          onClick={() => {
            tx(writeContracts[propertyName].rejectBooking(id));
          }}
        >
          {item.booking.state === 3 ? "Free" : "Reject"}
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
          {item.booking.state === 3 && (
            <>
              <h3>Reserved</h3>
              <div>
                Period: {start} - {end}
              </div>
            </>
          )}
          {item.booking.state === 1 && (
            <>
              <h3>Confirmed</h3>
              <div>
                Period: {start} - {end}
              </div>
              <div>
                Price: {ethers.utils.formatEther(item.booking.price)} {coinName}
              </div>
            </>
          )}
          {item.booking.state === 2 && (
            <>
              <h3>Paid</h3>
              <div>
                Period: {start} - {end}
              </div>
              <div>
                Price: {ethers.utils.formatEther(item.booking.price)} {coinName}
              </div>
            </>
          )}
          {item.booking.state === 0 && (
            <>
              <h3>Booked</h3>
              <div>
                Period: {start} - {end}
              </div>
              <div>
                renter: <Address address={item.booking.renter} blockExplorer={blockExplorer} fontSize={16} />
              </div>
              <EtherInput
                value={amount}
                placeholder="Total price"
                onChange={value => {
                  setAmount(value);
                }}
              />
              <Button
                disabled={!amount}
                onClick={() => {
                  tx(writeContracts[propertyName].confirmBooking(id, ethers.utils.parseEther("0" + amount)));
                }}
              >
                Confirm
              </Button>
            </>
          )}
          {item.booking.state === 4 && (
            <>
              <Space direction="vertical" size={12}>
                <RangePicker onChange={handleDateChange} />
              </Space>
              <Button
                disabled={!startDate || !endDate || startDate > endDate}
                onClick={() => {
                  tx(writeContracts[propertyName].reserveProperty(id, startDate, endDate));
                }}
              >
                Reserve
              </Button>
            </>
          )}
        </Card>
      </>
    );
  };

  const handleBookDateChange = range => {
    setStartBookDate(range[0].format("X"));
    setEndBookDate(range[1].format("X"));
  };

  const NftCard = item => {
    const cardActions = [];
    const id = item.id;
    if (item.owner !== address) {
      cardActions.push(
        <div>
          owned by:
          <Address address={item.owner} blockExplorer={blockExplorer} minimized />
        </div>,
      );
      if (item.booking.state === 1) {
        // pay the booking
        cardActions.push(
          <Button
            onClick={() => {
              tx(writeContracts[propertyName].payBooking(id));
            }}
          >
            Pay
          </Button>,
        )
      }
    } else {
      cardActions.push(<div>OWN ASSET</div>);
    }
    console.log("book: ", startBookDate, endBookDate);
    const start = moment(item.booking.startDate.toNumber() * 1000).format("YYYY-MM-DD");
    const end = moment(item.booking.endDate.toNumber() * 1000).format("YYYY-MM-DD");
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
        {item.booking.state === 4 && item.owner !== address && (
          <>
            <Space direction="vertical" size={12}>
              <RangePicker onChange={handleBookDateChange} />
            </Space>
            <Button
              disabled={!startBookDate || !endBookDate || startBookDate > endBookDate}
              onClick={() => {
                tx(writeContracts[propertyName].createBooking(id, startDate, endDate));
              }}
            >
              Book
            </Button>
          </>
        )}
        {item.booking.state === 0 && (
          <>
            <h3>Booked</h3>
            <div>
              Period: {start} - {end}
            </div>
          </>
        )}
        {item.booking.state === 1 && (
          <>
            <h3>Confirmed</h3>
            <div>
              Period: {start} - {end}
            </div>
            <div>
              Price: {ethers.utils.formatEther(item.booking.price)} {coinName}
            </div>
          </>
        )}
        {item.booking.state === 2 && (
          <>
            <h3>Paid</h3>
            <div>
              Period: {start} - {end}
            </div>
            <div>
              Price: {ethers.utils.formatEther(item.booking.price)} {coinName}
            </div>
          </>
        )}
      </Card>
    );
  };

  const galleryList = [];
  for (let a in availableProperties) {
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
              Booking
            </Link>
          </Menu.Item>
          <Menu.Item key="/owner">
            <Link
              onClick={() => {
                setRoute("/owner");
              }}
              to="/owner"
            >
              Owner
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
              <StackGrid columnWidth={200} gutterWidth={32} gutterHeight={32}>
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
