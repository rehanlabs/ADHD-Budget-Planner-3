@echo off
echo ============================================================
echo   Pushing ADHD Budget Planner (Edition 3) to GitHub...
echo ============================================================
git push -u origin main
if %ERRORLEVEL% EQU 0 (
  echo.
  echo [SUCCESS] Pushed to https://github.com/rehanlabs/ADHD-Budget-Planner-3
  echo Now visit GitHub Repo - Settings - Pages, and set Source to "Deploy from a branch (main / root)".
) else (
  echo.
  echo [NOTE] If repository was not found, create an empty repository named:
  echo        "ADHD-Budget-Planner-3" at https://github.com/new
  echo        Then run this script again!
)
pause
