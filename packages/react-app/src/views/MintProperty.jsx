import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Card, Divider, Spin, Input, InputNumber, Row, Col, Typography } from "antd";

const { Text } = Typography;

export default function Mint({ address, tx, contractName, writeContracts, gasPrice }) {
  if (!address || !tx || !contractName || !writeContracts) return null;

  const history = useHistory();
  const [sending, setSending] = useState();

  const [websiteId, setWebsiteId] = useState("");

  const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const mintAsset = async id => {
    setSending(true);
    await sleep(1000);
    tx(writeContracts[contractName].safeMint(address, id));
    setSending(false);
    history.replace("/owner");
  };

  return (
    <>
      <h1 style={{ textAlign: "center", color: "#455A64" }}>Mint Property</h1>
      <Row gutter={[32, 32]} justify="center">
        <Col span="14">
          <h3 style={{ textAlign: "center", color: "#455A64" }}>Upload metadata</h3>
          <div style={{ textAlign: "left", margin: "15px" }}>
            <Card>
              <h4>cars2share website ID:</h4>
              <Input
                onChange={e => {
                  setWebsiteId(e.target.value);
                }}
                style={{ margin: "12px" }}
                placeholder="cars2share website ID"
              />
            </Card>
          </div>

          <Button
            onClick={async () => {
              await mintAsset(websiteId);
            }}
            disabled={!websiteId}
            size="large"
            shape="round"
            type="primary"
            style={{ background: "#ff7875", borderColor: "#bae7ff", margin: "32px" }}
          >
            Mint Property
          </Button>
        </Col>
      </Row>
    </>
  );
}
