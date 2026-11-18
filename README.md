# Kayal Expense Tracker

A full-stack expense management application featuring a modern React frontend and an ASP.NET Core Web API backend.

## Architecture

- **Frontend (`kayalexpences/`)**:
  - React 18, Vite, TypeScript, Tailwind CSS
  - Dark Mode and Light Mode support
  - Dashboard, Budget Tracking, Category Breakdown, Expense History, and Analytics
- **Backend (`expence api/expenceAPI/`)**:
  - ASP.NET Core Web API (.NET 10)
  - Entity Framework Core, SQL Server
  - JWT Authentication, User Registration & Login
  - Expense Management, Categories, and Budget APIs
  - Swagger / OpenAPI documentation

## Getting Started

### 1. Backend Setup
```bash
cd "expence api/expenceAPI"
dotnet restore
dotnet run
```
The API starts at `http://localhost:5277` (Swagger: `http://localhost:5277/swagger`).

### 2. Frontend Setup
```bash
cd "kayalexpences"
pnpm install
# or npm install
pnpm dev
```
The client will be running at `http://localhost:5173`.
