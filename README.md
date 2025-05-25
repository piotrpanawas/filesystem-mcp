# Node.js Project

This project is an implementation of an MCP (Microservice Context Protocol) server. Its primary function is to allow browsing and reading files within a specified directory.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the server:
   ```bash
   node server.js
   ```

## Available Tools

This MCP server provides the following tools:

- `mcp_filesystem_browse_files`: Browse/list the files in a specified directory.
- `mcp_filesystem_read_file`: Read the content of a specified file.

## Example Configuration

Here is an example configuration for this MCP server in a `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "C\\Users\\SomeUser\\Desktop\\SomeDirectory"
      ]
    }
  }
}
``` 