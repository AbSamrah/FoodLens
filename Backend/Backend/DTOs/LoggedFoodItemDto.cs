namespace Backend.DTOs
{
    public class LoggedFoodItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double EstimatedGrams { get; set; }
        public double Calories { get; set; }
    }
}
