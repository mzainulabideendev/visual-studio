namespace HelloVs.Services;

/// <summary>Writes a greeting for the console sample.</summary>
public sealed class Greeter
{
    private readonly string _name;

    public Greeter(string name)
    {
        _name = name ?? throw new ArgumentNullException(nameof(name));
    }

    public string Greet() => $"Hello, {_name}! This solution was built by the reconstructed IDE shell.";
}
