@echo off
set "PATH=C:\ProgramData\win-10\GitHubDesktop\app-3.4.5\resources\app\git\cmd;C:\ProgramData\win-10\GitHubDesktop\app-3.4.5\resources\app\git\mingw64\bin;C:\Users\win-10\AppData\Local\Programs\Git\cmd;%PATH%"
cd /d "%~dp0"

echo ======================================================================
echo    RISE A CHILD CHILDREN HOME - Official GitHub Pusher
echo ======================================================================
echo Target Repository : https://github.com/kunnylava-debug/RAISE-A-CHILD-CHILDREN-HOME.git
echo Branch            : main
echo.
echo Connecting to GitHub...
echo A browser login window or credential prompt will appear if not signed in yet.
echo ======================================================================
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo [SUCCESS] Your website code has been pushed successfully to GitHub!
    echo View repository at: https://github.com/kunnylava-debug/RAISE-A-CHILD-CHILDREN-HOME
    echo ======================================================================
) else (
    echo ======================================================================
    echo [NOTICE] If browser login did not appear or failed, you can use a
    echo GitHub Personal Access Token (PAT):
    echo 1. Open: https://github.com/settings/tokens
    echo 2. Click "Generate new token (classic)" and check "repo"
    echo 3. Copy the token and paste it when prompted for password
    echo ======================================================================
)

echo.
pause
