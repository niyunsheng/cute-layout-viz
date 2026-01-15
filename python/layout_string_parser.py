"""
Layout String Parser
Parse CUTLASS 4.0 CuTe Layout strings in Shape:Stride format
"""


def parse_layout_string(layout_str):
    """
    Parse layout string in Shape:Stride format

    Args:
        layout_str: String in format "Shape:Stride", e.g., "(12,(4,8)):(59,(13,1))"

    Returns:
        dict with 'shape' and 'stride' keys

    Raises:
        ValueError: If the input format is invalid
        TypeError: If the input is not a string

    Examples:
        >>> parse_layout_string("12:1")
        {'shape': 12, 'stride': 1}

        >>> parse_layout_string("(4,8):(1,4)")
        {'shape': (4, 8), 'stride': (1, 4)}

        >>> parse_layout_string("(12,(4,8)):(59,(13,1))")
        {'shape': (12, (4, 8)), 'stride': (59, (13, 1))}
    """
    # Input validation
    if not isinstance(layout_str, str):
        raise TypeError(f'Input must be a string, got {type(layout_str).__name__}')

    if not layout_str or not layout_str.strip():
        raise ValueError('Input string cannot be empty')

    # Remove spaces
    cleaned = layout_str.replace(' ', '')

    # Check for colon
    if ':' not in cleaned:
        raise ValueError('Format error: Missing colon separator. Expected format "Shape:Stride"')

    # Split by colon
    parts = cleaned.split(':')
    if len(parts) != 2:
        raise ValueError(f'Format error: Expected exactly one colon separator, found {len(parts) - 1}')

    if not parts[0] or not parts[1]:
        raise ValueError('Format error: Both shape and stride must be specified')

    # Check for balanced parentheses first (before structure check)
    def check_balanced_parens(s, name):
        """Check if parentheses are balanced"""
        if s.count('(') != s.count(')'):
            raise ValueError(f'Format error: Unbalanced parentheses in {name}')

    check_balanced_parens(parts[0], 'shape')
    check_balanced_parens(parts[1], 'stride')

    # Pre-validate: check that shape and stride have matching structure
    # Count parentheses and commas at depth 0
    def get_structure_signature(s):
        """Get structure signature: (paren_count, comma_count)"""
        paren_count = s.count('(')
        depth = 0
        comma_count = 0
        for char in s:
            if char == '(':
                depth += 1
            elif char == ')':
                depth -= 1
            elif char == ',' and depth == 0:
                comma_count += 1
        return (paren_count, comma_count)

    shape_sig = get_structure_signature(parts[0])
    stride_sig = get_structure_signature(parts[1])

    if shape_sig != stride_sig:
        raise ValueError(
            f'Structure mismatch: Shape and stride have different structures. '
            f'Shape has {shape_sig[0]} parentheses and {shape_sig[1]} top-level commas, '
            f'but stride has {stride_sig[0]} parentheses and {stride_sig[1]} top-level commas.'
        )

    def parse_value(s):
        """Recursively parse nested tuples"""
        s = s.strip()

        if not s:
            raise ValueError('Format error: Empty value encountered')

        # Check for invalid characters
        valid_chars = set('0123456789(),- ')
        if not all(c in valid_chars for c in s):
            invalid_chars = set(s) - valid_chars
            raise ValueError(f'Format error: Invalid characters found: {invalid_chars}')

        # Check for balanced parentheses
        if s.count('(') != s.count(')'):
            raise ValueError(f'Format error: Unbalanced parentheses in "{s}"')

        if not s.startswith('('):
            # Single number
            try:
                return int(s)
            except ValueError:
                raise ValueError(f'Format error: Cannot parse "{s}" as integer')

        # Remove outer parentheses
        if s.startswith('(') and s.endswith(')'):
            inner = s[1:-1]

            if not inner:
                raise ValueError('Format error: Empty parentheses "()" are not allowed')

            # Check if there are nested parentheses
            values = []
            depth = 0
            current = ''

            for char in inner:
                if char == '(':
                    depth += 1
                elif char == ')':
                    depth -= 1

                if depth < 0:
                    raise ValueError(f'Format error: Unbalanced parentheses in "{s}"')

                if char == ',' and depth == 0:
                    # Check for empty element before stripping
                    if not current or not current.strip():
                        raise ValueError('Format error: Empty element in tuple (check for double commas or trailing commas)')
                    values.append(parse_value(current))
                    current = ''
                else:
                    current += char

            # Add the last value
            if current:
                if not current.strip():
                    raise ValueError('Format error: Empty element in tuple (trailing whitespace)')
                values.append(parse_value(current))
            elif inner.endswith(','):
                # Trailing comma case
                raise ValueError('Format error: Trailing comma in tuple')

            if len(values) == 0:
                raise ValueError('Format error: Tuple must contain at least one element')

            return tuple(values)  # Return tuple instead of list

        try:
            return int(s)
        except ValueError:
            raise ValueError(f'Format error: Cannot parse "{s}" as integer or tuple')

    try:
        shape = parse_value(parts[0])
        stride = parse_value(parts[1])
    except ValueError as e:
        raise ValueError(f'Error parsing layout "{layout_str}": {str(e)}')

    # Validate that shape and stride have matching structure
    def validate_structure(s, st, name_s="shape", name_st="stride"):
        """Ensure shape and stride have the same structure"""
        if isinstance(s, tuple) and isinstance(st, tuple):
            if len(s) != len(st):
                raise ValueError(
                    f'Structure mismatch: {name_s} has {len(s)} elements '
                    f'but {name_st} has {len(st)} elements'
                )
            for i, (s_elem, st_elem) in enumerate(zip(s, st)):
                validate_structure(s_elem, st_elem, f"{name_s}[{i}]", f"{name_st}[{i}]")
        elif isinstance(s, tuple) or isinstance(st, tuple):
            raise ValueError(
                f'Structure mismatch: {name_s} is {"a tuple" if isinstance(s, tuple) else "a scalar"} '
                f'but {name_st} is {"a tuple" if isinstance(st, tuple) else "a scalar"}'
            )
        # Both are scalars - OK

    validate_structure(shape, stride)

    return {'shape': shape, 'stride': stride}
