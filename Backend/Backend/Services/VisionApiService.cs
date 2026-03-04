using Backend.Interfaces;
using Backend.Models;
using System.Text.Json;

namespace Backend.Services
{
    public class VisionApiService : IVisionApiService
    {
        private readonly HttpClient _httpClient;
        private readonly IIngredientRepository _ingredientRepository;

        public VisionApiService(HttpClient httpClient, IIngredientRepository ingredientRepository)
        {
            _httpClient = httpClient;
            _ingredientRepository = ingredientRepository;

     }

        public async Task<CalorieEstimationResult> AnalyzeFoodImageAsync(IFormFile imageFile)
        {
            var activeIngredients = await _ingredientRepository.GetActiveIngredientNamesAsync();

            if (!activeIngredients.Any())
            {
                activeIngredients = new List<string> { "Rice", "Chicken", "Salad", "Bread" };
            }

            using var content = new MultipartFormDataContent();
            using var stream = imageFile.OpenReadStream();

            var streamContent = new StreamContent(stream);
            streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(imageFile.ContentType);

            content.Add(streamContent, "file", imageFile.FileName);

            var labelsJson = JsonSerializer.Serialize(activeIngredients);
            content.Add(new StringContent(labelsJson), "candidate_labels");

            if (!_httpClient.DefaultRequestHeaders.Contains("ngrok-skip-browser-warning"))
            {
                _httpClient.DefaultRequestHeaders.Add("ngrok-skip-browser-warning", "true");
            }

            var response = await _httpClient.PostAsync("api/analyze-food", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorDetails = await response.Content.ReadAsStringAsync();
                throw new Exception($"Status: {response.StatusCode} | Details: {errorDetails}");
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<CalorieEstimationResult>(jsonResponse, options)
                   ?? new CalorieEstimationResult();
        }
    }
}