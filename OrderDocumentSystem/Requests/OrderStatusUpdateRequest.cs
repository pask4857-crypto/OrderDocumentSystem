using System.ComponentModel.DataAnnotations;

namespace OrderDocumentSystem.Requests;

public class OrderStatusUpdateRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}