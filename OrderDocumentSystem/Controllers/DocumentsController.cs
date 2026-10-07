using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderDocumentSystem.Services;

namespace OrderDocumentSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly WordDocumentService _wordDocumentService;

    public DocumentsController(
        WordDocumentService wordDocumentService)
    {
        _wordDocumentService = wordDocumentService;
    }

    [HttpGet("orders/{orderId}")]
    public async Task<IActionResult> GenerateOrderDocument(
        int orderId)
    {
        var filePath =
            await _wordDocumentService.GenerateOrderDocumentAsync(
                orderId
            );

        if (filePath == null)
        {
            return NotFound(new
            {
                message = "找不到指定的 Order"
            });
        }

        var fileBytes = await System.IO.File.ReadAllBytesAsync(
            filePath
        );

        return File(
            fileBytes,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            Path.GetFileName(filePath)
        );
    }
}