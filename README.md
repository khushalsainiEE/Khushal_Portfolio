# Khushal Saini — Portfolio

Static portfolio site for videography, photography, and visual work.

## Preview locally

```powershell
Set-Location "path\to\Portfolio"
python -m http.server 5500
```

Open [http://localhost:5500](http://localhost:5500)

## Add your media

Edit **`media-config.js`** — see comments inside for photos and YouTube/Vimeo links.

Put images in `assets/images/` and optional MP4 files in `assets/videos/`.

## Version history

See **[VERSION_HISTORY.md](./VERSION_HISTORY.md)** for a human-readable changelog. Use the same version in Git commit messages.

---

## Push to GitHub (first time)

Your project is only on your PC until **Git** is installed and you push. Connecting GitHub inside Cursor does not upload files by itself.

### 1. Install Git for Windows

Download and install: [https://git-scm.com/download/win](https://git-scm.com/download/win)

Restart Cursor after installing.

### 2. Create an empty repo on GitHub

1. Go to [https://github.com/new](https://github.com/new)
2. Name it e.g. `portfolio` or `khushal-portfolio`
3. **Do not** add a README, .gitignore, or license (this folder already has them)
4. Click **Create repository**

### 3. Run the setup script (in Cursor terminal)

```powershell
Set-Location "c:\Users\khush\OneDrive\سطح المكتب\Portfolio"
.\scripts\setup-github.ps1 -GitHubUser YOUR_GITHUB_USERNAME -RepoName portfolio
```

Replace `YOUR_GITHUB_USERNAME` and `portfolio` with your values.

Or run the commands manually:

```powershell
git init
git add .
git commit -m "v0.4.0: portfolio with Three.js studio and dark mode"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
git push -u origin main
```

### 4. Use Cursor Source Control

After Git is installed: **Source Control** icon → **Initialize Repository** (if needed) → stage files → commit → **Publish Branch** and pick your GitHub account.

---

## 3D camera credits

- [Three.js](https://threejs.org/) (MIT)
- [Antique Camera](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/AntiqueCamera) — Khronos glTF Sample Assets, © UX3D, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
