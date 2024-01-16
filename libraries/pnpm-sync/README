# pnpm-sync

## Introduction

This repository shows a proof-of-concept implementation of the "pnpm-sync" command that is proposed in the Rush [Subspaces RFC #4230](https://github.com/microsoft/rushstack/issues/4230).<br>
The PNPM package manager installs "injected" dependencies by copying the build output of a local workspace project into one or more symlinked node_modules subfolders. Today PNPM performs this copying only once during the initial "pnpm install", but that is not a complete solution; the output should really be copied whenever the project is rebuilt. The proposed `pnpm-sync` command provides a way to perform this copying after a workspace project is compiled (before its consumers are compiled). The operation is optimized by precomputing the source/target folder locations and storing this information in a new file (`<your-library>/node_modules/.pnpm-sync.json`). In our implementation, `pnpm-sync --prepare` writes that JSON file, and `pnpm-sync` reads the JSON file and performs the copy.

## How to install

```
npm i pnpm-sync
```

## How to Use

TBD

