using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.EntityFrameworkCore;
using OrderDocumentSystem.Data;

namespace OrderDocumentSystem.Services;

public class WordDocumentService
{
    private readonly AppDbContext _dbContext;

    public WordDocumentService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<string?> GenerateOrderDocumentAsync(int orderId)
    {
        var order = await _dbContext.Orders
            .Include(order => order.Customer)
            .Include(order => order.OrderDetails)
                .ThenInclude(detail => detail.Product)
            .FirstOrDefaultAsync(order => order.Id == orderId);

        if (order == null)
        {
            return null;
        }

        var folderPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "Documents"
        );

        Directory.CreateDirectory(folderPath);

        var fileName = $"Order_{order.Id}.docx";

        var filePath = Path.Combine(
            folderPath,
            fileName
        );

        using (var wordDocument = WordprocessingDocument.Create(
            filePath,
            DocumentFormat.OpenXml.WordprocessingDocumentType.Document))
        {
            var mainPart = wordDocument.AddMainDocumentPart();

            mainPart.Document =
                new DocumentFormat.OpenXml.Wordprocessing.Document();

            var body = new Body();

            body.Append(
                new Paragraph(
                    new Run(
                        new RunProperties(
                            new Bold(),
                            new FontSize { Val = "32" }
                        ),
                        new Text("訂單文件")
                    )
                )
            );

            body.Append(
                new Paragraph(
                    new Run(
                        new Text($"訂單編號：{order.Id}")
                    )
                )
            );

            body.Append(
                new Paragraph(
                    new Run(
                        new Text($"客戶：{order.Customer?.Name}")
                    )
                )
            );

            body.Append(
                new Paragraph(
                    new Run(
                        new Text($"Email：{order.Customer?.Email}")
                    )
                )
            );

            body.Append(
                new Paragraph(
                    new Run(
                        new Text(
                            $"訂單日期：{order.OrderDate:yyyy/MM/dd HH:mm}"
                        )
                    )
                )
            );

            body.Append(
                new Paragraph(
                    new Run(
                        new Text($"訂單狀態：{order.Status}")
                    )
                )
            );

            body.Append(
                new Paragraph(
                    new Run(
                        new Text("訂單明細")
                    )
                )
            );

            var table = new Table();

            var tableProperties = new TableProperties(
                new TableBorders(
                    new TopBorder
                    {
                        Val = BorderValues.Single,
                        Size = 4
                    },
                    new BottomBorder
                    {
                        Val = BorderValues.Single,
                        Size = 4
                    },
                    new LeftBorder
                    {
                        Val = BorderValues.Single,
                        Size = 4
                    },
                    new RightBorder
                    {
                        Val = BorderValues.Single,
                        Size = 4
                    },
                    new InsideHorizontalBorder
                    {
                        Val = BorderValues.Single,
                        Size = 4
                    },
                    new InsideVerticalBorder
                    {
                        Val = BorderValues.Single,
                        Size = 4
                    }
                )
            );

            table.AppendChild(tableProperties);

            // 表頭
            var headerRow = new TableRow();

            headerRow.Append(
                CreateTableCell("商品名稱", true)
            );

            headerRow.Append(
                CreateTableCell("單價", true)
            );

            headerRow.Append(
                CreateTableCell("數量", true)
            );

            headerRow.Append(
                CreateTableCell("小計", true)
            );

            table.Append(headerRow);

            // 訂單明細
            foreach (var detail in order.OrderDetails)
            {
                var row = new TableRow();

                row.Append(
                    CreateTableCell(
                        detail.Product?.Name ?? "未知商品"
                    )
                );

                row.Append(
                    CreateTableCell(
                        $"NT$ {detail.UnitPrice:N0}"
                    )
                );

                row.Append(
                    CreateTableCell(
                        detail.Quantity.ToString()
                    )
                );

                var subtotal =
                    detail.UnitPrice * detail.Quantity;

                row.Append(
                    CreateTableCell(
                        $"NT$ {subtotal:N0}"
                    )
                );

                table.Append(row);
            }

            body.Append(table);

            body.Append(
                new Paragraph(
                    new Run(
                        new RunProperties(
                            new Bold(),
                            new FontSize { Val = "28" }
                        ),
                        new Text(
                            $"總金額：NT$ {order.OrderDetails.Sum(detail => detail.UnitPrice * detail.Quantity):N0}"
                        )
                    )
                )
            );

            mainPart.Document.Append(body);
            mainPart.Document.Save();
        }

        return filePath;
    }

    private static TableCell CreateTableCell(
        string text,
        bool bold = false)
    {
        var run = new Run();

        if (bold)
        {
            run.Append(
                new RunProperties(
                    new Bold()
                )
            );
        }

        run.Append(
            new Text(text)
        );

        return new TableCell(
            new Paragraph(run)
        );
    }
}