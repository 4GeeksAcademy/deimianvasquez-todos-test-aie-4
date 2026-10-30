def calculator(a, b, operation):
    """
    Realiza una operación matemática básica entre dos números.

    Args:
        a (int | float): El primer número.
        b (int | float): El segundo número.
        operation (str): La operación a realizar. Puede ser "add", "subtract", "multiply" o "divide".

    Returns:
        int | float: El resultado de la operación.

    Raises:
        ValueError: Si la operación es inválida o si se intenta dividir por cero.
    
    Examples:
        >>> calculator(5, 3, "add")
        8
        >>> calculator(5, 3, "subtract")
        2
        >>> calculator(5, 3, "multiply")
        15
        >>> calculator(6, 3, "divide")
        2.0
        >>> calculator(5, 0, "divide")
        Traceback (most recent call last):
        ...
        ValueError: No se puede dividir por cero
        >>> calculator(5, 3, "modulus")
        Traceback (most recent call last):
        ...
        ValueError: Operación inválida
    """
    if operation == "add":
        return a + b
    elif operation == "subtract":
        return a - b
    elif operation == "multiply":
        return a * b
    elif operation == "divide":
        if b == 0:
            raise ValueError("No se puede dividir por cero")
        return a / b
    else:
        raise ValueError("Operación inválida")

