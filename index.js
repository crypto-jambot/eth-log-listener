import { SecretUtil } from "@crypto-jambot/secret-manager-utils";
import { Web3Utils } from "@crypto-jambot/web3-utils";
import { BigQueryUtil } from "@crypto-jambot/bigquery-utils";
import amqplib from "amqplib";
import UniswapV2Pair from "@uniswap/v2-core/build/IUniswapV2Pair.json" assert { type: "json" };
import UniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json" assert { type: "json" };

const query = `SELECT pool FROM \`crypto-351521.ethereum_v2.refined_pools\``;
let counter = 1;
let set = new Set();
let map = new Map();
(async () => {
    const connection = await amqplib.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();
    const apiKey = await new SecretUtil().getSecretString("api-secret-key");
    const utils = new Web3Utils(apiKey);
    const eth = await utils.getEthereum({ isWebsocket: true });
    const v2SwapHash = eth.abi.encodeEventSignature(UniswapV2Pair.abi[3]);
    const v3SwapHash = eth.abi.encodeEventSignature(UniswapV3Pool.abi[9]);
    const queue = "tasks";

    const addresses = (await new BigQueryUtil().query(query)).map(
        (row) => row.pool
    );

    const subscription = eth.subscribe(
        "logs",
        {
            address: addresses,
            // topics: [[v2SwapHash, v3SwapHash]],
            topics: [v2SwapHash],
        },
        (errors, { address, data, topics }) => {
            const eventTypes = resolveEventTypes(topics[0]);
            const decodedData = eth.abi.decodeLog(
                eventTypes,
                data,
                topics.slice(1)
            );
            //Flipping value to opposite for searching mongodb for beneficial affected paths
            const ordered = !(decodedData.amount0In > 0);
            channel.sendToQueue(
                queue,
                Buffer.from(
                    JSON.stringify({
                        address,
                        ordered,
                        timestamp: Date.now(),
                    })
                )
            );
        }
    );
    function resolveEventTypes(eventHash) {
        switch (eventHash) {
            case v2SwapHash:
                return UniswapV2Pair.abi[3].inputs;
            case v3SwapHash:
                return UniswapV3Pool.abi[9].inputs;
        }
    }
})();
