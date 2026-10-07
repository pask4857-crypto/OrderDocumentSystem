using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderDocumentSystem.Requests;
using OrderDocumentSystem.Responses;
using OrderDocumentSystem.Services;

namespace OrderDocumentSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserService _userService;

    private readonly JwtService _jwtService;

    public AuthController(
    UserService userService,
    JwtService jwtService)
    {
        _userService = userService;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(
    RegisterRequest request)
    {
        var existingUser =
            await _userService.FindByUsernameAsync(request.Username);

        if (existingUser != null)
        {
            return BadRequest(new ErrorResponse
            {
                StatusCode = 400,
                Message = "Username 已經存在"
            });
        }

        try
        {
            var user = await _userService.CreateUserAsync(
                request.Username,
                request.Password,
                "USER"
            );

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Role
            });
        }
        catch (DbUpdateException)
        {
            return BadRequest(new ErrorResponse
            {
                StatusCode = 400,
                Message = "Username 已經存在"
            });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request)
    {
        var user =
            await _userService.FindByUsernameAsync(request.Username);

        if (user == null)
        {
            return Unauthorized(new ErrorResponse
            {
                StatusCode = 401,
                Message = "帳號或密碼錯誤"
            });
        }

        var passwordValid = _userService.VerifyPassword(
            request.Password,
            user.PasswordHash
        );

        if (!passwordValid)
        {
            return Unauthorized(new ErrorResponse
            {
                StatusCode = 401,
                Message = "帳號或密碼錯誤"
            });
        }

        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            token
        });
    }
}