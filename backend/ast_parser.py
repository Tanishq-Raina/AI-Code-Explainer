"""
ast_parser.py
-------------
Language-aware AST parsing and normalization for simulator-ready analysis.

This module currently supports basic Java and Python syntax using tree-sitter
grammars and extracts core constructs needed by a complexity simulator:

* Functions
* Loops
* Conditions
* Variables

The output is intentionally stable and language-agnostic so the simulation
engine can consume one shape regardless of source language.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

from tree_sitter import Language, Parser
import tree_sitter_java as tsjava
import tree_sitter_python as tspython


@dataclass(frozen=True)
class LanguageConfig:
    key: str
    parser_language: Language
    function_nodes: set
    loop_nodes: set
    condition_nodes: set


JAVA_LANGUAGE = Language(tsjava.language())
PYTHON_LANGUAGE = Language(tspython.language())

LANGUAGE_CONFIG: Dict[str, LanguageConfig] = {
    "java": LanguageConfig(
        key="java",
        parser_language=JAVA_LANGUAGE,
        function_nodes={"method_declaration", "constructor_declaration"},
        loop_nodes={
            "for_statement",
            "enhanced_for_statement",
            "while_statement",
            "do_statement",
        },
        condition_nodes={"if_statement", "switch_expression", "switch_statement"},
    ),
    "python": LanguageConfig(
        key="python",
        parser_language=PYTHON_LANGUAGE,
        function_nodes={"function_definition"},
        loop_nodes={"for_statement", "while_statement"},
        condition_nodes={"if_statement", "conditional_expression", "match_statement"},
    ),
}


def parse_code_to_structured_ast(code: str, language: str) -> dict:
    """
    Parse source code and return a normalized AST summary.

    Raises:
        ValueError: when input language is unsupported.
    """
    lang_key = (language or "").strip().lower()
    config = LANGUAGE_CONFIG.get(lang_key)
    if config is None:
        raise ValueError(f"Unsupported language '{language}'. Supported: java, python")

    parser = Parser(config.parser_language)
    source_bytes = code.encode("utf-8")
    tree = parser.parse(source_bytes)
    root = tree.root_node

    features = {
        "functions": [],
        "loops": [],
        "conditions": [],
        "variables": [],
    }
    parse_errors: List[dict] = []

    _walk_tree(
        node=root,
        source=source_bytes,
        config=config,
        features=features,
        parse_errors=parse_errors,
    )

    return {
        "language": lang_key,
        "has_errors": bool(parse_errors) or root.has_error,
        "parse_errors": parse_errors,
        "summary": {
            "functions_count": len(features["functions"]),
            "loops_count": len(features["loops"]),
            "conditions_count": len(features["conditions"]),
            "variables_count": len(features["variables"]),
        },
        "features": features,
        # Keep enough depth for frontend timeline builders to inspect
        # nested statements, call expressions, and function bodies.
        "ast": _serialize_node(root, source_bytes, max_depth=80),
    }


def _walk_tree(node, source: bytes, config: LanguageConfig, features: dict, parse_errors: list):
    if node.type == "ERROR" or getattr(node, "is_missing", False):
        parse_errors.append(
            {
                "type": node.type,
                "line": node.start_point[0] + 1,
                "column": node.start_point[1] + 1,
                "snippet": _node_text(node, source),
            }
        )

    if node.type in config.function_nodes:
        features["functions"].append(_extract_function(node, source, config.key))

    if node.type in config.loop_nodes:
        features["loops"].append(_extract_construct(node, source, "loop"))

    if node.type in config.condition_nodes:
        features["conditions"].append(_extract_construct(node, source, "condition"))

    variable_info = _extract_variable(node, source, config.key)
    if variable_info is not None:
        features["variables"].append(variable_info)

    for child in node.children:
        _walk_tree(child, source, config, features, parse_errors)


def _extract_function(node, source: bytes, language: str) -> dict:
    name_node = node.child_by_field_name("name")
    params = []

    params_node = node.child_by_field_name("parameters")
    if params_node is not None:
        params = _extract_identifiers(params_node, source)

    return {
        "node_type": node.type,
        "name": _node_text(name_node, source) if name_node else None,
        "parameters": params,
        "line": node.start_point[0] + 1,
        "column": node.start_point[1] + 1,
        "snippet": _node_text(node, source),
        "language": language,
    }


def _extract_construct(node, source: bytes, construct_kind: str) -> dict:
    return {
        "kind": construct_kind,
        "node_type": node.type,
        "line": node.start_point[0] + 1,
        "column": node.start_point[1] + 1,
        "snippet": _node_text(node, source),
    }


def _extract_variable(node, source: bytes, language: str) -> Optional[dict]:
    if language == "java" and node.type == "variable_declarator":
        name_node = node.child_by_field_name("name")
        value_node = node.child_by_field_name("value")
        return {
            "node_type": node.type,
            "name": _node_text(name_node, source) if name_node else None,
            "assigned_value": _node_text(value_node, source) if value_node else None,
            "line": node.start_point[0] + 1,
            "column": node.start_point[1] + 1,
            "snippet": _node_text(node, source),
        }

    if language == "python" and node.type in {"assignment", "augmented_assignment"}:
        identifiers = _extract_identifiers(node, source)
        if not identifiers:
            return None
        return {
            "node_type": node.type,
            "name": identifiers[0],
            "targets": identifiers,
            "line": node.start_point[0] + 1,
            "column": node.start_point[1] + 1,
            "snippet": _node_text(node, source),
        }

    if language == "python" and node.type == "parameters":
        names = _extract_identifiers(node, source)
        if not names:
            return None
        return {
            "node_type": node.type,
            "name": names[0],
            "targets": names,
            "line": node.start_point[0] + 1,
            "column": node.start_point[1] + 1,
            "snippet": _node_text(node, source),
        }

    return None


def _extract_identifiers(node, source: bytes) -> List[str]:
    found: List[str] = []
    stack = [node]
    while stack:
        current = stack.pop()
        if current.type == "identifier":
            name = _node_text(current, source)
            if name and name not in found:
                found.append(name)
        for child in reversed(current.children):
            stack.append(child)
    return found


def _serialize_node(node, source: bytes, max_depth: int, depth: int = 0) -> dict:
    payload = {
        "type": node.type,
        "line": node.start_point[0] + 1,
        "column": node.start_point[1] + 1,
        "snippet": _node_text(node, source),
    }

    if depth >= max_depth:
        payload["children"] = []
        return payload

    payload["children"] = [
        _serialize_node(child, source, max_depth=max_depth, depth=depth + 1)
        for child in node.children
    ]
    return payload


def _node_text(node, source: bytes) -> str:
    if node is None:
        return ""
    return source[node.start_byte:node.end_byte].decode("utf-8", errors="replace").strip()
