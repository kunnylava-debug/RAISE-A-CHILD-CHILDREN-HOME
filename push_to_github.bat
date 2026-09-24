@echo off
set "PATH=C:\Users\win-10\AppData\Local\Programs\Git\cmd;%PATH%"
cd /d "%~dp0"

echo ======================================================================
echo    RAISE A CHILD CHILDREN HOME - GitHub Repository Pusher
echo ======================================================================
echo Target Repo: https://github.com/kunnylava-debug/RAISE-A-CHILD-CHILDREN-HOME.git
echo Branch:      main
echo.
echo If GitHub asks for credentials:
echo   - Username: kunnylava-debug
echo   - Password: Use your GitHub Personal Access Token (PAT)
echo     (Generate one at: https://github.com/settings/tokens)
echo ======================================================================
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo [SUCCESS] Code pushed successfully to GitHub!
    echo View repository at: https://github.com/kunnylava-debug/RAISE-A-CHILD-CHILDREN-HOME
    echo ======================================================================
) else (
    echo [NOTICE] Push failed or was canceled. If you need a Personal Access Token:
    echo 1. Go to https://github.com/settings/tokens
    echo 2. Generate a token with 'repo' scope
    echo 3. Paste the token when prompted for password
)

echo.
pause
