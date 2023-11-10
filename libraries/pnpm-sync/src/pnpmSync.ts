import { PnpmSyncCliArgs } from './interfaces';
import { pnpmSyncCopy } from './pnpmSyncCopy';
import { pnpmSyncPrepare } from './pnpmSyncPrepare';

export async function pnpmSync(args: PnpmSyncCliArgs): Promise<void> {
  const { prepare } = args;
  if (prepare) {
    pnpmSyncPrepare();
  } else {
    pnpmSyncCopy()
  }
}
