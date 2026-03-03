using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class MealDbIngredient
    {
        [JsonPropertyName("strIngredient")]
        public string Name { get; set; } = string.Empty;
    }
}
