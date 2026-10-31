# HelloVs

A tiny console project used to exercise the reconstructed Visual Studio shell:

- **Solution Explorer** – browse `Program.cs`, `Services/Greeter.cs`, and the project file.
- **Build** (`Ctrl+Shift+B`) – runs `dotnet build` on `HelloVs.csproj`. The intentionally
  unused local in `Program.cs` produces warning **CS0219**, which lands in the Error List.
- **Terminal** (`Ctrl+``) – run `dotnet run` in this folder to execute the program.
- **Search** (`Ctrl+Shift+F`) – search for `Greeter` across the workspace.

Nothing here depends on the clone; it is an ordinary .NET 10 console project.
