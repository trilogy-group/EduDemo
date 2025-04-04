# Git and GitHub CLI Commands

This document lists all the commands used to set up and manage this repository.

## Git Commands

```bash
# Initialize a new Git repository
git init

# Add all files to the staging area
git add .

# Commit the staged changes with a message
git commit -m "Initial commit"

# Push changes to the remote repository (GitHub)
git push -u origin main
```

## GitHub CLI Commands

```bash
# Install GitHub CLI using Homebrew
brew install gh

# Authenticate with GitHub
gh auth login

# Create a new private repository on GitHub
gh repo create EduDemo --private --source=. --remote=origin

# Change repository visibility to public
gh repo edit anujj-ti/EduDemo --visibility public --accept-visibility-change-consequences
```

## Command Explanations

### Git Commands:
- `git init`: Creates a new Git repository in the current directory
- `git add .`: Stages all files in the repository for commit
- `git commit -m "message"`: Creates a commit with the staged files and adds a descriptive message
- `git push -u origin main`: Pushes commits to the remote repository and sets up tracking between local and remote branches

### GitHub CLI Commands:
- `brew install gh`: Installs the GitHub CLI tool via Homebrew
- `gh auth login`: Starts an interactive authentication process to connect to GitHub
- `gh repo create`: Creates a new repository on GitHub with specified settings
- `gh repo edit`: Modifies repository settings, in this case changing visibility 