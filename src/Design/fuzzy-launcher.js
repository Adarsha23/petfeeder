import Fuse from "fuse.js";
import { execSync } from "child_process";
import readline from "readline";

function get(cmd) {
  return execSync(cmd, { encoding: "utf8", shell: "/bin/zsh" })
    .split("\n")
    .filter(Boolean);
}

const data = [
  ...get("print -l ${(k)commands}"),
  ...get("alias | cut -d= -f1"),
  ...get("ls /Applications | sed 's/.app//'")
].map(x => ({ name: x }));

const fuse = new Fuse(data, {
  keys: ["name"],
  threshold: 0.4
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Search: ", input => {
  const res = fuse.search(input).slice(0, 10);
  console.log(res.map(r => r.item.name));
  rl.close();
});

