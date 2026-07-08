@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "RUN_DIR=%ROOT%.run"

title 监控大屏 - 启动器
cd /d "%ROOT%"

echo ========================================
echo   服务器集群数据监控大屏 - 一键启动
echo ========================================
echo.

if not exist "%RUN_DIR%" mkdir "%RUN_DIR%"

:: 检查端口占用
call :check_port 8000 BACKEND_BUSY
call :check_port 5173 FRONTEND_BUSY
if "%BACKEND_BUSY%"=="1" (
    echo [警告] 端口 8000 已被占用，后端可能已在运行。
)
if "%FRONTEND_BUSY%"=="1" (
    echo [警告] 端口 5173 已被占用，前端可能已在运行。
)

:: 检查 Python
where python >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.11+
    pause
    exit /b 1
)

:: 检查 Node.js
where npm >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 npm，请先安装 Node.js
    pause
    exit /b 1
)

:: 安装后端依赖（首次或 requirements 变更时）
if not exist "%BACKEND%\.deps_ok" (
    echo [1/4] 安装后端依赖...
    pushd "%BACKEND%"
    python -m pip install -r requirements.txt -q
    if errorlevel 1 (
        echo [错误] 后端依赖安装失败
        popd
        pause
        exit /b 1
    )
    echo. > ".deps_ok"
    popd
) else (
    echo [1/4] 后端依赖已就绪，跳过安装
)

:: 安装前端依赖
if not exist "%FRONTEND%\node_modules" (
    echo [2/4] 安装前端依赖（首次较慢）...
    pushd "%FRONTEND%"
    call npm install
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败
        popd
        pause
        exit /b 1
    )
    popd
) else (
    echo [2/4] 前端依赖已就绪，跳过安装
)

:: 启动后端
if not "%BACKEND_BUSY%"=="1" (
    echo [3/4] 启动后端 API  http://127.0.0.1:8000
    start "Monitor-Backend" cmd /k "cd /d %BACKEND% && title Monitor-Backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
    timeout /t 3 /nobreak >nul
) else (
    echo [3/4] 跳过后端启动（端口 8000 已占用）
)

:: 启动前端
if not "%FRONTEND_BUSY%"=="1" (
    echo [4/4] 启动前端大屏  http://localhost:5173
    start "Monitor-Frontend" cmd /k "cd /d %FRONTEND% && title Monitor-Frontend && npm run dev -- --host 127.0.0.1"
    timeout /t 4 /nobreak >nul
) else (
    echo [4/4] 跳过前端启动（端口 5173 已占用）
)

echo.
echo ========================================
echo   启动完成！
echo   大屏地址: http://localhost:5173
echo   API 文档: http://127.0.0.1:8000/docs
echo   关闭服务请运行 stop.bat
echo ========================================
echo.

:: 自动打开浏览器
start "" "http://127.0.0.1:5173"

pause
exit /b 0

:check_port
set "%~2=0"
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":%~1 " ^| findstr "LISTENING"') do (
    set "%~2=1"
    goto :eof
)
goto :eof
