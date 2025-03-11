"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsEditor = void 0;
const vscode = require("vscode");
/**
 * Settings Editor for Word & Phrase Highlighter
 * Provides a dedicated UI for managing word lists
 */
class SettingsEditor {
    /**
     * Create or show the settings editor panel
     */
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it
        if (SettingsEditor.currentPanel) {
            SettingsEditor.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel('wordPhraseHighlighterSettings', 'Word & Phrase Highlighter Settings', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [extensionUri],
            retainContextWhenHidden: true,
        });
        SettingsEditor.currentPanel = new SettingsEditor(panel, extensionUri);
    }
    /**
     * Constructor for the settings editor
     */
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(() => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            // Handle messages here
        }, null, this._disposables);
    }
    /**
     * Clean up resources when the panel is closed
     */
    dispose() {
        SettingsEditor.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    /**
     * Update the webview content
     */
    async _update() {
        this._panel.title = 'Word & Phrase Highlighter Settings';
        this._panel.webview.html = this._getHtmlForWebview();
    }
    /**
     * Get the HTML for the webview
     */
    _getHtmlForWebview() {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Word & Phrase Highlighter Settings</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
        </style>
      </head>
      <body>
        <h1>Word & Phrase Highlighter Settings</h1>
        <p>Settings editor is currently under maintenance.</p>
      </body>
      </html>
    `;
    }
}
exports.SettingsEditor = SettingsEditor;
//# sourceMappingURL=settingsEditor.js.map