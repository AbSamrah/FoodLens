using Backend.Models;

namespace Backend.Interfaces
{
    public interface IVisionApiService
    {
        Task<CalorieEstimationResult> AnalyzeFoodImageAsync(IFormFile imageFile);
    }
}
