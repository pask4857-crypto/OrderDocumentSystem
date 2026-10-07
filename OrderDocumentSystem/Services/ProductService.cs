using Microsoft.EntityFrameworkCore;
using OrderDocumentSystem.Data;
using OrderDocumentSystem.Models;

namespace OrderDocumentSystem.Services;

public class ProductService
{
    private readonly AppDbContext _dbContext;

    public ProductService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Product>> GetProductsAsync()
    {
        return await _dbContext.Products.ToListAsync();
    }

    public async Task<Product?> GetProductByIdAsync(int id)
    {
        return await _dbContext.Products.FindAsync(id);
    }

    public async Task<Product> CreateProductAsync(Product product)
    {
        _dbContext.Products.Add(product);

        await _dbContext.SaveChangesAsync();

        return product;
    }

    public async Task<Product?> UpdateProductAsync(
    int id,
    string name,
    decimal price,
    int stock)
    {
        var product = await _dbContext.Products.FindAsync(id);

        if (product == null)
        {
            return null;
        }

        product.Name = name;
        product.Price = price;
        product.Stock = stock;

        await _dbContext.SaveChangesAsync();

        return product;
    }

    public async Task<bool> DeleteProductAsync(int id)
    {
        var product = await _dbContext.Products.FindAsync(id);

        if (product == null)
        {
            return false;
        }

        _dbContext.Products.Remove(product);

        await _dbContext.SaveChangesAsync();

        return true;
    }
}