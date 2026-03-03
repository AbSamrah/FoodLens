using Backend.Interfaces;
using Backend.Models.Auth;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            var token = await _authService.RegisterAsync(model);

            if (token == null)
                return BadRequest(new { Error = "User registration failed. Email might already exist or password is too weak." });

            return Ok(new { Token = token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var token = await _authService.LoginAsync(model);

            if (token == null)
                return Unauthorized(new { Error = "Invalid email or password." });

            return Ok(new { Token = token });
        }
    }
}
