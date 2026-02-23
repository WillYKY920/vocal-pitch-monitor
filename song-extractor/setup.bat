@echo off
setlocal
echo ===================================================
echo       Song Extractor - Environment Setup
echo ===================================================

REM 1. Check and install FFmpeg
echo.
echo [1/3] Checking for FFmpeg...
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo FFmpeg not found. Attempting to install via winget...
    REM winget is built into Windows 10/11
    winget install --id Gyan.FFmpeg -e --source winget
    echo.
    echo [!] NOTE: You might need to close and reopen your terminal after setup
    echo           for FFmpeg to be fully recognized in your system PATH.
) else (
    echo FFmpeg is already installed.
)

REM 2. Create Python 3.11 Virtual Environment
echo.
echo [2/3] Setting up Python 3.11 Virtual Environment .venv...
REM Check if the Python Launcher for Windows has 3.11 available
py -3.11 --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python 3.11 is not installed or not registered.
    echo Please install Python 3.11 from python.org and try again.
    pause
    exit /b 1
)

if not exist .venv (
    echo Creating new venv with Python 3.11...
    py -3.11 -m venv .venv
    echo Virtual environment created successfully.
) else (
    echo Virtual environment .venv already exists. Skipping creation.
)

REM 3. Activate and install packages
echo.
echo [3/3] Activating venv and installing packages...
call .venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip
REM Put pip cache inside the project (fast repeat installs)
set "PIP_CACHE_DIR=%CD%\.pip-cache"
if not exist "%PIP_CACHE_DIR%" mkdir "%PIP_CACHE_DIR%"

REM Pick a faster PyPI mirror for general packages (non-torch)
set "PYPI_MIRROR=https://pypi.tuna.tsinghua.edu.cn/simple"

REM Install dependencies
echo Found requirements.txt. Installing dependencies...

pip install torch torchaudio torchvision --index-url https://download.pytorch.org/whl/cu121 --cache-dir "%PIP_CACHE_DIR%"
python -m pip install -r requirements.txt ^
    -i "%PYPI_MIRROR%" ^
    --extra-index-url https://download.pytorch.org/whl/cu121 ^
    --cache-dir "%PIP_CACHE_DIR%"

pip install https://github.com/facebookresearch/demucs/archive/refs/heads/main.zip --no-deps


echo.
echo ===================================================
echo Setup Complete! 
echo.
echo To activate the environment manually in the future, run:
echo     .venv\Scripts\activate
echo ===================================================
pause
