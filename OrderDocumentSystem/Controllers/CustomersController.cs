using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OrderDocumentSystem.Services;
using OrderDocumentSystem.Models;
using OrderDocumentSystem.Requests;
using OrderDocumentSystem.Responses;

namespace OrderDocumentSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly CustomerService _customerService;

    public CustomersController(CustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers()
    {
        var customers = await _customerService.GetCustomersAsync();

        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCustomerById(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id);

        if (customer == null)
        {
            return NotFound(new ErrorResponse
            {
                StatusCode = 404,
                Message = "找不到指定的 Customer"
            });
        }

        return Ok(customer);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateCustomer(
        CustomerCreateRequest request)
    {
        var customer = new Customer
        {
            Name = request.Name,
            Email = request.Email
        };

        var createdCustomer =
            await _customerService.CreateCustomerAsync(customer);

        return CreatedAtAction(
            nameof(GetCustomerById),
            new { id = createdCustomer.Id },
            createdCustomer
        );
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateCustomer(
        int id,
        CustomerUpdateRequest request)
    {
        var updatedCustomer =
            await _customerService.UpdateCustomerAsync(
                id,
                request.Name,
                request.Email
            );

        if (updatedCustomer == null)
        {
            return NotFound(new ErrorResponse
            {
                StatusCode = 404,
                Message = "找不到指定的 Customer"
            });
        }

        return Ok(updatedCustomer);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var deleted = await _customerService.DeleteCustomerAsync(id);

        if (!deleted)
        {
            return NotFound(new ErrorResponse
            {
                StatusCode = 404,
                Message = "找不到指定的 Customer"
            });
        }

        return NoContent();
    }
}