import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.resolve(__dirname, "parser.ts");
const source = readFileSync(sourcePath, "utf8");

const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: "parser.ts",
});

const moduleUrl = `data:text/javascript,${encodeURIComponent(outputText)}`;
const module = await import(moduleUrl);

const header = ["Company", "Ticker", "Currency", "Price"];
const rows = [
  ["Example Corp", "STO:EXM", "SEK", "123,45"],
  ["Other Corp", "OTR", "SEK", ""],
];

const { tickers } = module.buildTickersFromParsedCsv(header, rows);

if (tickers.length !== 2) {
  throw new Error(`Expected 2 tickers, received ${tickers.length}`);
}

if (tickers[0].symbol !== "EXM") {
  throw new Error(`Expected symbol EXM, received ${tickers[0].symbol}`);
}

if (tickers[0].price !== 123.45) {
  throw new Error(`Expected decimal comma price 123.45, received ${tickers[0].price}`);
}

if (tickers[1].price !== null) {
  throw new Error(`Expected null price for second row, received ${tickers[1].price}`);
}

console.log("Decimal comma price parsing preserved across rows.");
