"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pnpmSync = void 0;
const json5_1 = __importDefault(require("json5"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_core_library_1 = require("@rushstack/node-core-library");
const package_extractor_1 = require("@rushstack/package-extractor");
async function pnpmSync() {
    //we assume .pnpm-sync.json is always under node_modules folder
    const pnpmSyncJsonPath = 'node_modules/.pnpm-sync.json';
    if (!node_core_library_1.FileSystem.exists(pnpmSyncJsonPath)) {
        //TO DO, what shall we do if .pnpm-sync.json is not exist
        return;
    }
    //read the .pnpm-sync.json
    const pnpmSyncJson = json5_1.default.parse(node_core_library_1.FileSystem.readFile(pnpmSyncJsonPath).toString());
    const { sourceFolder, targetFolders } = pnpmSyncJson.postbuildInjectedCopy;
    const sourcePath = path_1.default.resolve(pnpmSyncJsonPath, sourceFolder);
    //get npmPackFiles
    const npmPackFiles = await package_extractor_1.PackageExtractor.getPackageIncludedFilesAsync(sourcePath);
    //clear the destination folder first
    for (const targetFolder of targetFolders) {
        const destinationPath = path_1.default.resolve(pnpmSyncJsonPath, targetFolder.folderPath);
        await node_core_library_1.FileSystem.deleteFolderAsync(destinationPath);
    }
    ;
    await node_core_library_1.Async.forEachAsync(npmPackFiles, async (npmPackFile) => {
        for (const targetFolder of targetFolders) {
            const destinationPath = path_1.default.resolve(pnpmSyncJsonPath, targetFolder.folderPath);
            const copySourcePath = path_1.default.join(sourcePath, npmPackFile);
            const copyDestinationPath = path_1.default.join(destinationPath, npmPackFile);
            await node_core_library_1.FileSystem.ensureFolderAsync(path_1.default.dirname(copyDestinationPath));
            // create a hard link to the destination path
            await fs_1.default.promises.link(copySourcePath, copyDestinationPath);
        }
    }, {
        concurrency: 10
    });
}
exports.pnpmSync = pnpmSync;
