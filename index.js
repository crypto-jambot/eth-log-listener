import { SecretUtil } from "@crypto-jambot/secret-manager-utils";
import { Web3Utils } from "@crypto-jambot/web3-utils";
import { BigQueryUtil } from "@crypto-jambot/bigquery-utils";
import amqplib from "amqplib";

const query = `SELECT pool FROM \`crypto-351521.ethereum_v2.refined_pools\``;
let counter = 1;
let set = new Set();
let map = new Map();
(async () => {
    const connection = await amqplib.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();
    const queue = "tasks";

    const addresses = (await new BigQueryUtil().query(query)).map(
        (row) => row.pool
    );
    const apiKey = await new SecretUtil().getSecretString("api-secret-key");
    const utils = new Web3Utils(apiKey);
    const eth = await utils.getEthereum({ isWebsocket: true });

    const subscription = eth.subscribe(
        "logs",
        {
            address: addresses,
            topics: [
                "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
            ],
        },
        (errors, { address, data }) => {
            channel.sendToQueue(
                queue,
                Buffer.from(
                    JSON.stringify({
                        address,
                        data,
                        timestamp: Date.now(),
                    })
                )
            );
        }
    );
})();
