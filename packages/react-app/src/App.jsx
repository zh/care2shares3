import WalletConnectProvider from "@walletconnect/web3-provider";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { Button, DatePicker, Image, Space, Menu, Col, Row } from "antd";
import { Divider, List } from "antd";
import Moment from "react-moment";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { HashRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Faucet, Contract, Header, NetworkSelect, Ramp, ThemeSwitch } from "./components";
import { Address, AddressInput } from "./components";
import { GAS_PRICE, FIAT_PRICE, INFURA_ID, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import { useBalance, useContractLoader, useContractReader, useUserSigner, useExchangePrice } from "./hooks";

const { ethers } = require("ethers");
import moment from "moment";

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
// const targetNetwork = NETWORKS.testnetTelos;
// const targetNetwork = NETWORKS.mainnetTelos;
// const targetNetwork = NETWORKS.testnetAurora;
// const targetNetwork = NETWORKS.mainnetAurora;
// const targetNetwork = NETWORKS.bakerloo;
// const targetNetwork = NETWORKS.kaleido;

// 😬 Sorry for all the console logging
const DEBUG = false;
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
  const [toAddress, setToAddress] = useState();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [duration, setDuration] = useState(0);
  const [applicants, setApplicants] = useState([]);
  const { RangePicker } = DatePicker;

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
  const readContracts = useContractLoader(userSigner);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  let forRent = useContractReader(readContracts, "Rent", "getAllContracts");

  useEffect(() => {
    async function getApplicants() {
      if (!address || !forRent) return;
      const applicants = forRent
        .filter(fr => fr.owner === address)
        .map(async r => {
          const applicants = await readContracts["Rent"].getApplicants(r.contractId);
          return { id: r.contractId.toNumber(), applicants };
        });
      const all = await Promise.all(applicants);
      setApplicants(all.filter(a => a.applicants.length > 0));
    }
    getApplicants();
  }, [forRent]);

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

  const stateStr = state => {
    const states = ["Active", "Approved", "Confirmed", "Inactive"];
    return states[state];
  };

  const stateColor = state => {
    const states = ["#f66", "#6f6", "#aaf", "grey"];
    return states[state];
  };

  const handleDateChange = range => {
    const date1 = new Date(range[0]).getTime();
    const date2 = new Date(range[1]).getTime();
    const diffTime = moment(date2).diff(date1);
    const days = diffTime ? moment.duration(diffTime).days() : 0;
    setDuration(days);
    setStartDate(Math.floor(date1 / 1000));
    setEndDate(Math.floor(date2 / 1000));
  };

  const showTotal = price => {
    if (!duration) return;
    const total = (duration * price).toFixed(6);
    return (
      <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
        <div style={{ fontSize: 16 }}>
          {duration} nights X {price} {coinName} = {total} {coinName}
        </div>
      </div>
    );
  };

  const showApprove = id => {
    const app = applicants ? applicants.filter(a => a.id === id) : [];
    console.log("app: ", app);
    return (
      <>
        <AddressInput placeholder="Enter address" value={toAddress} onChange={setToAddress} />
        <Button
          disabled={!toAddress}
          style={{ marginTop: 8 }}
          onClick={async () => {
            tx(writeContracts["Rent"].approveContract(id, toAddress));
          }}
        >
          Approve
        </Button>
      </>
    );
  };

  const showDeposit = (id, price) => {
    const wei = parseFloat(ethers.utils.formatEther(`${price}`)).toFixed(6);
    return (
      <>
        <br />
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            tx(writeContracts["Rent"].payContract(id, { value: price }));
          }}
        >
          Pay {wei} {coinName}
        </Button>
      </>
    );
  };

  const showApply = id => {
    return (
      <>
        <br />
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            tx(writeContracts["Rent"].applyForContract(id));
          }}
        >
          Apply
        </Button>
      </>
    )
  };

  const rentProperty = (propertyId, price, image) => {
    return (
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 840, margin: "auto", marginTop: 64 }}>
        <h2>Property ID={propertyId}</h2>
        <h3>
          {price} {coinName} per night
        </h3>
        <Image width={400} height={300} src={image} />
        <br />
        <Space direction="vertical" size={12}>
          <RangePicker
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            showTimeSelect={false}
            onChange={handleDateChange}
          />
        </Space>
        <br />
        {showTotal(price)}
        <Button
          disabled={!startDate || !endDate || !duration}
          style={{ marginTop: 8 }}
          onClick={async () => {
            const wei = ethers.utils.parseEther(`${price * duration}`);
            tx(writeContracts["Rent"].addContract(startDate.toFixed(), endDate.toFixed(), propertyId, wei));
          }}
        >
          For Rent
        </Button>
        {allContracts((forRent || []).filter(r => parseInt(propertyId) === r.propertyId.toNumber()))}
      </div>
    );
  };

  const allContracts = rents => {
    return (
      <>
        <div style={{ width: 800, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
          <h3>Bookings</h3>
          <List
            bordered
            dataSource={rents}
            renderItem={item => {
              const contractId = item.contractId.toNumber();
              return (
                <List.Item
                  style={{ backgroundColor: stateColor(item.state) }}
                  key={item.owner + "_" + item.contractId.toNumber()}
                >
                  <h3>
                    #{contractId} {stateStr(item.state)}
                  </h3>
                  <span style={{ fontSize: 16 }}>
                    <Moment unix format="YYYY-MM-DD">
                      {item.startDate.toNumber()}
                    </Moment>
                  </span>
                  &nbsp;:&nbsp;
                  <span style={{ fontSize: 16 }}>
                    <Moment unix format="YYYY-MM-DD">
                      {item.endDate.toNumber()}
                    </Moment>
                  </span>
                  &nbsp;Price: <span style={{ fontSize: 16 }}>{parseFloat(ethers.utils.formatEther(item.price)).toFixed(6)}</span>
                  <br />
                  Owner: <Address address={item.owner} fontSize={16} />
                  &nbsp;Renter: <Address address={item.renter} fontSize={16} />
                  {item.state === 0 && address !== item.owner && showApply(contractId)}
                  {item.state === 0 && address === item.owner && showApprove(contractId)}
                  {item.state === 1 && address === item.renter && showDeposit(contractId, item.price)}
                </List.Item>
              );
            }}
          />
        </div>
      </>
    );
  };

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
              Owner
            </Link>
          </Menu.Item>
          <Menu.Item key="/payment">
            <Link
              onClick={() => {
                setRoute("/payment");
              }}
              to="/payment"
            >
              Payment
            </Link>
          </Menu.Item>
          <Menu.Item key="/debugrent">
            <Link
              onClick={() => {
                setRoute("/debugrent");
              }}
              to="/debugrent"
            >
              Debug Rent
            </Link>
          </Menu.Item>
          <Menu.Item key="/debugpayment">
            <Link
              onClick={() => {
                setRoute("/debugpayment");
              }}
              to="/debugpayment"
            >
              Debug Payment
            </Link>
          </Menu.Item>
        </Menu>
        <Switch>
          <Route exact path="/">
            {rentProperty("1", 0.1, "https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg")}
            {rentProperty("2", 0.2, "https://images.pexels.com/photos/32870/pexels-photo.jpg")}
          </Route>
          <Route exact path="/payment">
            Payment here
          </Route>
          <Route exact path="/debugrent">
            <Contract
              name="Rent"
              address={address}
              signer={userSigner}
              provider={localProvider}
              blockExplorer={blockExplorer}
              gasPrice={gasPrice}
              chainId={localChainId}
            />
          </Route>
          <Route path="/debugpayment">
            <Contract
              name="Payment"
              address={address}
              signer={userSigner}
              provider={localProvider}
              blockExplorer={blockExplorer}
              gasPrice={gasPrice}
              chainId={localChainId}
            />
          </Route>
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
