using Backend.Entities;
using Backend.Models;
using System.Text.Json;

namespace Backend.Data
{
    public class DataSeeder
    {
        public static async Task SeedIngredientsAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (dbContext.IngredientTypes.Any())
            {
                return;
            }

            Console.WriteLine("Database is empty! Fetching ingredients from TheMealDB API...");

            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync("https://www.themealdb.com/api/json/v1/1/list.php?i=list");

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine("Failed to fetch ingredients from API.");
                return;
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<MealDbResponse>(jsonString);

            if (result?.Meals == null || !result.Meals.Any()) return;

            var newIngredients = result.Meals
                .Where(m => !string.IsNullOrWhiteSpace(m.Name))
                .Select(m => new IngredientType
                {
                    Name = m.Name,
                    IsActive = true
                })
                .ToList();

            await dbContext.IngredientTypes.AddRangeAsync(newIngredients);
            await dbContext.SaveChangesAsync();

            Console.WriteLine($"Successfully seeded {newIngredients.Count} ingredients into the database!");
        }
    }
}
