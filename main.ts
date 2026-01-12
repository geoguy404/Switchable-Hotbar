import { Plugin, MarkdownView, setIcon, WorkspaceLeaf } from "obsidian";

interface HotbarButton {
  id: string;
  icon: string;
  command?: string;
  insertText?: string;
  tooltip?: string;
}

interface HotbarProfile {
  id: string;
  name: string;
  buttons: HotbarButton[];
}

const HOTBAR_PROFILES: HotbarProfile[] = [
  {
    id: "default",
    name: "Write",
    buttons: [
      { id: "switch", icon: "arrow-left-right", command: "switchable-hotbar:switch-hotbar", tooltip: "switch hotbar" },
      { id: "internal-link", icon: "brackets", command: "editor:insert-wikilink", tooltip: "Internal link" },
      { id: "embed", icon: "sticky-note", command: "editor:insert-embed", tooltip: "Embed" },
      { id: "bold", icon: "bold", command: "editor:toggle-bold", tooltip: "Bold" },
      { id: "italic", icon: "italic", command: "editor:toggle-italics", tooltip: "Italic" },
      { id: "heading", icon: "heading-1", command: "editor:set-heading-1", tooltip: "Heading 1" },
      { id: "heading2", icon: "heading-2", command: "editor:set-heading-2", tooltip: "Heading 2" },
      { id: "comment", icon: "percent", command: "editor:toggle-comments", tooltip: "Comment" },
      { id: "undo", icon: "undo", command: "editor:undo", tooltip: "Undo" },
      { id: "redo", icon: "redo", command: "editor:redo", tooltip: "Redo" },
    ],
  },
  {
    id: "latex",
    name: "LaTeX",
    buttons: [
      { id: "switch", icon: "arrow-left-right", command: "switchable-hotbar:switch-hotbar", tooltip: "switch hotbar" },
      { id: "block-math", icon: "sigma", insertText: "$$\n\n$$", tooltip: "Block Math" },
      { id: "align-block", icon: "align-center", insertText: "\\begin{align}\n\n\\end{align}", tooltip: "Align Block" },
      { id: "backslash", icon: "slash", insertText: "\\\\", tooltip: "Backslash \\" },
      { id: "text", icon: "type", insertText: "\\text{}", tooltip: "\\text{}" },
      { id: "hspace", icon: "space", insertText: "\\hspace{}", tooltip: "\\hspace{}" },
      { id: "frac", icon: "divide", insertText: "\\frac{}{}", tooltip: "\\frac{}{}" },
      { id: "leftrightarrow", icon: "arrow-left-right", insertText: "\\Leftrightarrow", tooltip: "\\Leftrightarrow" },
      { id: "undo", icon: "undo", command: "editor:undo", tooltip: "Undo" },
      { id: "redo", icon: "redo", command: "editor:redo", tooltip: "Redo" },
    ],
  },
  {
    id: "list",
    name: "Lists",
    buttons: [
      { id: "switch", icon: "arrow-left-right", command: "switchable-hotbar:switch-hotbar", tooltip: "switch hotbar" },
      { id: "bullet-list", icon: "list", command: "editor:toggle-unordered-list", tooltip: "Bullet list" },
      { id: "numbered-list", icon: "list-ordered", command: "editor:toggle-ordered-list", tooltip: "Numbered list" },
      { id: "checkbox", icon: "check-square", command: "editor:toggle-task", tooltip: "Checkbox" },
      { id: "indent", icon: "indent-increase", command: "editor:indent", tooltip: "Indent" },
      { id: "undent", icon: "indent-decrease", command: "editor:outdent", tooltip: "Outdent" },
      { id: "strikethrough", icon: "strikethrough", command: "editor:toggle-strikethrough", tooltip: "strikethrough" },
      { id: "bold", icon: "bold", command: "editor:toggle-bold", tooltip: "Bold" },
      { id: "undo", icon: "undo", command: "editor:undo", tooltip: "Undo" },
      { id: "redo", icon: "redo", command: "editor:redo", tooltip: "Redo" },
    ],
  },
  {
    id: "code",
    name: "Code",
    buttons: [
      { id: "switch", icon: "arrow-left-right", command: "switchable-hotbar:switch-hotbar", tooltip: "switch hotbar" },
      { id: "toggle-code", icon: "code", command: "editor:toggle-code", tooltip: "Code inline" },
      { id: "insert-code-block", icon: "square-code", insertText: "```\n\n```", tooltip: "insert code block" },
      { id: "tab", icon: "arrow-right", insertText: "\t", tooltip: "Tab" },
      { id: "braces", icon: "braces", insertText: "{}", tooltip: "{}" },
      { id: "equal", icon: "equal", insertText: "=", tooltip: "=" },
      { id: "semicolon", icon: "dot", insertText: ";", tooltip: ";" },
      { id: "parentheses", icon: "parentheses", insertText: "()", tooltip: "()" },
      { id: "undo", icon: "undo", command: "editor:undo", tooltip: "Undo" },
      { id: "redo", icon: "redo", command: "editor:redo", tooltip: "Redo" },
    ],
  },
];


