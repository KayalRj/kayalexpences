using System.ComponentModel.DataAnnotations;

namespace expenceAPI.Models.DTOs;

public record UserResponseDto(
    Guid Id,
    string? FullName,
    string Email,
    string? BackupEmail,
    string? MobileNumber,
    string? Place,
    decimal MonthlySalary,
    string Role,
    int IsDelete,
    DateTime CreatedAt
);

public record RegisterUserDto(
    [Required]
    [EmailAddress]
    string Email,

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    string Password,

    string? FullName,

    [EmailAddress]
    string? BackupEmail,

    string? MobileNumber,
    string? Place,
    decimal MonthlySalary,

    string Role = "User"
);

public record LoginDto(
    [Required]
    [EmailAddress]
    string Email,

    [Required]
    string Password
);

public record LoginResponseDto(
    Guid Id,
    string Email,
    string Role,
    string Token,
    UserResponseDto Profile
);

public record UpdateUserDto(
    string? FullName,

    [EmailAddress]
    string? BackupEmail,

    string? MobileNumber,
    string? Place,
    decimal MonthlySalary,

    string? Role
);
