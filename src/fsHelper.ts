import fs from "fs";
import fsPromises from "fs/promises";
import type { PathLike } from "fs";
import path from "path";

 

type FsFunction<T> = T extends (...args: any[]) => any ? (...args: Parameters<T>) => ReturnType<T> : never;
type FsSyncTarget = FsFunction<
    (typeof fs)[
        | "readFileSync"
        | "mkdirSync"
        | "readdirSync"
        | "readFile"
        | "watchFile"
        | "existsSync"
        | "writeFileSync"
        | "unlinkSync"
        | "stat"
        | "createReadStream"
        | "createWriteStream"
        | "rmSync"
        | "copyFileSync"
        | "openSync"
        | "fsyncSync"
        | "closeSync"
        | "renameSync"]
>;

type FsAsyncTarget = FsFunction<
    (typeof fsPromises)[
        | "readFile"
        | "stat"
        | "writeFile"
        | "copyFile"
        | "readdir"
        | "opendir"
        | "unlink"
        | "mkdir"
        | "rm"]
>;

 

export const createFsApplyHandler = (roots: string[]) => {
    const prettyRoots = `[ ${roots.map(r => path.resolve(r)).join(", ")} ]`;
    return {
        apply: (target: FsSyncTarget | FsAsyncTarget, _: any, args: any) => {
            const pathArg = args[0] as PathLike;
            switch (target.name) {
                case "fsyncSync":
                case "closeSync":
                    return (target as Function).apply(this, args);
                case "copyFileSync":
                case "copyFile":
                case "renameSync":
                    const destArg = args[1] as PathLike;
                    if (typeof pathArg !== "string" || typeof destArg !== "string")
                        throw new Error("Path/Destination must be a string");
                    if (!roots.some(root => isPathInRoot(root, pathArg)))
                        throw new Error(`Permission not granted to ${path.resolve(pathArg)}\nRoots: ${prettyRoots}`);
                    if (!roots.some(root => isPathInRoot(root, destArg)))
                        throw new Error(`Permission not granted to ${path.resolve(destArg)}\nRoots: ${prettyRoots}`);
                    return (target as Function).apply(this, args);
                default:
                    if (typeof pathArg !== "string") throw new Error("Path must be a string");
                    if (!roots.some(root => isPathInRoot(root, pathArg)))
                        throw new Error(`Permission not granted to ${path.resolve(pathArg)}\nRoots: ${prettyRoots}`);
                    return (target as Function).apply(this, args);
            }
        }
    };
};

// from https://stackoverflow.com/a/45242825
function isPathInRoot(root: string, dest: string) {
    const resolvedRoot = path.resolve(root);
    const resolvedDest = path.resolve(dest);
    const relative = path.relative(resolvedRoot, resolvedDest);
    return !relative.startsWith("..") && !path.isAbsolute(relative);
}

const fsRestricted = (roots: string[]) => {
    const applyHandler = createFsApplyHandler(roots);
   
    return {
        readFileSync: new Proxy(fs.readFileSync, applyHandler) as typeof fs.readFileSync,
        mkdirSync: new Proxy(fs.mkdirSync, applyHandler) as typeof fs.mkdirSync,
        readdirSync: new Proxy(fs.readdirSync, applyHandler) as typeof fs.readdirSync,
        watchFile: new Proxy(fs.watchFile, applyHandler) as typeof fs.watchFile,
        existsSync: new Proxy(fs.existsSync, applyHandler) as typeof fs.existsSync,
        writeFileSync: new Proxy(fs.writeFileSync, applyHandler) as typeof fs.writeFileSync,
        unlinkSync: new Proxy(fs.unlinkSync, applyHandler) as typeof fs.unlinkSync,
        statSync: new Proxy(fs.statSync, applyHandler) as FsFunction<typeof fs.statSync>,
        createReadStream: new Proxy(fs.createReadStream, applyHandler) as typeof fs.createReadStream,
        createWriteStream: new Proxy(fs.createWriteStream, applyHandler) as typeof fs.createWriteStream,
        rmSync: new Proxy(fs.rmSync, applyHandler) as typeof fs.rmSync,
        openSync: new Proxy(fs.openSync, applyHandler) as typeof fs.openSync,
        fsyncSync: new Proxy(fs.fsyncSync, applyHandler) as typeof fs.fsyncSync,
        closeSync: new Proxy(fs.closeSync, applyHandler) as typeof fs.closeSync,
        renameSync: new Proxy(fs.renameSync, applyHandler) as typeof fs.renameSync,
        /* Special case that needs to support source/destination paths */
        copyFileSync: new Proxy(fs.copyFileSync, applyHandler) as typeof fs.copyFileSync,
        readFile: new Proxy(fsPromises.readFile, applyHandler) as typeof fsPromises.readFile,
        stat: new Proxy(fsPromises.stat, applyHandler) as typeof fsPromises.stat,
        writeFile: new Proxy(fsPromises.writeFile, applyHandler) as typeof fsPromises.writeFile,
        copyFile: new Proxy(fsPromises.copyFile, applyHandler) as typeof fsPromises.copyFile,
        readdir: new Proxy(fsPromises.readdir, applyHandler) as typeof fsPromises.readdir,
        opendir: new Proxy(fsPromises.opendir, applyHandler) as typeof fsPromises.opendir,
        unlink: new Proxy(fsPromises.unlink, applyHandler) as typeof fsPromises.unlink,
        mkdir: new Proxy(fsPromises.mkdir, applyHandler) as typeof fsPromises.mkdir,
        rm: new Proxy(fsPromises.rm, applyHandler) as typeof fsPromises.rm,
        hasAccess: path => roots.some(root => isPathInRoot(root, path))
    };
};

export { fsRestricted };
