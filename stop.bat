@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title 监控大屏 - 停止器

echo ========================================
echo   服务器集群数据监控大屏 - 一键停止
echo ========================================
echo.

set STOPPED=0

:: 按端口停止后端 (8000) 和前端 (5173)
call :kill_port 8000 "后端 API"
call :kill_port 5173 "前端 Vite"

:: 尝试关闭标题为 Monitor-Backend / Monitor-Frontend 的窗口
taskkill /FI "WINDOWTITLE eq Monitor-Backend*" /F >nul 2>&1
if not errorlevel 1 set STOPPED=1

taskkill /FI "WINDOWTITLE eq Monitor-Frontend*" /F >nul 2>&1
if not errorlevel 1 set STOPPED=1

echo.
if "%STOPPED%"=="1" (
    echo [完成] 服务已停止。
) else (
    echo [提示] 未发现运行中的服务（端口 8000 / 5173 均未占用）。
)
echo ========================================
echo.

pause
exit /b 0

:kill_port
set "PORT=%~1"
set "NAME=%~2"
set FOUND=0

for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    set FOUND=1
    echo [停止] %NAME%  PID=%%p  端口 %PORT%
    taskkill /F /PID %%p >nul 2>&1
    if not errorlevel 1 set STOPPED=1
)

if "!FOUND!"=="0" (
    echo [跳过] %NAME% 未在端口 %PORT% 上运行
)
goto :eof
