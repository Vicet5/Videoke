import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const setupDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(setupDirectory, "..");
const [nodeMajorVersion, nodeMinorVersion, nodePatchVersion] = process.versions.node
  .split(".")
  .map(Number);
const hasSupportedNodeVersion =
  nodeMajorVersion === 24 &&
  (nodeMinorVersion > 22 || (nodeMinorVersion === 22 && nodePatchVersion >= 2));

if (!hasSupportedNodeVersion) {
  console.error(
    `Este projeto requer Node.js 24.22.2 ou superior na linha 24. ` +
      `Versão detectada: ${process.versions.node}. ` +
      "Instale uma versão compatível e execute o setup novamente.",
  );
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectDirectory,
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`O comando ${command} terminou com código ${result.status}.`);
  }
}

try {
  console.log("Instalando dependências do projeto...");
  run("npm", ["ci"]);

  const extensionsFile = path.join(projectDirectory, ".vscode", "extensions.json");
  const extensionsConfig = JSON.parse(await readFile(extensionsFile, "utf8"));
  const extensions = extensionsConfig.recommendations ?? [];

  console.log("Instalando extensões recomendadas do VS Code...");
  for (const extension of extensions) {
    if (process.platform === "win32") {
      run("cmd.exe", ["/d", "/s", "/c", `code --install-extension ${extension}`]);
    } else {
      run("code", ["--install-extension", extension]);
    }
  }

  console.log("Ambiente do Videokê configurado.");
} catch (error) {
  console.error(`Falha ao configurar o ambiente: ${error.message}`);
  console.error("Verifique se npm e a CLI do VS Code (code) estão disponíveis no PATH.");
  process.exit(1);
}
