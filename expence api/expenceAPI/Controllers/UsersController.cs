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
    /// By default, returns active users (isDelete = 0). Pass includeDeleted=true or isDelete=1 to view deleted users.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAll(
        [FromQuery] bool includeDeleted = false,
        [FromQuery] int? isDelete = null)
    {
        var users = await _userService.GetAllAsync(includeDeleted, isDelete);
        return Ok(users);
    }

    /// <summary>
    /// Gets a user profile by Id.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponseDto>> GetById(Guid id, [FromQuery] bool includeDeleted = true)
    {
        var user = await _userService.GetByIdAsync(id, includeDeleted);
        if (user == null)
        {
            return NotFound(new { message = $"User with Id '{id}' not found." });
        }

        return Ok(user);
    }

    /// <summary>
    /// Registers a new user account (with isDelete = 0).
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
    /// Sets isDelete = 1 and keeps the row with all its fields in the database table.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _userService.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"User with Id '{id}' not found." });
        }

        return Ok(new { message = "User deleted successfully (soft-deleted, marked isDelete=1).", id, isDelete = 1 });
    }

    /// <summary>
    /// Restores a previously soft-deleted user account (sets isDelete = 0).
    /// </summary>
    [HttpPost("{id:guid}/restore")]
    public async Task<ActionResult<UserResponseDto>> Restore(Guid id)
    {
        var restored = await _userService.RestoreAsync(id);
        if (restored == null)
        {
            return NotFound(new { message = $"User with Id '{id}' not found." });
        }

        return Ok(restored);
    }
}
