import http from "node:http";
import { LOCAL_SERVER } from "./server-config";

const SERVER = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Access-Control-Expose-Headers", "X-Response-Time");
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("X-Response-Time", Date.now());
    res.end("Hello World\n");
});

SERVER.listen(LOCAL_SERVER.port, () => {
    console.log(`Local server running at http://localhost:${LOCAL_SERVER.port.toString()}/`);
});
