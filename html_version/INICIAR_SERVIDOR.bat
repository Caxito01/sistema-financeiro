@echo off
echo ========================================
echo  Sistema Financeiro - Servidor Local
echo ========================================
echo.
echo Iniciando servidor HTTP na porta 8000...
echo.
echo O navegador abrira automaticamente em:
echo http://localhost:8000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ========================================
echo.

cd /d "%~dp0"
start http://localhost:8000
npx http-server -p 8000

pause
