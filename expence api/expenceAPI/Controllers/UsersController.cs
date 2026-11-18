using Microsoft.AspNetCore.Mvc;
using expenceAPI.Models.DTOs;
using expenceAPI.Services.Interfaces;

namespace expenceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all registered user profiles.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAll()
    {
        var users = await _userService.GetAllAsync();
        return Ok(users);
    }

    /// <summary>
    /// Gets a user profile by Id.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponseDto>> GetById(Guid id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { message = $"User with Id '{id}' not found." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Registers a new user account.
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
            return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Authenticates a user with email and password.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _userService.LoginAsync(dto);
        if (result == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(result);
    }

    /// <summary>
    /// Updates an existing user profile.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserResponseDto>> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _userService.UpdateAsync(id, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"User with Id '{id}' not found." });
        }

        return Ok(updated);
    }

    /// <summary>
    /// Soft deletes a user account.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _userService.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"User with Id '{id}' not found." });
        }

        return NoContent();
    }
}

