import os
import sys

import pytest


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app import create_app  # noqa: E402
from ast_parser import parse_code_to_structured_ast  # noqa: E402


@pytest.fixture()
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_parse_python_extracts_core_features():
    code = """
def foo(n):
    total = 0
    for i in range(n):
        if i % 2 == 0:
            total += i
    return total
"""

    parsed = parse_code_to_structured_ast(code=code, language="python")

    assert parsed["language"] == "python"
    assert parsed["summary"]["functions_count"] >= 1
    assert parsed["summary"]["loops_count"] >= 1
    assert parsed["summary"]["conditions_count"] >= 1
    assert parsed["summary"]["variables_count"] >= 1


def test_parse_java_extracts_core_features():
    code = """
class Main {
    static int sum(int n) {
        int total = 0;
        for (int i = 0; i < n; i++) {
            if (i % 2 == 0) {
                total += i;
            }
        }
        return total;
    }
}
"""

    parsed = parse_code_to_structured_ast(code=code, language="java")

    assert parsed["language"] == "java"
    assert parsed["summary"]["functions_count"] >= 1
    assert parsed["summary"]["loops_count"] >= 1
    assert parsed["summary"]["conditions_count"] >= 1
    assert parsed["summary"]["variables_count"] >= 1


def test_parse_ast_endpoint_returns_structured_payload(client):
    payload = {
        "language": "python",
        "code": "def f(n):\n    x = 0\n    while x < n:\n        x += 1\n    return x\n",
    }

    response = client.post("/api/parse-ast", json=payload)
    body = response.get_json()

    assert response.status_code == 200
    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["language"] == "python"
    assert "features" in body["data"]
    assert "ast" in body["data"]


def test_parse_ast_endpoint_rejects_unsupported_language(client):
    payload = {
        "language": "cpp",
        "code": "int main(){return 0;}",
    }

    response = client.post("/api/parse-ast", json=payload)
    body = response.get_json()

    assert response.status_code == 400
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_INPUT"
