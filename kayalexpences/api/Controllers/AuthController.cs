using Microsoft.AspNetCore.Mvc;
using expenceAPI.Models.DTOs;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IUserService userService, ILogger<AuthController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new user account with email, password, full name, and profile details.
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<UserResponseDto>> Register([FromBody] RegisterUserDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var user = await _userService.RegisterAsync(dto);
            return CreatedAtAction(nameof(GetUser), new { email = user.Email }, user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during user registration.");
            var detail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            return StatusCode(500, new { message = "Registration failed.", error = detail });
        }
    }

    /// <summary>
    /// Authenticates a user with email and password, returning an auth token and profile.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var result = await _userService.LoginAsync(dto);
            if (result == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during login.");
            var detail = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
            return StatusCode(500, new { message = "Login failed.", error = detail });
        }
    }

    /// <summary>
    /// Gets the profile of the user by email or active session.
    /// </summary>
    [HttpGet("user")]
    public async Task<ActionResult<UserResponseDto>> GetUser([FromQuery] string? email)
    {
        var targetEmail = email ?? User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(targetEmail))
        {
            return BadRequest(new { message = "Email query parameter is required." });
        }

        var user = await _userService.GetByEmailAsync(targetEmail);
        if (user == null)
        {
            return NotFound(new { message = $"User with email '{targetEmail}' not found." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Alias for current user profile.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserResponseDto>> GetMe([FromQuery] string? email)
    {
        return await GetUser(email);
    }

    /// <summary>
    /// Logs out the user session.
    /// </summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully." });
    }
}
