import http from "http";
import { LOCAL_SERVER } from "./server-config";

const SERVER = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Access-Control-Expose-Headers", "X-Response-Time");
    res.setHeader("Content-Type", "text/html");
    res.setHeader("X-Response-Time", Date.now());
    res.end("<html>Hello World</html>");
});

SERVER.listen(LOCAL_SERVER.port, () => {
    console.log(`Local server running at http://localhost:${LOCAL_SERVER.port.toString()}/`);
});
