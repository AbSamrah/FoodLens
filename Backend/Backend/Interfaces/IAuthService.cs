using Backend.Models.Auth;

namespace Backend.Interfaces
{
    public interface IAuthService
    {
        Task<string?> RegisterAsync(RegisterDto model);
        Task<string?> LoginAsync(LoginDto model);
    }
}
