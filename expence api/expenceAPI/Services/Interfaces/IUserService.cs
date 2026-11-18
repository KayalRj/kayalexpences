using expenceAPI.Models.DTOs;

namespace expenceAPI.Services.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserResponseDto>> GetAllAsync();
    Task<UserResponseDto?> GetByIdAsync(Guid id);
    Task<UserResponseDto?> GetByEmailAsync(string email);
    Task<UserResponseDto> RegisterAsync(RegisterUserDto dto);
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
    Task<UserResponseDto?> UpdateAsync(Guid id, UpdateUserDto dto);
    Task<bool> DeleteAsync(Guid id);
}

