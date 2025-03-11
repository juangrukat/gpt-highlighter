"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const settingsEditor_1 = require("./settingsEditor");
// Store decorations for each word list
let decorationTypes = [];
// Store loaded words and phrases from each list
let wordLists = [];
// Store active timeout for debouncing
let timeout = undefined;
// Track the active editor
let activeEditor = vscode.window.activeTextEditor;
// Decoration options for each word list
function createDecorationOptions(color) {
    return {
        backgroundColor: color,
        border: '1px solid ' + color,
        borderRadius: '2px',
        overviewRulerColor: color,
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    };
}
// Load word lists from configuration
async function loadWordLists() {
    // Clear existing decorations
    decorationTypes.forEach(d => d.dispose());
    decorationTypes = [];
    wordLists = [];
    // Get configuration
    const config = vscode.workspace.getConfiguration('wordPhraseHighlighter');
    const lists = config.get('wordLists') || [];
    // Process each word list
    for (const list of lists) {
        if (!list.enabled) {
            // Add empty list for disabled entries to maintain indices
            wordLists.push([]);
            decorationTypes.push(vscode.window.createTextEditorDecorationType({}));
            continue;
        }
        try {
            // Resolve path (handle both absolute and workspace-relative paths)
            let filePath = list.path;
            if (!path.isAbsolute(filePath) && vscode.workspace.workspaceFolders) {
                filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, filePath);
            }
            // Read and parse the word list file
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            const words = fileContent.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('#'));
            // Add words to our list
            wordLists.push(words);
            // Create decoration type for this list
            const color = list.color || `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.3)`;
            decorationTypes.push(vscode.window.createTextEditorDecorationType(createDecorationOptions(color)));
        }
        catch (error) {
            console.error(`Error loading word list ${list.path}:`, error);
            vscode.window.showErrorMessage(`Failed to load word list: ${list.path}`);
            // Add empty list for failed entries to maintain indices
            wordLists.push([]);
            decorationTypes.push(vscode.window.createTextEditorDecorationType({}));
        }
    }
    // Update highlights
    updateDecorations();
}
// Find all matches in the current document
function findMatches(text) {
    const matches = [];
    // Process each word list (in priority order)
    for (let listIndex = 0; listIndex < wordLists.length; listIndex++) {
        const words = wordLists[listIndex];
        // Skip disabled or empty lists
        if (words.length === 0)
            continue;
        // First, find phrase matches (multi-word)
        const phrases = words.filter(word => word.includes(' '));
        for (const phrase of phrases) {
            let startIndex = 0;
            while (startIndex < text.length) {
                const index = text.toLowerCase().indexOf(phrase.toLowerCase(), startIndex);
                if (index === -1)
                    break;
                // Create a range for this match
                const startPos = activeEditor.document.positionAt(index);
                const endPos = activeEditor.document.positionAt(index + phrase.length);
                matches.push({
                    word: phrase,
                    range: new vscode.Range(startPos, endPos),
                    listIndex
                });
                startIndex = index + 1; // Move past this match
            }
        }
        // Then find single word matches
        const singleWords = words.filter(word => !word.includes(' '));
        for (const word of singleWords) {
            // Use regex to find word boundaries
            const regex = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const startPos = activeEditor.document.positionAt(match.index);
                const endPos = activeEditor.document.positionAt(match.index + word.length);
                // Check if this range overlaps with any existing phrase match
                const overlaps = matches.some(m => m.range.contains(startPos) || m.range.contains(endPos) ||
                    (startPos.isBeforeOrEqual(m.range.start) && endPos.isAfterOrEqual(m.range.end)));
                if (!overlaps) {
                    matches.push({
                        word,
                        range: new vscode.Range(startPos, endPos),
                        listIndex
                    });
                }
            }
        }
    }
    return matches;
}
// Update decorations in the editor
function updateDecorations() {
    if (!activeEditor)
        return;
    const text = activeEditor.document.getText();
    const matches = findMatches(text);
    // Group matches by list index
    const matchesByList = [];
    for (let i = 0; i < wordLists.length; i++) {
        matchesByList.push([]);
    }
    // Add each match to its list, respecting priority
    // (earlier lists override later ones)
    const usedRanges = [];
    for (const match of matches) {
        // Check if this range overlaps with any higher priority match
        const overlaps = usedRanges.some(range => range.contains(match.range.start) || range.contains(match.range.end) ||
            (match.range.start.isBeforeOrEqual(range.start) && match.range.end.isAfterOrEqual(range.end)));
        if (!overlaps) {
            matchesByList[match.listIndex].push(match.range);
            usedRanges.push(match.range);
        }
    }
    // Apply decorations for each list
    for (let i = 0; i < decorationTypes.length; i++) {
        activeEditor.setDecorations(decorationTypes[i], matchesByList[i]);
    }
}
// Trigger update when the text document changes
function triggerUpdateDecorations(throttle = false) {
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
    if (throttle) {
        // Get configured delay
        const config = vscode.workspace.getConfiguration('wordPhraseHighlighter');
        const delay = config.get('refreshDelay') || 100;
        timeout = setTimeout(updateDecorations, delay);
    }
    else {
        updateDecorations();
    }
}
// Watch for changes to word list files
function watchWordListFiles() {
    const config = vscode.workspace.getConfiguration('wordPhraseHighlighter');
    const lists = config.get('wordLists') || [];
    for (const list of lists) {
        if (!list.enabled)
            continue;
        try {
            // Resolve path (handle both absolute and workspace-relative paths)
            let filePath = list.path;
            if (!path.isAbsolute(filePath) && vscode.workspace.workspaceFolders) {
                filePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, filePath);
            }
            // Watch for file changes
            fs.watch(filePath, (eventType) => {
                if (eventType === 'change') {
                    loadWordLists();
                }
            });
        }
        catch (error) {
            console.error(`Error watching word list ${list.path}:`, error);
        }
    }
}
// Extension activation
function activate(context) {
    console.log('Word & Phrase Highlighter extension is now active');
    // Register the command to open settings editor
    const openSettingsCommand = vscode.commands.registerCommand('word-phrase-highlighter.openSettings', () => {
        settingsEditor_1.SettingsEditor.createOrShow(context.extensionUri);
    });
    // Register the command to load word lists
    const loadWordListsCommand = vscode.commands.registerCommand('word-phrase-highlighter.loadWordList', async () => {
        const options = {
            canSelectMany: false,
            openLabel: 'Select Word List',
            filters: {
                'Text files': ['txt'],
                'All files': ['*']
            }
        };
        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            // Get current configuration
            const config = vscode.workspace.getConfiguration('wordPhraseHighlighter');
            const lists = config.get('wordLists') || [];
            // Add new word list
            lists.push({
                path: fileUri[0].fsPath,
                color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.3)`,
                enabled: true
            });
            // Update configuration
            await config.update('wordLists', lists, vscode.ConfigurationTarget.Global);
            // Reload word lists
            loadWordLists();
            vscode.window.showInformationMessage(`Added word list: ${fileUri[0].fsPath}`);
        }
    });
    // Register the command to refresh highlights
    const refreshCommand = vscode.commands.registerCommand('word-phrase-highlighter.refreshHighlights', () => {
        loadWordLists();
        vscode.window.showInformationMessage('Refreshed word highlights');
    });
    // Register event handlers
    context.subscriptions.push(openSettingsCommand, loadWordListsCommand, refreshCommand, vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }), vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations(true);
        }
    }), vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('wordPhraseHighlighter')) {
            loadWordLists();
            watchWordListFiles();
        }
    }));
    // Initial load of word lists
    if (activeEditor) {
        loadWordLists();
        watchWordListFiles();
    }
}
exports.activate = activate;
// Extension deactivation
function deactivate() {
    // Clean up decorations
    decorationTypes.forEach(d => d.dispose());
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map