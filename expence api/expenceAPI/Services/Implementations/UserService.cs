using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using expenceAPI.Data;
using expenceAPI.Models.DTOs;
using expenceAPI.Models.Entities;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Services.Implementations;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<UserResponseDto>> GetAllAsync(bool includeDeleted = false, int? isDelete = null)
    {
        var query = (includeDeleted || isDelete.HasValue)
            ? _context.Users.IgnoreQueryFilters().AsNoTracking().AsQueryable()
            : _context.Users.AsNoTracking().AsQueryable();

        if (isDelete.HasValue)
        {
            query = query.Where(u => u.IsDelete == isDelete.Value);
        }

        return await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => MapToResponseDto(u))
            .ToListAsync();
    }

    public async Task<UserResponseDto?> GetByIdAsync(Guid id, bool includeDeleted = true)
    {
        var query = includeDeleted
            ? _context.Users.IgnoreQueryFilters().AsNoTracking()
            : _context.Users.AsNoTracking();

        var user = await query.FirstOrDefaultAsync(u => u.Id == id);
        return user == null ? null : MapToResponseDto(user);
    }

    public async Task<UserResponseDto?> GetByEmailAsync(string email)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower().Trim());
        return user == null ? null : MapToResponseDto(user);
    }

    public async Task<UserResponseDto> RegisterAsync(RegisterUserDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLower();

        var exists = await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (exists)
        {
            throw new InvalidOperationException($"User with email '{dto.Email}' already exists.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            FullName = dto.FullName?.Trim(),
            PasswordHash = HashPassword(dto.Password),
            BackupEmail = dto.BackupEmail?.Trim(),
            MobileNumber = dto.MobileNumber?.Trim(),
            Place = dto.Place?.Trim(),
            MonthlySalary = dto.MonthlySalary,
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role.Trim(),
            IsDelete = 0,
            IsActive = true,
            CreatedBy = normalizedEmail
        };

        _context.Users.Add(user);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException dbEx) when (dbEx.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "42703")
        {
            // PostgreSQL Error 42703: column does not exist. Auto-heal schema by adding missing column.
            await _context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""FullName"" text;
                ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS ""FullName"" text;
                ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
            ");
            await _context.SaveChangesAsync();
        }

        return MapToResponseDto(user);
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLower();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
        {
            return null;
        }

        var profile = MapToResponseDto(user);
        // Generates an authorization token representation for client state
        var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{user.Id}:{user.Email}:{DateTime.UtcNow.Ticks}"));

        return new LoginResponseDto(
            user.Id,
            user.Email,
            user.Role,
            token,
            profile
        );
    }

    public async Task<UserResponseDto?> UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return null;

        if (dto.FullName != null) user.FullName = dto.FullName.Trim();
        if (dto.BackupEmail != null) user.BackupEmail = dto.BackupEmail.Trim();
        if (dto.MobileNumber != null) user.MobileNumber = dto.MobileNumber.Trim();
        if (dto.Place != null) user.Place = dto.Place.Trim();
        if (dto.MonthlySalary >= 0) user.MonthlySalary = dto.MonthlySalary;
        if (!string.IsNullOrWhiteSpace(dto.Role)) user.Role = dto.Role.Trim();

        user.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException dbEx) when (dbEx.InnerException is Npgsql.PostgresException pgEx && pgEx.SqlState == "42703")
        {
            await _context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""FullName"" text;
                ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
                ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS ""FullName"" text;
                ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS ""IsDelete"" integer NOT NULL DEFAULT 0;
            ");
            await _context.SaveChangesAsync();
        }

        return MapToResponseDto(user);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return false;

        // Soft delete: set IsDelete = 1 (remains visible in database table)
        user.IsDelete = 1;
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<UserResponseDto?> RestoreAsync(Guid id)
    {
        var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return null;

        // Restore: set IsDelete = 0
        user.IsDelete = 0;
        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToResponseDto(user);
    }

    private static UserResponseDto MapToResponseDto(User u)
    {
        return new UserResponseDto(
            u.Id,
            u.FullName,
            u.Email,
            u.BackupEmail,
            u.MobileNumber,
            u.Place,
            u.MonthlySalary,
            u.Role,
            u.IsDelete,
            u.CreatedAt
        );
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLower();
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password).Equals(hash, StringComparison.OrdinalIgnoreCase);
    }
}
