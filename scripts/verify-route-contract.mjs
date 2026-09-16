import fs from "node:fs";
const app = fs.readFileSync("src/App.tsx", "utf8");
const root = app.match(/<Route path="\/" element=\{<([A-Za-z]+) \/>\} \/>/);
if (!root || root[1] !== "Index") throw new Error("root must render the public Index");
if (!/<Route\s+path="\/dashboard\/\*"[\s\S]*?<ProtectedRoute>[\s\S]*?<MaxxChat \/>/.test(app)) throw new Error("dashboard must keep MAXX chat protected");
if (!/<Route path="\/signin" element=\{<SignIn \/>\} \/>/.test(app)) throw new Error("signin route missing");
console.log("route contract ok: public /, protected /dashboard/*");
