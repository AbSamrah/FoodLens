using Backend.Data;
using Backend.Entities;
using Backend.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories
{
    public class IngredientRepository : IIngredientRepository
    {
        private readonly AppDbContext _context;

        public IngredientRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<string>> GetActiveIngredientNamesAsync()
        {
            return await _context.IngredientTypes
                .Where(i => i.IsActive)
                .Select(i => i.Name)
                .ToListAsync();
        }

        public async Task<bool> HasAnyIngredientsAsync()
        {
            return await _context.IngredientTypes.AnyAsync();
        }

        public async Task AddIngredientsAsync(IEnumerable<IngredientType> ingredients)
        {
            await _context.IngredientTypes.AddRangeAsync(ingredients);
            await _context.SaveChangesAsync();
        }
    }
}
