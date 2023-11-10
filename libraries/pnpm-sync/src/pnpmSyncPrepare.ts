
import JSON5 from 'json5';
import { FileSystem, Async } from '@rushstack/node-core-library';
import { ALL_APP, PnpmSyncJson } from './interfaces';
import { RushConfiguration } from '@microsoft/rush-lib';
import { readWantedLockfile } from '@pnpm/lockfile-file';
import path from 'path';

export async function pnpmSyncPrepare(): Promise<void> {
  console.log('Generate pnpm-sync.json ...')

  //get the pnpm-lock.yaml path
  const appName = getAppName();
  const pnpmLockFolder = getPnpmLockFolder(appName);
  if (!FileSystem.exists(`${pnpmLockFolder}/pnpm-lock.yaml`)) {
    // TODO, need to handle the situation where pnpm-lock.yaml is not exist.
    return;
  }
  //read the pnpm-lock.yaml
  const pnpmLockfile = await readWantedLockfile(pnpmLockFolder, {ignoreIncompatible: true});

  //generate injected app set
  const injectedDependencyToFilePath: Map<string, Set<string>> = new Map();

  for (const importerKey in pnpmLockfile?.importers) {

    // we want to build the pnpm-sync.json for the app is installing
    if (appName === ALL_APP || importerKey.endsWith (`/${appName}`)) {
      processDependencies (pnpmLockfile?.importers[importerKey]?.dependencies, injectedDependencyToFilePath);
      processDependencies (pnpmLockfile?.importers[importerKey]?.devDependencies, injectedDependencyToFilePath);
    }
  }

  //now, based on the injected dependency we found, generate the pnpm-sync.json
  const rushConfiguration = RushConfiguration.loadFromDefaultLocation({
    startingFolder: process.cwd()
  });
  
  for (const project of rushConfiguration.projects) {
    const { packageName, projectFolder } = project;
    if (injectedDependencyToFilePath.has(packageName)) {
      generatePnpmSyncJson(projectFolder, injectedDependencyToFilePath.get(packageName))
    }
  }
}

function generatePnpmSyncJson (projectFolder: string, targetFolders: Set <string> | undefined) {
  if (targetFolders === undefined) {
    return;
  }

  const pnpmSyncJsonPath = `${projectFolder}/node_modules/.pnpm-sync.json`;

  let pnpmSyncJsonFile: PnpmSyncJson = {
    postbuildInjectedCopy: {
      sourceFolder: '../..',
      targetFolders: []
    }
  }

  //if .pnpm-sync.json already exists, read it first
  if (FileSystem.exists(pnpmSyncJsonPath)) {
    pnpmSyncJsonFile = JSON.parse(FileSystem.readFile(pnpmSyncJsonPath).toString());
  }

  const existingTargetFolderSet: Set<string> = new Set();

  for (const targetFolder of pnpmSyncJsonFile.postbuildInjectedCopy.targetFolders) {
    existingTargetFolderSet.add(targetFolder.folderPath);
  }

  for (const targetFolder of targetFolders) {
    const relativePath = path.relative(pnpmSyncJsonPath, targetFolder);
    if (!existingTargetFolderSet.has(relativePath)) {
      pnpmSyncJsonFile.postbuildInjectedCopy.targetFolders.push({
        folderPath: relativePath
      })
    }
  }
  
  // FileSystem.en(pnpmSyncJsonPath);
  FileSystem.writeFile(pnpmSyncJsonPath, JSON.stringify(pnpmSyncJsonFile, null, 2));
}

function transferFilePathToPnpmStorePath (rawFilePath: string, dependencyName: string): string {
  // this logic is heavily depends on pnpm-lock formate
  // the current logic is for pnpm v8

  // an example, file:../../libraries/lib1(react@16.0.0) -> file+..+..+libraries+lib1_react@16.9.0

  // 1. replace ':' with '+' 
  rawFilePath = rawFilePath.replaceAll(':', '+');

  // 2. replace '/' with '+' 
  rawFilePath = rawFilePath.replaceAll('/', '+');

  // 3. replace '(' with '_'
  rawFilePath = rawFilePath.replaceAll('(', '_');

  // 4. remove ')'
  rawFilePath = rawFilePath.replaceAll(')', '');

  // 5. add dependencyName
  rawFilePath = rawFilePath + `/node_modules/${dependencyName}`

  // 6. add pnpmStorePath
  const rushConfiguration = RushConfiguration.loadFromDefaultLocation({
    startingFolder: process.cwd()
  });
  let pnpmStorePath: string = rushConfiguration?.pnpmOptions?.pnpmStorePath;
  pnpmStorePath = path.resolve(pnpmStorePath, '../node_modules/.pnpm');
  
  rawFilePath = pnpmStorePath + '/' + rawFilePath;

  return rawFilePath
}

// process dependencies and devDependencies to generate injectedDependencyToFilePath
function processDependencies (dependencies: any, injectedDependencyToFilePath: Map<string, Set<string>>): void {
  if (dependencies) {
    for (const dependency in dependencies) {
      if (dependencies[dependency].startsWith('file:')){
        if (!injectedDependencyToFilePath.has(dependency)) {
          injectedDependencyToFilePath.set(dependency, new Set());
        } 
        const dependencyPnpmStorePath = transferFilePathToPnpmStorePath(dependencies[dependency], dependency);
        injectedDependencyToFilePath.get(dependency)?.add(dependencyPnpmStorePath);
      }
    }
  }
}

// detects the pnpm-sync is executed in which app
function getAppName () : string {
  const packageJsonPath = `${process.cwd()}/package.json`;
  if (!FileSystem.exists(packageJsonPath)) {
    // if no package.json found, we default it to all apps inside Monorepo
    return ALL_APP;
  }

  const packageJson = JSON5.parse(FileSystem.readFile(packageJsonPath).toString());
  return packageJson.name;
}

// here we are assume the pnpm-sync lib will be used in a rush Monorepo
function getPnpmLockFolder (appName: string) {  
  // here, let's assume we are using common workspace
  // need to refactor this when we introduce subspace to rush
  const rushConfiguration = RushConfiguration.loadFromDefaultLocation({
    startingFolder: process.cwd()
  });

  return rushConfiguration?.commonRushConfigFolder;
}
