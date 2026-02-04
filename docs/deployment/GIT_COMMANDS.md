# 📝 Git Commands - Quick Reference

**For:** Pushing ISOTEC Contract System to GitHub

---

## 🚀 First Time Setup

### 1. Initialize Git (if not done)

```bash
# Check if git is initialized
git status

# If not initialized:
git init
```

### 2. Configure Git (if first time)

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

### 3. Add All Files

```bash
# Add all files to staging
git add .

# Verify what will be committed
git status
```

### 4. Create First Commit

```bash
# Commit with message
git commit -m "Initial commit - ISOTEC Contract System MVP"

# Verify commit
git log --oneline
```

### 5. Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `isotec-contract-system`
3. Description: "ISOTEC Photovoltaic Contract System"
4. Visibility: Private (recommended)
5. **DO NOT** initialize with README
6. Click "Create repository"

### 6. Connect to GitHub

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/isotec-contract-system.git

# Verify remote
git remote -v

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 🔄 Daily Workflow

### Making Changes

```bash
# 1. Check current status
git status

# 2. See what changed
git diff

# 3. Add specific files
git add path/to/file.ts

# Or add all changes
git add .

# 4. Commit with descriptive message
git commit -m "Add email signature feature"

# 5. Push to GitHub
git push origin main
```

### Viewing History

```bash
# See commit history
git log

# See compact history
git log --oneline

# See last 5 commits
git log --oneline -5

# See changes in last commit
git show
```

---

## 🌿 Working with Branches

### Create Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Or create branch without switching
git branch feature/new-feature

# List all branches
git branch -a
```

### Switch Branches

```bash
# Switch to existing branch
git checkout main

# Switch to feature branch
git checkout feature/new-feature
```

### Merge Branch

```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feature/new-feature

# Push merged changes
git push origin main

# Delete feature branch (optional)
git branch -d feature/new-feature
```

---

## 🔍 Checking Status

### See What Changed

```bash
# Show status
git status

# Show differences
git diff

# Show staged differences
git diff --staged

# Show differences for specific file
git diff path/to/file.ts
```

### See Remote Info

```bash
# Show remote repositories
git remote -v

# Show remote branches
git branch -r

# Fetch latest from remote (without merging)
git fetch origin
```

---

## ⚠️ Common Issues & Fixes

### Forgot to Add File

```bash
# Add forgotten file
git add forgotten-file.ts

# Amend last commit
git commit --amend --no-edit
```

### Wrong Commit Message

```bash
# Change last commit message
git commit --amend -m "Correct message"
```

### Undo Last Commit (Keep Changes)

```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and unstage changes
git reset HEAD~1

# Undo commit and discard changes (CAREFUL!)
git reset --hard HEAD~1
```

### Discard Local Changes

```bash
# Discard changes in specific file
git checkout -- path/to/file.ts

# Discard all local changes (CAREFUL!)
git reset --hard HEAD
```

### Pull Latest Changes

```bash
# Pull from main branch
git pull origin main

# If conflicts, resolve them and:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

---

## 🔐 Security Best Practices

### Never Commit Sensitive Data

```bash
# Check .gitignore includes:
cat .gitignore | grep -E "\.env|node_modules|\.next"

# If you accidentally committed .env.local:
git rm --cached .env.local
git commit -m "Remove sensitive env file"
git push origin main
```

### Verify Before Pushing

```bash
# Always check what you're about to push
git status
git diff origin/main

# Then push
git push origin main
```

---

## 📦 Useful Aliases (Optional)

Add to `~/.gitconfig`:

```bash
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --oneline --graph --decorate --all
```

Usage:
```bash
git st          # Instead of git status
git co main     # Instead of git checkout main
git br          # Instead of git branch
git ci -m "msg" # Instead of git commit -m "msg"
```

---

## 🎯 Quick Commands for This Project

### Initial Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - ISOTEC Contract System MVP"
git remote add origin https://github.com/YOUR_USERNAME/isotec-contract-system.git
git branch -M main
git push -u origin main
```

### Update After Changes

```bash
git add .
git commit -m "Update: describe your changes"
git push origin main
```

### Create Feature Branch

```bash
git checkout -b feature/gov-br-signature
# Make changes
git add .
git commit -m "Add GOV.BR signature integration"
git push origin feature/gov-br-signature
# Create Pull Request on GitHub
```

---

## 📚 Learn More

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com
- **Git Cheat Sheet:** https://education.github.com/git-cheat-sheet-education.pdf

---

**Quick Reference Created:** February 4, 2024  
**For Project:** ISOTEC Contract System  
**Status:** Ready to use

🚀 **Start with the "First Time Setup" section above!**
