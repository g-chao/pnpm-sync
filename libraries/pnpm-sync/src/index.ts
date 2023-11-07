import { Command } from 'commander';

import { version } from '../package.json';

import { pnpmSync } from './pnpmSync';

const program = new Command();

program.version(version);

program
  .description('Execute actions defined under node_modules/.pnpm-sync.json')
  .action(pnpmSync);

program.parse();
