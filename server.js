import amqplib from "amqplib";
import pg from "pg";

(async () => {
    const queue = "tasks";
    const client = new pg.Client({
        user: "jam",
        password: "e68870cf-82a5-4698-a421-832004c12f63",
    });
    await client.connect();
    // const result = await client.query(`CREATE TABLE paths (
    //     token_paths TOKEN_PATH[]
    // )
    // `);
    // const result = await client.query(`CREATE TABLE paths2 (
    //     token_path TOKEN_PATH[]
    // )`);
    // const result = await client.query(
    //     `INSERT INTO paths2 VALUES
    //     (

    //             ARRAY[

    //                     ROW('Tether', 'USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6),
    //                     ROW('Wrapped Ether', 'WETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18)

    //             ]::TOKEN_PATH[]

    //     )`
    // );
    const result = await client.query(`SELECT *  FROM paths2`);
    console.log(result);
    const connection = await amqplib.connect("amqp://localhost");
    const channel = await connection.createChannel();
    channel.assertQueue(queue);
    const map = new Map();
    let count = 0;

    // setInterval(() => {
    //     console.clear();
    //     console.log(`Messages recieved: ${count}`);
    //     console.log(map.size);
    //     // map.forEach((value, key) => {
    //     //     console.log(key);
    //     // });
    // }, 1000);

    // channel.consume(queue, (message) => {
    //     if (!!message) {
    //         count++;
    //         const { address, data, timestamp } = JSON.parse(
    //             message.content.toString()
    //         );
    //         //If is in cache
    //         map.set(address, data);
    //         channel.ack(message);
    //         return;
    //     }
    //     console.log("Consumer cancelled by server");
    // });
})();
