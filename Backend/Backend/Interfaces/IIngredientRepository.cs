using Backend.Entities;

namespace Backend.Interfaces
{
    public interface IIngredientRepository
    {
        Task<List<string>> GetActiveIngredientNamesAsync();
        Task<bool> HasAnyIngredientsAsync();
        Task AddIngredientsAsync(IEnumerable<IngredientType> ingredients);
    }
}
