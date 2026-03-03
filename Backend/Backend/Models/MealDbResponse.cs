using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class MealDbResponse
    {
        [JsonPropertyName("meals")]
        public List<MealDbIngredient>? Meals { get; set; }
    }
}
