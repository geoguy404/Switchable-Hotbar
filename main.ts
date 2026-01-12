import { Plugin, MarkdownView, WorkspaceLeaf } from "obsidian";

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
      { id: "switch", icon: "OcArrowSwitch16", command: "switchable-hotbar:switch-hotbar", tooltip: "Hotbar wechseln" },
      { id: "internal-link", icon: "LiBrackets", command: "editor:insert-wikilink", tooltip: "Interner Link" },
      { id: "embed", icon: "LiStickyNote", command: "editor:insert-embed", tooltip: "Embed einfügen" },
      { id: "bold", icon: "LiBold", command: "editor:toggle-bold", tooltip: "Fett" },
      { id: "italic", icon: "LiItalic", command: "editor:toggle-italics", tooltip: "Kursiv" },
      { id: "heading", icon: "LiHeading", command: "editor:set-heading-1", tooltip: "Überschrift" },
      { id: "heading2", icon: "LiHeading2", command: "editor:set-heading-2", tooltip: "Überschrift 2" },
      { id: "comment", icon: "LiPercent", command: "editor:toggle-comments", tooltip: "Kommentar" },
      { id: "undo", icon: "LiUndo2", command: "editor:undo", tooltip: "Rückgängig" },
      { id: "redo", icon: "LiRedo2", command: "editor:redo", tooltip: "Wiederholen" },
    ],
  },
  {
    id: "latex",
    name: "LaTeX",
    buttons: [
      { id: "switch", icon: "OcArrowSwitch16", command: "switchable-hotbar:switch-hotbar", tooltip: "Hotbar wechseln" },
      { id: "block-math", icon: "LiSigma", insertText: "$$\n\n$$", tooltip: "Block Math" },
      { id: "align-block", icon: "LiAlignCenter", insertText: "\\begin{align}\n\n\\end{align}", tooltip: "Align Block" },
      { id: "backslash", icon: "TiBackslash", insertText: "\\\\", tooltip: "Backslash \\" },
      { id: "text", icon: "LiLetterText", insertText: "\\text{}", tooltip: "\\text{}" },
      { id: "hspace", icon: "LiSpace", insertText: "\\hspace{}", tooltip: "\\hspace{}" },
      { id: "frac", icon: "TiMathXDivideY", insertText: "\\frac{}{}", tooltip: "\\frac{}{}" },
      { id: "leftrightarrow", icon: "LiMoveHorizontal", insertText: "\\Leftrightarrow", tooltip: "\\Leftrightarrow" },
      { id: "undo", icon: "LiUndo2", command: "editor:undo", tooltip: "Rückgängig" },
      { id: "redo", icon: "LiRedo2", command: "editor:redo", tooltip: "Wiederholen" },
    ],
  },
  {
    id: "list",
    name: "Lists",
    buttons: [
      { id: "switch", icon: "OcArrowSwitch16", command: "switchable-hotbar:switch-hotbar", tooltip: "Hotbar wechseln" },
      { id: "bullet-list", icon: "LiList", command: "editor:toggle-unordered-list", tooltip: "Aufzählung" },
      { id: "numbered-list", icon: "TiListNumbers", command: "editor:toggle-ordered-list", tooltip: "Nummerierte Liste" },
      { id: "checkbox", icon: "LiCheckSquare", command: "editor:toggle-task", tooltip: "Checkbox" },
      { id: "indent", icon: "LiIndentIncrease", command: "editor:indent", tooltip: "Einrücken" },
      { id: "undent", icon: "LiIndentDecrease", command: "editor:outdent", tooltip: "Ausrücken" },
      { id: "strikethrough", icon: "LiStrikethrough", command: "editor:toggle-strikethrough", tooltip: "Durchgestrichen" },
      { id: "bold", icon: "LiBold", command: "editor:toggle-bold", tooltip: "Fett" },
      { id: "undo", icon: "LiUndo2", command: "editor:undo", tooltip: "Rückgängig" },
      { id: "redo", icon: "LiRedo2", command: "editor:redo", tooltip: "Wiederholen" },
    ],
  },
  {
    id: "code",
    name: "Code",
    buttons: [
      { id: "switch", icon: "OcArrowSwitch16", command: "switchable-hotbar:switch-hotbar", tooltip: "Hotbar wechseln" },
      { id: "toggle-code", icon: "LiCode", command: "editor:toggle-code", tooltip: "Code inline" },
      { id: "insert-code-block", icon: "LiCodeSquare", insertText: "```\n\n```", tooltip: "Codeblock einfügen" },
      { id: "tab", icon: "LiArrowBigRight", insertText: "\t", tooltip: "Tab" },
      { id: "braces", icon: "LiBraces", insertText: "{}", tooltip: "{}" },
      { id: "equal", icon: "LiEqual", insertText: "=", tooltip: "=" },
      { id: "semicolon", icon: "semicolon", insertText: ";", tooltip: ";" },
      { id: "parentheses", icon: "LiParentheses", insertText: "()", tooltip: "()" },
      { id: "undo", icon: "LiUndo2", command: "editor:undo", tooltip: "Rückgängig" },
      { id: "redo", icon: "LiRedo2", command: "editor:redo", tooltip: "Wiederholen" },
    ],
  },
];

export default class SwitchableHotbarPlugin extends Plugin {
  currentProfileIndex: number = 0;
  containerEl: HTMLElement | null = null;

  async onload() {
    console.log("SwitchableHotbar Plugin loaded succesfully");

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

      // Icon setzen
      const iconEl = document.createElement("i");
      iconEl.addClass("switchable-hotbar-icon");
      // Icon mit Obsidian-Iconfont, hier als data-icon-Name
      iconEl.setAttr("data-icon", btn.icon);
      buttonEl.appendChild(iconEl);

      buttonEl.onclick = (e) => {
        e.preventDefault();
        this.onClickButton(btn);
      };

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
      this.app.commands.executeCommandById(button.command);
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
