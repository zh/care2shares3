import { Button, Card } from "antd";
import "antd/dist/antd.css";
import { ethers } from "ethers";
import { React, useState } from "react";
import { Address, AddressInput, EtherInput } from "../components";
import { formatUri } from "../helpers";

// added display of 0 instead of NaN if gas price is not provided

/*
  ~ What it does? ~

  Displays ERC-721 (NFT) token

  ~ How can I use? ~

  <OwnerNftCard
    item={item}
    address={address}
    tx={tx}
    contractName={contractName}
    writeContracts={writeContracts}
    blockExplorer={blockExplorer}
    gasPrice={gasPrice}
    coin={coin}
    fontSize={fontSize}
  />

  ~ Features ~

  - Provide address={address} current address
  - Provide coin={coin} blockchain main coin name - ETH, BCH, FTM etc.
*/

export default function OwnerNftCard(props) {
  const item = props.item;
  const id = item.id.toNumber();

  const cardActions = [
    <Button
      onClick={() => {
        props.tx(props.writeContracts[props.contractName].bookingAllowed(id, !item.forRent));
      }}
    >
      {item.forRent ? "Enable" : "Disable"} Booking
    </Button>,
  ];

  return (
    <>
      <Card
        key={item.id}
        actions={cardActions}
        title={
          <div>
            <span style={{ fontSize: props.fontSize || 16, marginRight: 8 }}>#{id}</span> {item.name}
          </div>
        }
      >
        <div>
          <img src={formatUri(item.image)} style={{ maxWidth: 150 }} alt="" />
        </div>
      </Card>

      <ul>
        <li>
          owner:
          <Address address={item.owner} blockExplorer={props.blockExplorer} fontSize={props.fontSize || 16} />
        </li>
        <li>description: {item.description}</li>
      </ul>
    </>
  );
}
