const fs = require("fs");
const path = require("path");
const http = require("http");

const files = fs.readdirSync("/app/uploads").filter(f => f.endsWith(".pdf"));
if (!files.length) { console.log("No PDFs found"); process.exit(1); }

const filePath = path.join("/app/uploads", files[0]);
const fileData = fs.readFileSync(filePath);
const boundary = "boundary123456";

const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
  fileData,
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);

const req = http.request({
  hostname: "localhost", port: 4000, path: "/api/cv/upload",
  method: "POST",
  headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
  timeout: 60000,
}, res => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => console.log("Status:", res.statusCode, "\nBody:", data));
});
req.on("error", e => console.log("Error:", e.message));
req.write(body);
req.end();
