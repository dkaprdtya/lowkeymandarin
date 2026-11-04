# Lowkey Mandarin documentation

- [Editing guide](EDITING.md) — where to change text, vocabulary, styles and pages.
- [Architecture](ARCHITECTURE.md) — request flow, database model, API map and extension points.

The main [README](../README.md) covers installation, production hosting, security
settings and backups. The [AUDIT](../AUDIT.md) records what was verified and what
is still untested.

## Fast path

1. Open the `hanzi-flow` folder in VS Code.
2. Install the recommended extensions when prompted.
3. Create a virtual environment and install `requirements.txt`.
4. Run the **Lowkey Mandarin: dev server** task.
5. Open `http://127.0.0.1:5000`.

The project has no frontend build step. Edit a file, save, and reload the page.
Python changes need a server restart.
