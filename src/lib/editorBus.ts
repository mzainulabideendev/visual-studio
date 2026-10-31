// Small bridge so menu commands can drive the active Monaco editor.
type Editor = import("monaco-editor").editor.IStandaloneCodeEditor;

let editor: Editor | null = null;
let fontSize = 13.5;

function runAction(id: string) {
  editor?.getAction(id)?.run();
}

export const editorBus = {
  set(ed: Editor | null) {
    editor = ed;
  },
  has(): boolean {
    return !!editor;
  },
  focus() {
    editor?.focus();
  },
  undo() {
    editor?.trigger("menu", "undo", null);
  },
  redo() {
    editor?.trigger("menu", "redo", null);
  },
  cut() {
    editor?.trigger("menu", "editor.action.clipboardCutAction", null);
  },
  copy() {
    editor?.trigger("menu", "editor.action.clipboardCopyAction", null);
  },
  paste() {
    editor?.trigger("menu", "editor.action.clipboardPasteAction", null);
  },
  selectAll() {
    editor?.trigger("menu", "editor.action.selectAll", null);
  },
  delete() {
    editor?.trigger("menu", "deleteLeft", null);
  },
  find() {
    runAction("actions.find");
  },
  replace() {
    runAction("editor.action.startFindReplaceAction");
  },
  format() {
    runAction("editor.action.formatDocument");
  },
  comment() {
    runAction("editor.action.commentLine");
  },
  indent() {
    runAction("editor.action.indentLines");
  },
  outdent() {
    runAction("editor.action.outdentLines");
  },
  zoom(delta: number) {
    fontSize = delta === 0 ? 13.5 : Math.min(48, Math.max(6, fontSize + delta));
    editor?.updateOptions({ fontSize });
  },
};
