using Microsoft.EntityFrameworkCore;
using OrderDocumentSystem.Data;
using OrderDocumentSystem.Models;

namespace OrderDocumentSystem.Services;

public class CustomerService
{
    private readonly AppDbContext _dbContext;

    public CustomerService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Customer>> GetCustomersAsync()
    {
        return await _dbContext.Customers.ToListAsync();
    }

    public async Task<Customer?> GetCustomerByIdAsync(int id)
    {
        return await _dbContext.Customers.FindAsync(id);
    }

    public async Task<Customer> CreateCustomerAsync(Customer customer)
    {
        _dbContext.Customers.Add(customer);

        await _dbContext.SaveChangesAsync();

        return customer;
    }

    public async Task<Customer?> UpdateCustomerAsync(
    int id,
    string name,
    string email)
    {
        var customer = await _dbContext.Customers.FindAsync(id);

        if (customer == null)
        {
            return null;
        }

        customer.Name = name;
        customer.Email = email;

        await _dbContext.SaveChangesAsync();

        return customer;
    }

    public async Task<bool> DeleteCustomerAsync(int id)
    {
        var customer = await _dbContext.Customers.FindAsync(id);

        if (customer == null)
        {
            return false;
        }

        _dbContext.Customers.Remove(customer);

        await _dbContext.SaveChangesAsync();

        return true;
    }
}