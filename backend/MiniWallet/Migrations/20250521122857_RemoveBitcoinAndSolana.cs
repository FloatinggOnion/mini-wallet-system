using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniWallet.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBitcoinAndSolana : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Currencies",
                keyColumn: "Id",
                keyValue: 2);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Currencies",
                columns: new[] { "Id", "IsActive", "Name", "NetworkType", "Symbol" },
                values: new object[] { 2, true, "Bitcoin", "Bitcoin", "BTC" });
        }
    }
}