export default class SwitchableHotbarPlugin extends Plugin {
  currentProfileIndex: number = 0;
  containerEl: HTMLElement | null = null;

  async onload() {
    console.log("Switchable Hotbar Plugin loaded succesfully");

    // Command registrieren, der über Button aufgerufen wird zum Hotbar wechseln
    this.addCommand({
      id: "switch-hotbar",
      name: "switch hotbar",
      callback: () => this.switchHotbar(),
    });

    // Hotbar UI hinzufügen (untere Leiste)
    this.createHotbar();
  }

  onunload() {
    if (this.containerEl) {
      this.containerEl.remove();
      this.containerEl = null;
    }
  }

  createHotbar() {
    if (this.containerEl) return; // schon da

    // Container unten im Workspace anlegen
    this.containerEl = document.createElement("div");
    this.containerEl.addClass("switchable-hotbar-container");

    // Hotbar an Workspace anheften
    document.body.appendChild(this.containerEl);

    // Initial rendern
    this.renderHotbar();
  }

  renderHotbar() {
    if (!this.containerEl) return;

    const profile = HOTBAR_PROFILES[this.currentProfileIndex];
    this.containerEl.empty();

    const hotbarEl = document.createElement("div");
    hotbarEl.addClass("switchable-hotbar");
    hotbarEl.style.display = "flex";
    hotbarEl.style.overflowX = "auto";

    for (const btn of profile.buttons) {
      const buttonEl = document.createElement("button");
      buttonEl.addClass("switchable-hotbar-button");
      buttonEl.setAttr("aria-label", btn.tooltip || btn.id);
      buttonEl.title = btn.tooltip || btn.id;

      buttonEl.onclick = (e) => {
        e.preventDefault();
        this.onClickButton(btn);
      };

    setIcon(buttonEl, btn.icon);
    hotbarEl.appendChild(buttonEl);
    }

    this.containerEl.appendChild(hotbarEl);
  }

  onClickButton(button: HotbarButton) {
    if (button.command === "switchable-hotbar:switch-hotbar") {
      this.switchHotbar();
      return;
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editor = view.editor;

    if (button.command) {
    (this.app as any).commands.executeCommandById(button.command);
    } else if (button.insertText) {
      editor.replaceSelection(button.insertText);

      // Optional: Cursor in {} setzen, z.B. für \text{}
      if (button.insertText.includes("{}")) {
        const cursorPos = editor.getCursor();
        const posInsideBraces = {
          line: cursorPos.line,
          ch: cursorPos.ch - 1,
        };
        editor.setCursor(posInsideBraces);
      }
    }
  }

  switchHotbar() {
    this.currentProfileIndex = (this.currentProfileIndex + 1) % HOTBAR_PROFILES.length;
    this.renderHotbar();
  }
}
