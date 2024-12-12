import http from "http";

const SERVER = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Access-Control-Expose-Headers", "X-Response-Time");
    res.setHeader("Content-Type", "text/html");
    res.setHeader("X-Response-Time", Date.now());
    res.end("<html>Hello World</html>");
});

export function startServer() {
    SERVER.listen(LOCAL_SERVER.port, () => {
        console.log(`Local server running at http://localhost:${LOCAL_SERVER.port.toString()}/`);
    });
}

export function stopServer() {
    SERVER.close();
}

export const LOCAL_SERVER = {
    hostname: "localhost",
    port: 8080,
    url: "localhost:8080",
};
