import { execSync } from "node:child_process";

for (const command of ["npm run test", "npm run lint", "npm run build"]) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
}
