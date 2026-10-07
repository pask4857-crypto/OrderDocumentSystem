namespace OrderDocumentSystem.Responses;

public class OrderStatusUpdateResult
{
    public bool Success { get; set; }

    public int StatusCode { get; set; }

    public string Message { get; set; } = string.Empty;

    public OrderResponse? Order { get; set; }
}