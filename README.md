# Word & Phrase Highlighter
[![Watch the video](https://github.com/juangrukat/gpt-highlighter/blob/main/gpt%20highlighter.mp4)

A Visual Studio Code extension that highlights words and phrases found in user-specified text files. This extension is perfect for emphasizing important terms, flagging problematic language, or creating custom syntax highlighting for domain-specific terminology.

## Features

- Highlight words and phrases in your code based on custom word lists
- Support for both single words and multi-word phrases
- Multiple word lists with different highlight colors
- Real-time highlighting as you type
- File watching to automatically update highlights when word lists change
- Word boundary detection for accurate word matching

## Installation

1. Install the extension from the VS Code Marketplace or by using the VSIX file
2. Create one or more text files containing words and phrases to highlight
3. Configure the extension settings to use your word lists

## Basic Usage

1. Create a text file with words or phrases to highlight (one per line)
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run the command `Word Highlighter: Load Word List`
4. Select your word list file
5. The words and phrases will be highlighted in your editor

## Word List File Format

Word list files are simple text files with the following format:

- One word or phrase per line
- Lines starting with `#` are treated as comments and ignored
- Empty lines are ignored
- Both single words and multi-word phrases are supported

Example word list file:

```
# Important terms to highlight
important
critical issue
TODO
FIXME
NOTE
```

## Configuration

### Extension Settings

This extension contributes the following settings:

* `wordPhraseHighlighter.wordLists`: Array of word list configurations
* `wordPhraseHighlighter.refreshDelay`: Delay in milliseconds before refreshing highlights after typing (default: 100)

### Word Lists Configuration

The `wordPhraseHighlighter.wordLists` setting is an array of objects with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | Path to the word list file (absolute or workspace-relative) |
| `color` | string | CSS color value for highlighting (e.g., "rgba(255, 0, 0, 0.3)") |
| `enabled` | boolean | Whether this word list is enabled |

### Example settings.json

```json
{
  "wordPhraseHighlighter.wordLists": [
    {
      "path": "./wordlists/important-terms.txt",
      "color": "rgba(255, 0, 0, 0.3)",
      "enabled": true
    },
    {
      "path": "/absolute/path/to/technical-terms.txt",
      "color": "rgba(0, 0, 255, 0.3)",
      "enabled": true
    },
    {
      "path": "./wordlists/optional-terms.txt",
      "color": "rgba(0, 255, 0, 0.3)",
      "enabled": false
    }
  ],
  "wordPhraseHighlighter.refreshDelay": 200
}
```

## Commands

This extension provides the following commands:

* `Word Highlighter: Open Settings Editor`: Opens a dedicated settings editor for managing word lists (currently under maintenance)
* `Word Highlighter: Load Word List`: Opens a file dialog to select a new word list file
* `Word Highlighter: Refresh Highlights`: Manually refreshes all word highlights

## Priority System

When multiple word lists contain overlapping words or phrases, the extension uses a priority system:

1. Word lists are processed in the order they appear in the configuration
2. Earlier lists have higher priority than later lists
3. Phrases (multi-word terms) have higher priority than single words
4. When ranges overlap, only the highest priority match is highlighted

## Troubleshooting

### Highlights not appearing

- Ensure your word list file exists and is properly formatted
- Check that the word list is enabled in settings
- Try running the `Word Highlighter: Refresh Highlights` command
- Verify the path to your word list file is correct (absolute or workspace-relative)

### Performance issues

- Use fewer or smaller word lists for better performance
- Increase the `refreshDelay` setting if highlighting causes lag
- Disable word lists that aren't currently needed

### File path issues

- For workspace-relative paths, ensure they're relative to the workspace root
- For absolute paths, ensure they're correctly formatted for your operating system
- If using a network drive, ensure the path is accessible

## Future Features

- Enhanced settings editor UI for easier configuration
- Case sensitivity options
- Regular expression support
- Export/import of word list configurations
- Customizable highlight styles
