using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using expenceAPI.Data;
using expenceAPI.Services.Implementations;
using expenceAPI.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure PostgreSQL Database Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Register Application Services (Dependency Injection)
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<ISalaryCycleService, SalaryCycleService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// 3. Configure CORS for frontend access (Vite / React / Mobile)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. Add MVC Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.AllowTrailingCommas = true;
        options.JsonSerializerOptions.ReadCommentHandling = System.Text.Json.JsonCommentHandling.Skip;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// 5. OpenAPI Specification (.NET 10)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

// 6. Ensure Database and Tables are created automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreated();

        // Ensure schema is updated with FullName and IsDelete columns in PostgreSQL
        try
        {
            context.Database.ExecuteSqlRaw(@"
                DO $$ 
                BEGIN 
                    -- 1. Users table
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Users') THEN
                        ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""FullName"" text;
                        ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'IsDeleted') THEN
                            UPDATE ""Users"" SET ""IsDelete"" = CASE WHEN ""IsDeleted"" = true THEN 1 ELSE 0 END WHERE ""IsDelete"" = 0;
                        END IF;
                    END IF;
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS ""FullName"" text;
                        ALTER TABLE users ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'IsDeleted') THEN
                            UPDATE users SET ""IsDelete"" = CASE WHEN ""IsDeleted"" = true THEN 1 ELSE 0 END WHERE ""IsDelete"" = 0;
                        END IF;
                    END IF;

                    -- 2. Expenses table
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Expenses') THEN
                        ALTER TABLE ""Expenses"" ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expenses' AND column_name = 'IsDeleted') THEN
                            UPDATE ""Expenses"" SET ""IsDelete"" = CASE WHEN ""IsDeleted"" = true THEN 1 ELSE 0 END WHERE ""IsDelete"" = 0;
                        END IF;
                    END IF;
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
                        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'IsDeleted') THEN
                            UPDATE expenses SET ""IsDelete"" = CASE WHEN ""IsDeleted"" = true THEN 1 ELSE 0 END WHERE ""IsDelete"" = 0;
                        END IF;
                    END IF;

                    -- 3. SalaryCycles table
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SalaryCycles') THEN
                        ALTER TABLE ""SalaryCycles"" ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SalaryCycles' AND column_name = 'IsDeleted') THEN
                            UPDATE ""SalaryCycles"" SET ""IsDelete"" = CASE WHEN ""IsDeleted"" = true THEN 1 ELSE 0 END WHERE ""IsDelete"" = 0;
                        END IF;
                    END IF;
                    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salarycycles') THEN
                        ALTER TABLE salarycycles ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salarycycles' AND column_name = 'IsDeleted') THEN
                            UPDATE salarycycles SET ""IsDelete"" = CASE WHEN ""IsDeleted"" = true THEN 1 ELSE 0 END WHERE ""IsDelete"" = 0;
                        END IF;
                    END IF;
                END $$;
            ");
        }
        catch (Exception sqlEx)
        {
            logger.LogWarning("Schema migration warning: {Message}", sqlEx.Message);
        }

        logger.LogInformation("PostgreSQL Database connected and verified successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning("Database connection attempt on startup: {Message}. (Make sure PostgreSQL is running).", ex.Message);
    }
}

// 7. OpenAPI Endpoints & Swagger UI
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Official Swagger UI endpoint at /swagger
app.MapGet("/swagger", () => Results.Content(
"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kayal Expense API - Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.18.2/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; font-family: sans-serif; }
    .topbar { background-color: #1b1b1b; padding: 10px 0; }
    .topbar .wrapper { max-width: 1460px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; }
    .topbar a { font-family: sans-serif; font-size: 1.5em; font-weight: bold; color: #fff; text-decoration: none; }
    .swagger-ui .info { margin: 30px 0 20px 0; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="wrapper">
      <a href="/swagger"><span>swagger</span></a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/openapi/v1.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
""", "text/html"));

// Root & alias redirects to /swagger
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapGet("/swagger/index.html", () => Results.Redirect("/swagger"));

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
