import pytest

from utils.calculator import calculator


def test_calculator_addition():
    assert calculator(5, 3, "add") == 8


def test_calculator_subtraction():
    assert calculator(5, 3, "subtract") == 2


def test_calculator_multiplication():
    assert calculator(5, 3, "multiply") == 15


def test_calculator_division():
    assert calculator(6, 3, "divide") == 2


def test_calculator_division_by_zero():
    with pytest.raises(ValueError, match="No se puede dividir por cero"):
        calculator(5, 0, "divide")


def test_calculator_rejects_invalid_operation():
    with pytest.raises(ValueError, match="Operación inválida"):
        calculator(5, 3, "modulus")