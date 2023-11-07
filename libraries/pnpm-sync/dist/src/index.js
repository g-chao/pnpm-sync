"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const package_json_1 = require("../package.json");
const pnpmSync_1 = require("./pnpmSync");
const program = new commander_1.Command();
program.version(package_json_1.version);
program
    .description('Execute actions defined under node_modules/.pnpm-sync.json')
    .action(pnpmSync_1.pnpmSync);
program.parse();
