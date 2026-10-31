const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("installer", {
  info: () => ipcRenderer.invoke("sys:info"),
  pickDir: () => ipcRenderer.invoke("dialog:pickDir"),
  install: (options) => ipcRenderer.invoke("install:start", options),
  launch: (dir) => ipcRenderer.invoke("install:launch", dir),
  uninstall: (dir) => ipcRenderer.invoke("install:uninstall", dir),
  openUrl: (url) => ipcRenderer.invoke("open:url", url),
  minimize: () => ipcRenderer.send("win:minimize"),
  close: () => ipcRenderer.send("win:close"),
  onProgress: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("install:progress", listener);
    return () => ipcRenderer.removeListener("install:progress", listener);
  },
});
