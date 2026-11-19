using expenceAPI.Models.DTOs;

namespace expenceAPI.Services.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserResponseDto>> GetAllAsync(bool includeDeleted = false, int? isDelete = null);
    Task<UserResponseDto?> GetByIdAsync(Guid id, bool includeDeleted = true);
    Task<UserResponseDto?> GetByEmailAsync(string email);
    Task<UserResponseDto> RegisterAsync(RegisterUserDto dto);
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
    Task<UserResponseDto?> UpdateAsync(Guid id, UpdateUserDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<UserResponseDto?> RestoreAsync(Guid id);
}
