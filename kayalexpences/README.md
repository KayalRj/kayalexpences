# Kayal Expenses

A full-stack expense tracking system with a React frontend and an ASP.NET Core Web API backend.

## Project Structure

```text
kayalexpences/
├── api/                    # ASP.NET Core Web API (.NET 10)
│   ├── Controllers/        # Auth, Users, Expenses, Salary Cycles, Dashboard
│   ├── Data/               # Entity Framework DbContext & Migrations
│   ├── Models/             # Entities and DTOs
│   ├── Services/           # Business logic & repository services
│   ├── Program.cs          # API entry point & configuration
│   └── expenceAPI.csproj
│
├── client/                 # React + Vite Frontend (TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/     # UI Modals, Widgets, Themes
│   │   ├── pages/          # Home, Login, Dashboard
│   │   ├── services/       # Axios API client & services
│   │   └── App.tsx         # Dark / Light theme mode provider
│   └── public/
│
├── server/                 # Express static serving layer
└── shared/                 # Shared types & schemas
```

## How to Run

### 1. Backend (.NET Web API)
```bash
cd api
dotnet restore
dotnet run
```
API runs on `http://localhost:5277` (Swagger: `http://localhost:5277/swagger`).

### 2. Frontend (React Client)
```bash
pnpm install
# or npm install
pnpm dev
```
Client runs on `http://localhost:5173`.
