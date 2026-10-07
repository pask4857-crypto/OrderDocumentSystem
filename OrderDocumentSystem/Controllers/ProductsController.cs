using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderDocumentSystem.Services;
using OrderDocumentSystem.Models;
using OrderDocumentSystem.Requests;
using OrderDocumentSystem.Responses;

namespace OrderDocumentSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _productService;

    public ProductsController(ProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _productService.GetProductsAsync();

        return Ok(products);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetProductById(int id)
    {
        var product = await _productService.GetProductByIdAsync(id);

        if (product == null)
        {
            return NotFound(new ErrorResponse
            {
                StatusCode = 404,
                Message = "找不到指定的 Product"
            });
        }

        return Ok(product);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateProduct(
        ProductCreateRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            Price = request.Price,
            Stock = request.Stock
        };

        var createdProduct = await _productService.CreateProductAsync(product);

        return CreatedAtAction(
            nameof(GetProductById),
            new { id = createdProduct.Id },
            createdProduct
        );
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateProduct(
        int id,
        ProductUpdateRequest request)
    {
        var updatedProduct = await _productService.UpdateProductAsync(
            id,
            request.Name,
            request.Price,
            request.Stock
        );

        if (updatedProduct == null)
        {
            return NotFound(new ErrorResponse
            {
                StatusCode = 404,
                Message = "找不到指定的 Product"
            });
        }

        return Ok(updatedProduct);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var deleted = await _productService.DeleteProductAsync(id);

        if (!deleted)
        {
            return NotFound(new ErrorResponse
            {
                StatusCode = 404,
                Message = "找不到指定的 Product"
            });
        }

        return NoContent();
    }
}